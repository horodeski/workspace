import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';

/**
 * Rate limiting plugin for auth routes.
 * Limits requests by IP address using the RATE_LIMIT_AUTH config value per 60-second window.
 *
 * Usage: Register this plugin within the auth route prefix scope.
 * It applies rate limiting globally to all routes in the scope where it's registered.
 */
const authRateLimit: FastifyPluginAsync = async (app: FastifyInstance) => {
  await app.register(fastifyRateLimit, {
    max: app.env.RATE_LIMIT_AUTH,
    timeWindow: 60_000, // 60 seconds
    keyGenerator: (req: FastifyRequest) => req.ip,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Limite de requisições excedido. Tente novamente em ${context.after}`,
    }),
  });
};

/**
 * Rate limiting plugin for authenticated API routes.
 * Limits requests by userId from the authenticated request using the RATE_LIMIT_API config value per 60-second window.
 *
 * Usage: Register this plugin within the authenticated API route prefix scope.
 * The auth middleware should attach userId to the request before this plugin's hook runs.
 */
const apiRateLimit: FastifyPluginAsync = async (app: FastifyInstance) => {
  await app.register(fastifyRateLimit, {
    max: app.env.RATE_LIMIT_API,
    timeWindow: 60_000, // 60 seconds
    keyGenerator: (req: FastifyRequest) => {
      // For authenticated routes, use the userId attached by the auth middleware.
      // Falls back to IP if userId is not yet attached (shouldn't happen for authed routes).
      return (req as FastifyRequest & { userId?: string }).userId ?? req.ip;
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Limite de requisições excedido. Tente novamente em ${context.after}`,
    }),
  });
};

export const authRateLimitPlugin = fp(authRateLimit, {
  name: 'auth-rate-limit',
});

export const apiRateLimitPlugin = fp(apiRateLimit, {
  name: 'api-rate-limit',
});
