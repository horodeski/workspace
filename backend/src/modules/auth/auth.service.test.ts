import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authService, type AuthServiceDeps } from './auth.service.js';
import { authRepository } from './auth.repository.js';
import { boardsRepository } from '../boards/boards.repository.js';
import { ConflictError, UnauthorizedError } from '../../shared/errors/errors.js';

vi.mock('./auth.repository.js', () => ({
  authRepository: {
    findUserByEmail: vi.fn(),
    createUser: vi.fn(),
    findRefreshToken: vi.fn(),
    createRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
  },
}));

vi.mock('../boards/boards.repository.js', () => ({
  boardsRepository: {
    createBoard: vi.fn().mockResolvedValue({ id: 'board-1', userId: 'user-123', name: 'Meu Quadro', createdAt: new Date(), updatedAt: new Date(), deletedAt: null }),
  },
}));

const deps: AuthServiceDeps = {
  jwtSecret: 'test-jwt-secret-that-is-at-least-32-chars',
  jwtRefreshSecret: 'test-jwt-refresh-secret-at-least-32-chars',
};

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should hash password and create user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      vi.mocked(authRepository.createUser).mockResolvedValue(mockUser);

      const result = await authService.register('test@example.com', 'password123', deps);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
      });

      // Verify bcrypt hashing was used
      const call = vi.mocked(authRepository.createUser).mock.calls[0][0];
      expect(call.email).toBe('test@example.com');
      expect(call.passwordHash).not.toBe('password123');
      expect(await bcrypt.compare('password123', call.passwordHash)).toBe(true);
    });

    it('should throw ConflictError on duplicate email (P2002)', async () => {
      const prismaError = Object.assign(new Error('Unique constraint violation'), { code: 'P2002' });
      vi.mocked(authRepository.createUser).mockRejectedValue(prismaError);

      await expect(
        authService.register('dup@example.com', 'password123', deps)
      ).rejects.toThrow(ConflictError);

      await expect(
        authService.register('dup@example.com', 'password123', deps)
      ).rejects.toThrow('Email já cadastrado');
    });

    it('should re-throw non-P2002 errors', async () => {
      vi.mocked(authRepository.createUser).mockRejectedValue(new Error('DB connection failed'));

      await expect(
        authService.register('test@example.com', 'password123', deps)
      ).rejects.toThrow('DB connection failed');
    });

    it('should create default board "Meu Quadro" after registration', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      vi.mocked(authRepository.createUser).mockResolvedValue(mockUser);

      await authService.register('test@example.com', 'password123', deps);

      expect(boardsRepository.createBoard).toHaveBeenCalledWith('user-123', 'Meu Quadro');
    });

    it('should not fail registration if default board creation fails', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'test2@example.com',
        passwordHash: 'hashed',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      vi.mocked(authRepository.createUser).mockResolvedValue(mockUser);
      vi.mocked(boardsRepository.createBoard).mockRejectedValue(new Error('DB timeout'));

      const result = await authService.register('test2@example.com', 'password123', deps);

      expect(result).toEqual({
        id: 'user-456',
        email: 'test2@example.com',
        createdAt: new Date('2024-01-01'),
      });
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-456',
      email: 'user@example.com',
      passwordHash: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(async () => {
      mockUser.passwordHash = await bcrypt.hash('correctpass', 10);
    });

    it('should return token pair on valid credentials', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(authRepository.createRefreshToken).mockResolvedValue({
        id: 'rt-1',
        token: 'token',
        userId: mockUser.id,
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      });

      const result = await authService.login('user@example.com', 'correctpass', deps);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // Verify access token contains userId
      const decoded = jwt.verify(result.accessToken, deps.jwtSecret) as { userId: string };
      expect(decoded.userId).toBe('user-456');

      // Verify refresh token stored in DB
      expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({
          token: result.refreshToken,
          userId: 'user-456',
        })
      );
    });

    it('should throw UnauthorizedError for non-existent email', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);

      await expect(
        authService.login('nobody@example.com', 'password', deps)
      ).rejects.toThrow(UnauthorizedError);

      await expect(
        authService.login('nobody@example.com', 'password', deps)
      ).rejects.toThrow('Credenciais inválidas');
    });

    it('should throw UnauthorizedError for wrong password', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(mockUser);

      await expect(
        authService.login('user@example.com', 'wrongpass', deps)
      ).rejects.toThrow(UnauthorizedError);

      await expect(
        authService.login('user@example.com', 'wrongpass', deps)
      ).rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('refresh', () => {
    it('should rotate tokens and return new pair', async () => {
      const userId = 'user-789';
      const oldToken = jwt.sign({ userId }, deps.jwtRefreshSecret, { expiresIn: '7d' });

      vi.mocked(authRepository.findRefreshToken).mockResolvedValue({
        id: 'rt-old',
        token: oldToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        createdAt: new Date(),
      });
      vi.mocked(authRepository.revokeRefreshToken).mockResolvedValue(undefined);
      vi.mocked(authRepository.createRefreshToken).mockResolvedValue({
        id: 'rt-new',
        token: 'new-token',
        userId,
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      });

      const result = await authService.refresh(oldToken, deps);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // Old token should be revoked
      expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('rt-old');

      // New token should be stored
      expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({ userId })
      );

      // New access token should contain userId
      const decoded = jwt.verify(result.accessToken, deps.jwtSecret) as { userId: string };
      expect(decoded.userId).toBe(userId);
    });

    it('should throw UnauthorizedError for invalid token signature', async () => {
      const badToken = jwt.sign({ userId: 'user-1' }, 'wrong-secret-key-blah-blah', { expiresIn: '7d' });

      await expect(
        authService.refresh(badToken, deps)
      ).rejects.toThrow(UnauthorizedError);

      await expect(
        authService.refresh(badToken, deps)
      ).rejects.toThrow('Token inválido ou revogado');
    });

    it('should throw UnauthorizedError for token not found in DB', async () => {
      const validToken = jwt.sign({ userId: 'user-1' }, deps.jwtRefreshSecret, { expiresIn: '7d' });
      vi.mocked(authRepository.findRefreshToken).mockResolvedValue(null);

      await expect(
        authService.refresh(validToken, deps)
      ).rejects.toThrow('Token inválido ou revogado');
    });

    it('should throw UnauthorizedError for already revoked token', async () => {
      const userId = 'user-1';
      const revokedToken = jwt.sign({ userId }, deps.jwtRefreshSecret, { expiresIn: '7d' });

      vi.mocked(authRepository.findRefreshToken).mockResolvedValue({
        id: 'rt-revoked',
        token: revokedToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: new Date(),
        createdAt: new Date(),
      });

      await expect(
        authService.refresh(revokedToken, deps)
      ).rejects.toThrow('Token inválido ou revogado');
    });
  });

  describe('logout', () => {
    it('should revoke refresh token when it belongs to user', async () => {
      vi.mocked(authRepository.findRefreshToken).mockResolvedValue({
        id: 'rt-logout',
        token: 'some-token',
        userId: 'user-1',
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      });
      vi.mocked(authRepository.revokeRefreshToken).mockResolvedValue(undefined);

      await authService.logout('user-1', 'some-token', deps);

      expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('rt-logout');
    });

    it('should not revoke if token belongs to different user', async () => {
      vi.mocked(authRepository.findRefreshToken).mockResolvedValue({
        id: 'rt-other',
        token: 'some-token',
        userId: 'user-2',
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      });

      await authService.logout('user-1', 'some-token', deps);

      expect(authRepository.revokeRefreshToken).not.toHaveBeenCalled();
    });

    it('should be idempotent when token not found', async () => {
      vi.mocked(authRepository.findRefreshToken).mockResolvedValue(null);

      // Should not throw
      await expect(authService.logout('user-1', 'nonexistent-token', deps)).resolves.toBeUndefined();
      expect(authRepository.revokeRefreshToken).not.toHaveBeenCalled();
    });
  });
});
