import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { activitiesService } from './activities.service.js';
import {
  createActivitySchema,
  updateActivitySchema,
  toggleCompletionSchema,
  activityQuerySchema,
} from './activities.schemas.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { ValidationError } from '../../shared/errors/errors.js';
import type { ValidationDetail } from '../../shared/errors/app-error.js';

export const activitiesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // All routes in this plugin require authentication
  app.addHook('preHandler', authMiddleware);

  // GET /api/v1/activities — list activities by date or date range
  app.get('/', async (request, reply) => {
    const result = activityQuerySchema.safeParse(request.query);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const { date, startDate, endDate } = result.data;

    if (date) {
      const activities = await activitiesService.getByDate(request.userId, date);
      return reply.status(200).send(activities);
    }

    // startDate and endDate are guaranteed by schema validation
    const activities = await activitiesService.getByRange(
      request.userId,
      startDate!,
      endDate!
    );
    return reply.status(200).send(activities);
  });

  // POST /api/v1/activities — create a new activity
  app.post('/', async (request, reply) => {
    const result = createActivitySchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const activity = await activitiesService.create(request.userId, result.data);
    return reply.status(201).send(activity);
  });

  // PUT /api/v1/activities/:id — update an existing activity
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = updateActivitySchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const activity = await activitiesService.update(request.userId, id, result.data);
    return reply.status(200).send(activity);
  });

  // DELETE /api/v1/activities/:id — soft-delete an activity
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await activitiesService.delete(request.userId, id);
    return reply.status(204).send();
  });

  // PATCH /api/v1/activities/:id/toggle — toggle completion for a specific date
  app.patch('/:id/toggle', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = toggleCompletionSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    await activitiesService.toggleCompletion(request.userId, id, result.data.date);
    return reply.status(200).send({ success: true });
  });
};
