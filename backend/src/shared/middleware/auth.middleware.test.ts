import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { authMiddleware } from './auth.middleware.js';
import { UnauthorizedError } from '../errors/errors.js';

const JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long';

function createMockRequest(authHeader?: string) {
  return {
    headers: {
      authorization: authHeader,
    },
    server: {
      env: { JWT_SECRET },
    },
    userId: '',
  } as unknown as Parameters<typeof authMiddleware>[0];
}

function createMockReply() {
  return {} as unknown as Parameters<typeof authMiddleware>[1];
}

describe('authMiddleware', () => {
  it('should attach userId when a valid token is provided', async () => {
    const userId = 'user-123';
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
    const request = createMockRequest(`Bearer ${token}`);
    const reply = createMockReply();

    await authMiddleware(request, reply);

    expect(request.userId).toBe(userId);
  });

  it('should throw UnauthorizedError when no Authorization header is present', async () => {
    const request = createMockRequest(undefined);
    const reply = createMockReply();

    await expect(authMiddleware(request, reply)).rejects.toThrow(UnauthorizedError);
    await expect(authMiddleware(request, reply)).rejects.toThrow('Token de acesso não fornecido');
  });

  it('should throw UnauthorizedError when Authorization header does not start with Bearer', async () => {
    const request = createMockRequest('Basic abc123');
    const reply = createMockReply();

    await expect(authMiddleware(request, reply)).rejects.toThrow(UnauthorizedError);
    await expect(authMiddleware(request, reply)).rejects.toThrow('Token de acesso não fornecido');
  });

  it('should throw UnauthorizedError with expiration message for expired tokens', async () => {
    const userId = 'user-456';
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '-1s' });
    const request = createMockRequest(`Bearer ${token}`);
    const reply = createMockReply();

    await expect(authMiddleware(request, reply)).rejects.toThrow(UnauthorizedError);
    await expect(authMiddleware(request, reply)).rejects.toThrow('Token de acesso expirado');
  });

  it('should throw UnauthorizedError with invalid message for tokens signed with wrong secret', async () => {
    const userId = 'user-789';
    const token = jwt.sign({ userId }, 'wrong-secret-that-is-long-enough!!', { expiresIn: '15m' });
    const request = createMockRequest(`Bearer ${token}`);
    const reply = createMockReply();

    await expect(authMiddleware(request, reply)).rejects.toThrow(UnauthorizedError);
    await expect(authMiddleware(request, reply)).rejects.toThrow('Token de acesso inválido');
  });

  it('should throw UnauthorizedError with invalid message for malformed tokens', async () => {
    const request = createMockRequest('Bearer not-a-valid-jwt-token');
    const reply = createMockReply();

    await expect(authMiddleware(request, reply)).rejects.toThrow(UnauthorizedError);
    await expect(authMiddleware(request, reply)).rejects.toThrow('Token de acesso inválido');
  });

  it('should throw UnauthorizedError when Bearer prefix is present but token is empty', async () => {
    const request = createMockRequest('Bearer ');
    const reply = createMockReply();

    await expect(authMiddleware(request, reply)).rejects.toThrow(UnauthorizedError);
    await expect(authMiddleware(request, reply)).rejects.toThrow('Token de acesso inválido');
  });
});
