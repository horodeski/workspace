import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildApp } from '../../app.js';
import type { FastifyInstance } from 'fastify';

vi.mock('../database/prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from '../database/prisma.js';

const TEST_ENV: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '3000',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  JWT_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  CORS_ORIGINS: 'http://localhost:3000',
  LOG_LEVEL: 'fatal',
  RESEND_API_KEY: 'test-resend-key',
  EMAIL_FROM: 'test@example.com',
};

describe('Health check plugin', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    for (const [key, value] of Object.entries(TEST_ENV)) {
      vi.stubEnv(key, value);
    }
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    if (app) {
      await app.close();
    }
  });

  describe('GET /health', () => {
    it('should return 200 with health info when database is connected', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

      app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/health' });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(typeof body.uptime).toBe('number');
      expect(body.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof body.memory.rss).toBe('number');
      expect(typeof body.memory.heapUsed).toBe('number');
      expect(typeof body.memory.heapTotal).toBe('number');
      expect(body.database).toBe('connected');
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should return 200 with database disconnected when DB check fails', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Connection refused'));

      app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/health' });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.database).toBe('disconnected');
    });

    it('should report memory usage in MB', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

      app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/health' });
      const body = JSON.parse(response.body);

      // Memory values should be reasonable MB values (not raw bytes)
      expect(body.memory.rss).toBeGreaterThan(0);
      expect(body.memory.rss).toBeLessThan(1024); // Less than 1GB in MB
      expect(body.memory.heapUsed).toBeGreaterThan(0);
      expect(body.memory.heapTotal).toBeGreaterThan(0);
    });
  });

  describe('GET /ready', () => {
    it('should return 200 when database is connected', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

      app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/ready' });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
    });

    it('should return 503 when database is disconnected', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Connection refused'));

      app = await buildApp();
      await app.ready();

      const response = await app.inject({ method: 'GET', url: '/ready' });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('unavailable');
      expect(body.component).toBe('database');
    });
  });
});
