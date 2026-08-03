import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { reviewsService } from './reviews.service.js';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewWeekParamsSchema,
  reviewHistoryQuerySchema,
} from './reviews.schemas.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { ValidationError } from '../../shared/errors/errors.js';
import type { ValidationDetail } from '../../shared/errors/app-error.js';
import { normalizePaginationOptions } from '../../shared/utils/pagination.js';

export const reviewsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // All routes in this plugin require authentication
  app.addHook('preHandler', authMiddleware);

  // GET /api/v1/reviews/history — get week history
  // Registered BEFORE /:year/:week to avoid route parameter conflicts
  app.get('/history', async (request, reply) => {
    const result = reviewHistoryQuerySchema.safeParse(request.query);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const history = await reviewsService.getHistory(request.userId, result.data.count);
    return reply.status(200).send(history);
  });

  // GET /api/v1/reviews — paginated list of reviews
  // Registered BEFORE /:year/:week to avoid route parameter conflicts
  app.get('/', async (request, reply) => {
    const query = request.query as { cursor?: string; limit?: string };
    const options = normalizePaginationOptions({
      cursor: query.cursor,
      limit: query.limit ? Number(query.limit) : undefined,
    });

    const reviews = await reviewsService.list(request.userId, options);
    return reply.status(200).send(reviews);
  });

  // GET /api/v1/reviews/:year/:week — get review by week
  app.get('/:year/:week', async (request, reply) => {
    const result = reviewWeekParamsSchema.safeParse(request.params);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const review = await reviewsService.getByWeek(
      request.userId,
      result.data.year,
      result.data.week
    );

    if (!review) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Revisão não encontrada para esta semana',
      });
    }

    return reply.status(200).send(review);
  });

  // POST /api/v1/reviews — create a new review
  app.post('/', async (request, reply) => {
    const result = createReviewSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const review = await reviewsService.create(request.userId, result.data);
    return reply.status(201).send(review);
  });

  // PUT /api/v1/reviews/:id — update an existing review
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = updateReviewSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const review = await reviewsService.update(request.userId, id, result.data);
    return reply.status(200).send(review);
  });

  // POST /api/v1/reviews/:id/unlock — unlock a review for editing
  app.post('/:id/unlock', async (request, reply) => {
    const { id } = request.params as { id: string };
    const review = await reviewsService.unlock(request.userId, id);
    return reply.status(200).send(review);
  });
};
