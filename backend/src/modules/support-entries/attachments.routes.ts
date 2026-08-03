import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { prisma } from '../../shared/database/prisma.js';
import {
  saveFile,
  deleteFile,
  SUPPORT_ENTRY_ALLOWED_MIMES,
} from '../../shared/utils/storage.js';
import { NotFoundError } from '../../shared/errors/errors.js';
import { AppError } from '../../shared/errors/app-error.js';

const MAX_FILE_SIZE_MB = 5;

/**
 * Support entry attachment routes:
 * - POST /api/v1/support-entries/:id/attachments — upload file (max 5MB)
 * - DELETE /api/v1/support-entries/:id/attachments/:attachmentId — delete file
 */
export const supportEntryAttachmentsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', authMiddleware);

  // POST /:id/attachments — Upload file attachment
  app.post('/:id/attachments', async (request, reply) => {
    const { id } = request.params as { id: string };
    const uploadDir = (request.server as any).env.UPLOAD_DIR as string;

    // Verify support entry belongs to authenticated user
    const entry = await prisma.supportEntry.findFirst({
      where: { id, userId: request.userId, deletedAt: null },
    });

    if (!entry) {
      throw new NotFoundError('Entrada de apoio');
    }

    // Parse multipart file
    const file = await request.file();

    if (!file) {
      throw new AppError(400, 'Bad Request', 'Nenhum arquivo enviado');
    }

    // Save file with MIME and size validation
    const result = await saveFile(file, uploadDir, MAX_FILE_SIZE_MB, SUPPORT_ENTRY_ALLOWED_MIMES);

    // Create attachment record in database
    const attachment = await prisma.supportEntryAttachment.create({
      data: {
        supportEntryId: id,
        name: result.name,
        mimeType: result.mimeType,
        size: result.size,
        path: result.path,
      },
    });

    return reply.status(201).send({
      id: attachment.id,
      supportEntryId: attachment.supportEntryId,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      createdAt: attachment.createdAt,
    });
  });

  // DELETE /:id/attachments/:attachmentId — Remove attachment
  app.delete('/:id/attachments/:attachmentId', async (request, reply) => {
    const { id, attachmentId } = request.params as { id: string; attachmentId: string };

    // Verify support entry belongs to authenticated user
    const entry = await prisma.supportEntry.findFirst({
      where: { id, userId: request.userId, deletedAt: null },
    });

    if (!entry) {
      throw new NotFoundError('Entrada de apoio');
    }

    // Verify attachment belongs to this support entry
    const attachment = await prisma.supportEntryAttachment.findFirst({
      where: { id: attachmentId, supportEntryId: id },
    });

    if (!attachment) {
      throw new NotFoundError('Anexo');
    }

    // Delete file from storage
    await deleteFile(attachment.path);

    // Delete record from database
    await prisma.supportEntryAttachment.delete({
      where: { id: attachmentId },
    });

    return reply.status(204).send();
  });
};
