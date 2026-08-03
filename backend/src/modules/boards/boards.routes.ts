import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { boardsService } from './boards.service.js';
import {
  createBoardSchema,
  renameBoardSchema,
  createItemSchema,
  updateItemSchema,
  updatePositionSchema,
  updateSizeSchema,
  batchUpdateSchema,
} from './boards.schemas.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { ValidationError } from '../../shared/errors/errors.js';
import type { ValidationDetail } from '../../shared/errors/app-error.js';

export const boardsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // All routes in this plugin require authentication
  app.addHook('preHandler', authMiddleware);

  // GET /api/v1/boards — list all boards for the authenticated user
  app.get('/', async (request, reply) => {
    const boards = await boardsService.listBoards(request.userId);
    return reply.status(200).send(boards);
  });

  // POST /api/v1/boards — create a new board
  app.post('/', async (request, reply) => {
    const result = createBoardSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const board = await boardsService.createBoard(request.userId, result.data.name);
    return reply.status(201).send(board);
  });

  // GET /api/v1/boards/:id — get a board with its items
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const board = await boardsService.getBoard(request.userId, id);
    return reply.status(200).send(board);
  });

  // PATCH /api/v1/boards/:id — rename a board
  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = renameBoardSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const board = await boardsService.renameBoard(request.userId, id, result.data.name);
    return reply.status(200).send(board);
  });

  // DELETE /api/v1/boards/:id — soft-delete a board
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await boardsService.deleteBoard(request.userId, id);
    return reply.status(204).send();
  });

  // POST /api/v1/boards/:boardId/items — create a new board item
  app.post('/:boardId/items', async (request, reply) => {
    const { boardId } = request.params as { boardId: string };
    const result = createItemSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const item = await boardsService.createItem(request.userId, boardId, result.data);
    return reply.status(201).send(item);
  });

  // PATCH /api/v1/boards/:boardId/items/:id — update item content
  app.patch('/:boardId/items/:id', async (request, reply) => {
    const { boardId, id } = request.params as { boardId: string; id: string };
    const result = updateItemSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const item = await boardsService.updateItem(request.userId, boardId, id, result.data);
    return reply.status(200).send(item);
  });

  // DELETE /api/v1/boards/:boardId/items/:id — soft-delete a board item
  app.delete('/:boardId/items/:id', async (request, reply) => {
    const { boardId, id } = request.params as { boardId: string; id: string };
    await boardsService.deleteItem(request.userId, boardId, id);
    return reply.status(204).send();
  });

  // PATCH /api/v1/boards/:boardId/items/:id/position — update item position
  app.patch('/:boardId/items/:id/position', async (request, reply) => {
    const { boardId, id } = request.params as { boardId: string; id: string };
    const result = updatePositionSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const item = await boardsService.updatePosition(request.userId, boardId, id, result.data);
    return reply.status(200).send(item);
  });

  // PATCH /api/v1/boards/:boardId/items/:id/size — update item size
  app.patch('/:boardId/items/:id/size', async (request, reply) => {
    const { boardId, id } = request.params as { boardId: string; id: string };
    const result = updateSizeSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const item = await boardsService.updateSize(request.userId, boardId, id, result.data);
    return reply.status(200).send(item);
  });

  // PATCH /api/v1/boards/:boardId/items/batch-update — batch update positions/sizes
  app.patch('/:boardId/items/batch-update', async (request, reply) => {
    const { boardId } = request.params as { boardId: string };
    const result = batchUpdateSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const items = await boardsService.batchUpdate(request.userId, boardId, result.data.items);
    return reply.status(200).send(items);
  });
};
