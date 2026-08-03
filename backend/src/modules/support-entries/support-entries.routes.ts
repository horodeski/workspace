import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { supportEntriesService } from './support-entries.service.js';
import { createSupportEntrySchema, updateSupportEntrySchema } from './support-entries.schemas.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { ValidationError } from '../../shared/errors/errors.js';
import type { ValidationDetail } from '../../shared/errors/app-error.js';

export const supportEntriesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // All routes in this plugin require authentication
  app.addHook('preHandler', authMiddleware);

  // GET /api/v1/support-entries — list active support entries
  app.get('/', async (request, reply) => {
    const entries = await supportEntriesService.listActive(request.userId);
    return reply.status(200).send(entries);
  });

  // POST /api/v1/support-entries — create a new support entry
  app.post('/', async (request, reply) => {
    const result = createSupportEntrySchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const entry = await supportEntriesService.create(request.userId, result.data);
    return reply.status(201).send(entry);
  });

  // DELETE /api/v1/support-entries/:id — soft-delete a support entry
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await supportEntriesService.delete(request.userId, id);
    return reply.status(204).send();
  });

  // PATCH /api/v1/support-entries/:id — update a support entry
  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = updateSupportEntrySchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const entry = await supportEntriesService.update(request.userId, id, result.data);
    return reply.status(200).send(entry);
  });

  // GET /api/v1/support-entries/formatted-text — get formatted text of all active entries
  app.get('/formatted-text', async (request, reply) => {
    const text = await supportEntriesService.getFormattedText(request.userId);
    return reply.status(200).send({ text });
  });

  // POST /api/v1/support-entries/clear — finalize all active entries
  app.post('/clear', async (request, reply) => {
    const result = await supportEntriesService.clearAll(request.userId);
    return reply.status(200).send({ count: result.count });
  });
};
