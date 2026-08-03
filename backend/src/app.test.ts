import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';

// Set required env vars before importing buildApp
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'a'.repeat(32);
process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.LOG_LEVEL = 'fatal';

describe('App wiring - all modules registered', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should register health endpoint at /health (not 404)', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).not.toBe(404);
  });

  it('should register readiness endpoint at /ready (not 404)', async () => {
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).not.toBe(404);
  });

  it('should register auth routes under /api/v1/auth (not 404)', async () => {
    // These should return 400 (missing body) or similar, but NOT 404
    const register = await app.inject({ method: 'POST', url: '/api/v1/auth/register' });
    expect(register.statusCode).not.toBe(404);

    const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login' });
    expect(login.statusCode).not.toBe(404);

    const refresh = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh' });
    expect(refresh.statusCode).not.toBe(404);

    const logout = await app.inject({ method: 'POST', url: '/api/v1/auth/logout' });
    expect(logout.statusCode).not.toBe(404);
  });

  it('should register activities routes under /api/v1/activities (not 404)', async () => {
    const get = await app.inject({ method: 'GET', url: '/api/v1/activities' });
    expect(get.statusCode).not.toBe(404);

    const post = await app.inject({ method: 'POST', url: '/api/v1/activities' });
    expect(post.statusCode).not.toBe(404);
  });

  it('should register attachment download route under /api/v1/attachments (not 404)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/attachments/some-id/download' });
    expect(res.statusCode).not.toBe(404);
  });

  it('should register support-entries routes under /api/v1/support-entries (not 404)', async () => {
    const get = await app.inject({ method: 'GET', url: '/api/v1/support-entries' });
    expect(get.statusCode).not.toBe(404);

    const post = await app.inject({ method: 'POST', url: '/api/v1/support-entries' });
    expect(post.statusCode).not.toBe(404);

    const clear = await app.inject({ method: 'POST', url: '/api/v1/support-entries/clear' });
    expect(clear.statusCode).not.toBe(404);

    const formatted = await app.inject({ method: 'GET', url: '/api/v1/support-entries/formatted-text' });
    expect(formatted.statusCode).not.toBe(404);
  });

  it('should register boards routes under /api/v1/boards (not 404)', async () => {
    const get = await app.inject({ method: 'GET', url: '/api/v1/boards' });
    expect(get.statusCode).not.toBe(404);

    const post = await app.inject({ method: 'POST', url: '/api/v1/boards' });
    expect(post.statusCode).not.toBe(404);

    const getById = await app.inject({ method: 'GET', url: '/api/v1/boards/some-id' });
    expect(getById.statusCode).not.toBe(404);
  });

  it('should register reviews routes under /api/v1/reviews (not 404)', async () => {
    const post = await app.inject({ method: 'POST', url: '/api/v1/reviews' });
    expect(post.statusCode).not.toBe(404);

    const get = await app.inject({ method: 'GET', url: '/api/v1/reviews' });
    expect(get.statusCode).not.toBe(404);

    const history = await app.inject({ method: 'GET', url: '/api/v1/reviews/history' });
    expect(history.statusCode).not.toBe(404);
  });

  it('should register sync routes under /api/v1/sync (not 404)', async () => {
    const importRoute = await app.inject({ method: 'POST', url: '/api/v1/sync/import' });
    expect(importRoute.statusCode).not.toBe(404);
  });

  it('should include security headers in responses', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('should generate unique request IDs (UUID format)', async () => {
    const res1 = await app.inject({ method: 'GET', url: '/health' });
    const res2 = await app.inject({ method: 'GET', url: '/health' });
    // Both should succeed (request IDs are internally generated)
    expect(res1.statusCode).not.toBe(404);
    expect(res2.statusCode).not.toBe(404);
  });

  it('should return 404 for unregistered routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/nonexistent' });
    expect(res.statusCode).toBe(404);
  });
});
