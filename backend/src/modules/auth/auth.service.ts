import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { addDays } from 'date-fns';
import pino from 'pino';
import { authRepository } from './auth.repository.js';
import { boardsRepository } from '../boards/boards.repository.js';
import { ConflictError, UnauthorizedError } from '../../shared/errors/errors.js';

const logger = pino({ name: 'auth-service' });

const BCRYPT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
}

export interface AuthServiceDeps {
  jwtSecret: string;
  jwtRefreshSecret: string;
}

async function register(email: string, password: string, _deps: AuthServiceDeps): Promise<UserProfile> {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user;
  try {
    user = await authRepository.createUser({ email, passwordHash });
  } catch (error: any) {
    // Prisma unique constraint violation (P2002)
    if (error?.code === 'P2002') {
      throw new ConflictError('Email já cadastrado');
    }
    throw error;
  }

  // Create default board for the new user (non-blocking — registration succeeds even if this fails)
  try {
    await boardsRepository.createBoard(user.id, 'Meu Quadro');
  } catch (error: unknown) {
    logger.warn({ err: error, userId: user.id }, 'Failed to create default board during registration');
  }

  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

async function login(email: string, password: string, deps: AuthServiceDeps): Promise<TokenPair> {
  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    throw new UnauthorizedError('Credenciais inválidas');
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    throw new UnauthorizedError('Credenciais inválidas');
  }

  const accessToken = jwt.sign({ userId: user.id, jti: crypto.randomUUID() }, deps.jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign({ userId: user.id, jti: crypto.randomUUID() }, deps.jwtRefreshSecret, {
    expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
  });

  await authRepository.createRefreshToken({
    token: refreshToken,
    userId: user.id,
    expiresAt: addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS),
  });

  return { accessToken, refreshToken };
}

async function refresh(refreshToken: string, deps: AuthServiceDeps): Promise<TokenPair> {
  let payload: { userId: string };

  try {
    payload = jwt.verify(refreshToken, deps.jwtRefreshSecret) as { userId: string };
  } catch {
    throw new UnauthorizedError('Token inválido ou revogado');
  }

  const tokenRecord = await authRepository.findRefreshToken(refreshToken);

  if (!tokenRecord || tokenRecord.revokedAt) {
    throw new UnauthorizedError('Token inválido ou revogado');
  }

  // Revoke old token (rotation)
  await authRepository.revokeRefreshToken(tokenRecord.id);

  // Issue new token pair
  const newAccessToken = jwt.sign({ userId: payload.userId, jti: crypto.randomUUID() }, deps.jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const newRefreshToken = jwt.sign({ userId: payload.userId, jti: crypto.randomUUID() }, deps.jwtRefreshSecret, {
    expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
  });

  // Store new refresh token
  await authRepository.createRefreshToken({
    token: newRefreshToken,
    userId: payload.userId,
    expiresAt: addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS),
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

async function logout(userId: string, refreshToken: string, _deps: AuthServiceDeps): Promise<void> {
  const tokenRecord = await authRepository.findRefreshToken(refreshToken);

  // Idempotent — don't fail if token not found
  if (tokenRecord && tokenRecord.userId === userId) {
    await authRepository.revokeRefreshToken(tokenRecord.id);
  }
}

export const authService = { register, login, refresh, logout };
