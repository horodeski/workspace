import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { authRateLimitPlugin, apiRateLimitPlugin } from './rate-limit.js';
import type { Env } from '../../config/env.js';

function createTestEnv(overrides?: Partial<Env>): Env {
  return {
    NODE_ENV: 'test',
    PORT: 3000,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    JWT_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    CORS_ORIGINS: ['http://localhost:3000'],
    LOG_LEVEL: 'fatal',
    RATE_LIMIT_AUTH: 3, // low limit for testing
    RATE_LIMIT_API: 5,  // low limit for testing
    UPLOAD_MAX_SIZE_MB: 10,
    UPLOAD_DIR: './uploads',
    ...overrides,
  } as Env;
}

describe('authRateLimitPlugin', () => {
  it('should include rate limit headers in responses', async () => {
    const app = Fastify({ logger: false });
    app.decorate('env', createTestEnv());
    await app.register(authRateLimitPlugin);
    app.get('/test', async () => ({ ok: true }));

    const response = await app.inject({ method: 'GET', url: '/test' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-ratelimit-limit']).toBeDefined();
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    expect(response.headers['x-ratelimit-reset']).toBeDefined();

    await app.close();
  });

  it('should return 429 when rate limit is exceeded', async () => {
    const app = Fastify({ logger: false });
    app.decorate('env', createTestEnv({ RATE_LIMIT_AUTH: 2 }));
    await app.register(authRateLimitPlugin);
    app.get('/test', async () => ({ ok: true }));

    // First 2 requests should succeed
    const res1 = await app.inject({ method: 'GET', url: '/test' });
    expect(res1.statusCode).toBe(200);

    const res2 = await app.inject({ method: 'GET', url: '/test' });
    expect(res2.statusCode).toBe(200);

    // Third request should be rate limited
    const res3 = await app.inject({ method: 'GET', url: '/test' });
    expect(res3.statusCode).toBe(429);
    expect(res3.headers['retry-after']).toBeDefined();

    const body = JSON.parse(res3.body);
    expect(body.statusCode).toBe(429);
    expect(body.error).toBe('Too Many Requests');

    await app.close();
  });

  it('should key rate limiting by IP address', async () => {
    const app = Fastify({ logger: false });
    app.decorate('env', createTestEnv({ RATE_LIMIT_AUTH: 1 }));
    await app.register(authRateLimitPlugin);
    app.get('/test', async () => ({ ok: true }));

    // First request from IP 1 should succeed
    const res1 = await app.inject({
      method: 'GET',
      url: '/test',
      remoteAddress: '192.168.1.1',
    });
    expect(res1.statusCode).toBe(200);

    // Second request from IP 1 should be rate limited
    const res2 = await app.inject({
      method: 'GET',
      url: '/test',
      remoteAddress: '192.168.1.1',
    });
    expect(res2.statusCode).toBe(429);

    // First request from IP 2 should still succeed
    const res3 = await app.inject({
      method: 'GET',
      url: '/test',
      remoteAddress: '192.168.1.2',
    });
    expect(res3.statusCode).toBe(200);

    await app.close();
  });
});

describe('apiRateLimitPlugin', () => {
  it('should include rate limit headers in responses', async () => {
    const app = Fastify({ logger: false });
    app.decorate('env', createTestEnv());
    // Simulate auth middleware attaching userId
    app.addHook('onRequest', async (req) => {
      (req as any).userId = 'user-123';
    });
    await app.register(apiRateLimitPlugin);
    app.get('/test', async () => ({ ok: true }));

    const response = await app.inject({ method: 'GET', url: '/test' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-ratelimit-limit']).toBeDefined();
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    expect(response.headers['x-ratelimit-reset']).toBeDefined();

    await app.close();
  });

  it('should return 429 when rate limit is exceeded for a user', async () => {
    const app = Fastify({ logger: false });
    app.decorate('env', createTestEnv({ RATE_LIMIT_API: 2 }));
    // Simulate auth middleware attaching userId before rate limit
    app.addHook('onRequest', async (req) => {
      (req as any).userId = 'user-456';
    });
    await app.register(apiRateLimitPlugin);
    app.get('/test', async () => ({ ok: true }));

    // First 2 requests should succeed
    const res1 = await app.inject({ method: 'GET', url: '/test' });
    expect(res1.statusCode).toBe(200);

    const res2 = await app.inject({ method: 'GET', url: '/test' });
    expect(res2.statusCode).toBe(200);

    // Third request should be rate limited
    const res3 = await app.inject({ method: 'GET', url: '/test' });
    expect(res3.statusCode).toBe(429);
    expect(res3.headers['retry-after']).toBeDefined();

    const body = JSON.parse(res3.body);
    expect(body.statusCode).toBe(429);
    expect(body.error).toBe('Too Many Requests');

    await app.close();
  });

  it('should key rate limiting by userId (different users have separate limits)', async () => {
    const app = Fastify({ logger: false });
    app.decorate('env', createTestEnv({ RATE_LIMIT_API: 1 }));

    let currentUserId = 'user-A';
    app.addHook('onRequest', async (req) => {
      (req as any).userId = currentUserId;
    });
    await app.register(apiRateLimitPlugin);
    app.get('/test', async () => ({ ok: true }));

    // First request from user A should succeed
    currentUserId = 'user-A';
    const res1 = await app.inject({ method: 'GET', url: '/test' });
    expect(res1.statusCode).toBe(200);

    // Second request from user A should be rate limited
    const res2 = await app.inject({ method: 'GET', url: '/test' });
    expect(res2.statusCode).toBe(429);

    // First request from user B should still succeed
    currentUserId = 'user-B';
    const res3 = await app.inject({ method: 'GET', url: '/test' });
    expect(res3.statusCode).toBe(200);

    await app.close();
  });

  it('should fall back to IP when userId is not available', async () => {
    const app = Fastify({ logger: false });
    app.decorate('env', createTestEnv({ RATE_LIMIT_API: 1 }));
    // No auth middleware — userId will not be set
    await app.register(apiRateLimitPlugin);
    app.get('/test', async () => ({ ok: true }));

    // First request should succeed
    const res1 = await app.inject({ method: 'GET', url: '/test' });
    expect(res1.statusCode).toBe(200);

    // Second request from same IP should be rate limited
    const res2 = await app.inject({ method: 'GET', url: '/test' });
    expect(res2.statusCode).toBe(429);

    await app.close();
  });
});
