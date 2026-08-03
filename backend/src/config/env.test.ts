import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { envSchema, loadEnv } from './env.js';

describe('envSchema', () => {
  const validEnv = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    JWT_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    CORS_ORIGINS: 'http://localhost:3000,http://localhost:5173',
  };

  it('parses valid environment with all required variables', () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.DATABASE_URL).toBe(validEnv.DATABASE_URL);
      expect(result.data.JWT_SECRET).toBe(validEnv.JWT_SECRET);
      expect(result.data.JWT_REFRESH_SECRET).toBe(validEnv.JWT_REFRESH_SECRET);
      expect(result.data.CORS_ORIGINS).toEqual([
        'http://localhost:3000',
        'http://localhost:5173',
      ]);
    }
  });

  it('applies default values for optional fields', () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('development');
      expect(result.data.PORT).toBe(3000);
      expect(result.data.LOG_LEVEL).toBe('info');
      expect(result.data.RATE_LIMIT_AUTH).toBe(10);
      expect(result.data.RATE_LIMIT_API).toBe(100);
      expect(result.data.UPLOAD_MAX_SIZE_MB).toBe(10);
      expect(result.data.UPLOAD_DIR).toBe('./uploads');
    }
  });

  it('transforms CORS_ORIGINS string into array', () => {
    const result = envSchema.safeParse({
      ...validEnv,
      CORS_ORIGINS: 'http://a.com,http://b.com,http://c.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.CORS_ORIGINS).toEqual([
        'http://a.com',
        'http://b.com',
        'http://c.com',
      ]);
    }
  });

  it('coerces PORT from string to number', () => {
    const result = envSchema.safeParse({ ...validEnv, PORT: '8080' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(8080);
    }
  });

  it('coerces RATE_LIMIT_AUTH from string to number', () => {
    const result = envSchema.safeParse({ ...validEnv, RATE_LIMIT_AUTH: '20' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.RATE_LIMIT_AUTH).toBe(20);
    }
  });

  it('rejects missing DATABASE_URL', () => {
    const { DATABASE_URL, ...withoutDb } = validEnv;
    const result = envSchema.safeParse(withoutDb);
    expect(result.success).toBe(false);
  });

  it('rejects invalid DATABASE_URL (not a URL)', () => {
    const result = envSchema.safeParse({ ...validEnv, DATABASE_URL: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects JWT_SECRET shorter than 32 characters', () => {
    const result = envSchema.safeParse({ ...validEnv, JWT_SECRET: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects JWT_REFRESH_SECRET shorter than 32 characters', () => {
    const result = envSchema.safeParse({ ...validEnv, JWT_REFRESH_SECRET: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid NODE_ENV value', () => {
    const result = envSchema.safeParse({ ...validEnv, NODE_ENV: 'staging' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid LOG_LEVEL value', () => {
    const result = envSchema.safeParse({ ...validEnv, LOG_LEVEL: 'verbose' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid NODE_ENV values', () => {
    for (const env of ['development', 'production', 'test']) {
      const result = envSchema.safeParse({ ...validEnv, NODE_ENV: env });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid LOG_LEVEL values', () => {
    for (const level of ['fatal', 'error', 'warn', 'info', 'debug', 'trace']) {
      const result = envSchema.safeParse({ ...validEnv, LOG_LEVEL: level });
      expect(result.success).toBe(true);
    }
  });
});

describe('loadEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('loads and validates environment variables', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
    process.env.CORS_ORIGINS = 'http://localhost:3000';
    process.env.NODE_ENV = 'development';

    const env = loadEnv();
    expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3000']);
  });

  it('throws error with clear message when required vars are missing', () => {
    process.env.DATABASE_URL = undefined;
    process.env.JWT_SECRET = undefined;
    process.env.JWT_REFRESH_SECRET = undefined;
    process.env.CORS_ORIGINS = undefined;

    expect(() => loadEnv()).toThrow('Environment validation failed');
  });

  it('error message names the missing variables', () => {
    process.env.DATABASE_URL = undefined;
    process.env.JWT_SECRET = undefined;
    process.env.JWT_REFRESH_SECRET = undefined;
    process.env.CORS_ORIGINS = undefined;

    try {
      loadEnv();
      expect.fail('Should have thrown');
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toContain('DATABASE_URL');
      expect(message).toContain('JWT_SECRET');
      expect(message).toContain('JWT_REFRESH_SECRET');
      expect(message).toContain('CORS_ORIGINS');
    }
  });
});
