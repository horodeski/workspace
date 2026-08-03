import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { prisma } from '../../shared/database/prisma.js';
import {
  saveFile,
  deleteFile,
  ACTIVITY_ALLOWED_MIMES,
} from '../../shared/utils/storage.js';
import { NotFoundError } from '../../shared/errors/errors.js';
import { AppError } from '../../shared/errors/app-error.js';

const MAX_FILE_SIZE_MB = 10;

/**
 * Activity attachment routes:
 * - POST /api/v1/activities/:id/attachments — upload file
 * - DELETE /api/v1/activities/:id/attachments/:attachmentId — delete file
 */
export const activityAttachmentsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', authMiddleware);

  // POST /:id/attachments — Upload file attachment
  app.post('/:id/attachments', async (request, reply) => {
    const { id } = request.params as { id: string };
    const uploadDir = (request.server as any).env.UPLOAD_DIR as string;

    // Verify activity belongs to authenticated user
    const activity = await prisma.activity.findFirst({
      where: { id, userId: request.userId, deletedAt: null },
    });

    if (!activity) {
      throw new NotFoundError('Atividade');
    }

    // Parse multipart file
    const file = await request.file();

    if (!file) {
      throw new AppError(400, 'Bad Request', 'Nenhum arquivo enviado');
    }

    // saveFile validates MIME and size, throws on invalid
    const saved = await saveFile(file, uploadDir, MAX_FILE_SIZE_MB, ACTIVITY_ALLOWED_MIMES);

    // Create attachment record in database
    const attachment = await prisma.activityAttachment.create({
      data: {
        activityId: id,
        name: saved.name,
        mimeType: saved.mimeType,
        size: saved.size,
        path: saved.path,
      },
    });

    return reply.status(201).send({
      id: attachment.id,
      activityId: attachment.activityId,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      createdAt: attachment.createdAt,
    });
  });

  // DELETE /:id/attachments/:attachmentId — Remove attachment
  app.delete('/:id/attachments/:attachmentId', async (request, reply) => {
    const { id, attachmentId } = request.params as { id: string; attachmentId: string };

    // Verify activity belongs to authenticated user
    const activity = await prisma.activity.findFirst({
      where: { id, userId: request.userId, deletedAt: null },
    });

    if (!activity) {
      throw new NotFoundError('Atividade');
    }

    // Verify attachment belongs to this activity
    const attachment = await prisma.activityAttachment.findFirst({
      where: { id: attachmentId, activityId: id },
    });

    if (!attachment) {
      throw new NotFoundError('Anexo');
    }

    // Delete file from storage
    await deleteFile(attachment.path);

    // Delete record from database
    await prisma.activityAttachment.delete({
      where: { id: attachmentId },
    });

    return reply.status(204).send();
  });
};

/**
 * Attachment download route:
 * - GET /api/v1/attachments/:id/download — serve file
 *
 * This is registered at a separate prefix since it's not scoped to a specific activity.
 */
export const attachmentDownloadRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', authMiddleware);

  // GET /:id/download — Download attachment file
  app.get('/:id/download', async (request, reply) => {
    const { id } = request.params as { id: string };

    // Find the attachment
    const attachment = await prisma.activityAttachment.findUnique({
      where: { id },
      include: { activity: true },
    });

    if (!attachment) {
      throw new NotFoundError('Anexo');
    }

    // Verify the parent activity belongs to the authenticated user
    if (attachment.activity.userId !== request.userId) {
      throw new NotFoundError('Anexo');
    }

    if (attachment.activity.deletedAt) {
      throw new NotFoundError('Anexo');
    }

    // Verify the file exists on disk
    const filePath = attachment.path;

    try {
      await stat(filePath);
    } catch {
      throw new NotFoundError('Arquivo');
    }

    // Stream file with correct headers
    const fileStream = createReadStream(filePath);

    reply.header('Content-Type', attachment.mimeType);
    reply.header(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(attachment.name)}"`,
    );
    reply.header('Content-Length', attachment.size);

    return reply.send(fileStream);
  });
};
