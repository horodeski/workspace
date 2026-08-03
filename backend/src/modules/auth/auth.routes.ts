import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authService } from './auth.service.js';
import { registerSchema, loginSchema, refreshSchema } from './auth.schemas.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { ValidationError } from '../../shared/errors/errors.js';
import type { ValidationDetail } from '../../shared/errors/app-error.js';

const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const getDeps = () => ({
    jwtSecret: app.env.JWT_SECRET,
    jwtRefreshSecret: app.env.JWT_REFRESH_SECRET,
  });

  // POST /register
  app.post('/register', async (request, reply) => {
    const result = registerSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const { email, password } = result.data;
    const profile = await authService.register(email, password, getDeps());

    return reply.status(201).send(profile);
  });

  // POST /login
  app.post('/login', async (request, reply) => {
    const result = loginSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const { email, password } = result.data;
    const tokenPair = await authService.login(email, password, getDeps());

    return reply.status(200).send(tokenPair);
  });

  // POST /refresh
  app.post('/refresh', async (request, reply) => {
    const result = refreshSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    const { refreshToken } = result.data;
    const tokenPair = await authService.refresh(refreshToken, getDeps());

    return reply.status(200).send(tokenPair);
  });

  // POST /logout — requires authentication
  app.post('/logout', { preHandler: [authMiddleware] }, async (request, reply) => {
    const body = request.body as { refreshToken?: string };
    const refreshToken = body?.refreshToken;

    if (!refreshToken) {
      throw new ValidationError([
        { path: 'refreshToken', message: 'Refresh token é obrigatório', code: 'invalid_type' },
      ]);
    }

    await authService.logout(request.userId, refreshToken, getDeps());

    return reply.status(204).send();
  });
};

export default authRoutes;
