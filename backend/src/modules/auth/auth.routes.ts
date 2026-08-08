import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authService } from './auth.service.js';
import { registerSchema, loginSchema, refreshSchema, verifyEmailSchema } from './auth.schemas.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { ValidationError } from '../../shared/errors/errors.js';
import type { ValidationDetail } from '../../shared/errors/app-error.js';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

function setRefreshCookie(reply: import('fastify').FastifyReply, token: string, isProduction: boolean) {
  reply.setCookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  });
}

function clearRefreshCookie(reply: import('fastify').FastifyReply, isProduction: boolean) {
  reply.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/v1/auth',
  });
}

const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const getDeps = () => ({
    jwtSecret: app.env.JWT_SECRET,
    jwtRefreshSecret: app.env.JWT_REFRESH_SECRET,
    bcryptRounds: app.env.BCRYPT_ROUNDS,
    resendApiKey: app.env.RESEND_API_KEY,
    emailFrom: app.env.EMAIL_FROM,
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

    const { email, password, name } = result.data;
    const profile = await authService.register(email, password, getDeps(), name);

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

    setRefreshCookie(reply, tokenPair.refreshToken, app.env.NODE_ENV === 'production');
    return reply.status(200).send(tokenPair);
  });

  // POST /refresh
  app.post('/refresh', async (request, reply) => {
    // Accept refresh token from httpOnly cookie OR request body (backwards compatible)
    const cookieToken = request.cookies?.[REFRESH_COOKIE_NAME];
    const bodyResult = refreshSchema.safeParse(request.body);

    const refreshToken = cookieToken || (bodyResult.success ? bodyResult.data.refreshToken : undefined);

    if (!refreshToken) {
      const details: ValidationDetail[] = [
        { path: 'refreshToken', message: 'Refresh token é obrigatório', code: 'invalid_type' },
      ];
      throw new ValidationError(details);
    }

    const tokenPair = await authService.refresh(refreshToken, getDeps());

    setRefreshCookie(reply, tokenPair.refreshToken, app.env.NODE_ENV === 'production');
    return reply.status(200).send(tokenPair);
  });

  // POST /logout — requires authentication
  app.post('/logout', { preHandler: [authMiddleware] }, async (request, reply) => {
    const body = request.body as { refreshToken?: string };
    const cookieToken = request.cookies?.[REFRESH_COOKIE_NAME];
    const refreshToken = body?.refreshToken || cookieToken;

    if (!refreshToken) {
      throw new ValidationError([
        { path: 'refreshToken', message: 'Refresh token é obrigatório', code: 'invalid_type' },
      ]);
    }

    await authService.logout(request.userId, refreshToken, getDeps());

    clearRefreshCookie(reply, app.env.NODE_ENV === 'production');
    return reply.status(204).send();
  });

  // POST /logout-all — revokes all sessions for the authenticated user
  app.post('/logout-all', { preHandler: [authMiddleware] }, async (request, reply) => {
    await authService.logoutAll(request.userId, getDeps());

    clearRefreshCookie(reply, app.env.NODE_ENV === 'production');
    return reply.status(204).send();
  });

  // POST /verify-email — verifies email with 6-digit code
  app.post('/verify-email', { preHandler: [authMiddleware] }, async (request, reply) => {
    const result = verifyEmailSchema.safeParse(request.body);

    if (!result.success) {
      const details: ValidationDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new ValidationError(details);
    }

    await authService.verifyEmail(request.userId, result.data.code, getDeps());

    return reply.status(200).send({ verified: true });
  });

  // POST /resend-verification — sends new verification code
  app.post('/resend-verification', { preHandler: [authMiddleware] }, async (request, reply) => {
    await authService.resendVerification(request.userId, getDeps());

    return reply.status(200).send({ sent: true });
  });

  // GET /me — returns authenticated user profile
  app.get('/me', { preHandler: [authMiddleware] }, async (request, reply) => {
    const profile = await authService.getProfile(request.userId);
    if (!profile) {
      return reply.status(404).send({ message: 'Usuário não encontrado' });
    }
    return reply.status(200).send(profile);
  });

  // POST /avatar — upload user avatar image
  app.post('/avatar', { preHandler: [authMiddleware] }, async (request, reply) => {
    const file = await request.file();
    if (!file) {
      throw new ValidationError([{ path: 'file', message: 'Imagem é obrigatória', code: 'invalid_type' }]);
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new ValidationError([{ path: 'file', message: 'Formato inválido. Use JPEG, PNG ou WebP', code: 'invalid_type' }]);
    }

    const fs = await import('node:fs');
    const path = await import('node:path');
    const crypto = await import('node:crypto');

    const uploadDir = path.join(app.env.UPLOAD_DIR, 'avatars');
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const ext = file.filename.split('.').pop() || 'jpg';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    const buffer = await file.toBuffer();
    await fs.promises.writeFile(filePath, buffer);

    await authService.updateAvatar(request.userId, `avatars/${filename}`);

    return reply.status(200).send({ avatarUrl: `/api/v1/auth/avatar/${request.userId}` });
  });

  // GET /avatar/:userId — serve avatar image
  app.get('/avatar/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const fs = await import('node:fs');
    const path = await import('node:path');

    const { authRepository } = await import('./auth.repository.js');
    const user = await authRepository.findUserById(userId);

    if (!user || !user.avatarPath) {
      return reply.status(404).send({ message: 'Avatar não encontrado' });
    }

    const filePath = path.join(app.env.UPLOAD_DIR, user.avatarPath);

    try {
      await fs.promises.access(filePath);
    } catch {
      return reply.status(404).send({ message: 'Avatar não encontrado' });
    }

    const ext = user.avatarPath.split('.').pop();
    const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    const mime = mimeMap[ext || ''] || 'application/octet-stream';

    const stream = fs.createReadStream(filePath);
    return reply.type(mime).send(stream);
  });
};

export default authRoutes;
