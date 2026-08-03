import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { syncService } from './sync.service.js';
import { localStorageImportSchema, syncPushSchema } from './sync.schemas.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { ValidationError } from '../../shared/errors/errors.js';
import type { ValidationDetail } from '../../shared/errors/app-error.js';

export const syncRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // All routes in this plugin require authentication
  app.addHook('preHandler', authMiddleware);

  // POST /api/v1/sync/import — import localStorage data
  app.post('/import', async (request, reply) => {
    const result = localStorageImportSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const importResult = await syncService.importFromLocalStorage(
      request.userId,
      result.data
    );

    return reply.status(200).send(importResult);
  });

  // POST /api/v1/sync/push — push offline operations for reconciliation
  app.post('/push', async (request, reply) => {
    const result = syncPushSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const pushResult = await syncService.pushOfflineOperations(
      request.userId,
      result.data.operations
    );

    return reply.status(200).send(pushResult);
  });
};
