import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { addDays, addMinutes, subMinutes } from 'date-fns';
import pino from 'pino';
import { authRepository } from './auth.repository.js';
import { boardsRepository } from '../boards/boards.repository.js';
import { ConflictError, UnauthorizedError } from '../../shared/errors/errors.js';
import { AppError } from '../../shared/errors/app-error.js';
import { isAccountLocked, recordFailedAttempt, resetAttempts } from './login-limiter.js';
import { sendVerificationEmail } from '../../shared/email/email.service.js';

const logger = pino({ name: 'auth-service' });

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const JWT_ISSUER = 'workspace-app';
const JWT_AUDIENCE = 'workspace-api';
const VERIFICATION_CODE_EXPIRY_MINUTES = 15;
const MAX_VERIFICATION_EMAILS_PER_HOUR = 5;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  emailVerified: boolean;
  user: {
    name: string;
    avatarUrl: string | null;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface AuthServiceDeps {
  jwtSecret: string;
  jwtRefreshSecret: string;
  bcryptRounds: number;
  resendApiKey: string;
  emailFrom: string;
}

async function register(email: string, password: string, deps: AuthServiceDeps, name: string): Promise<UserProfile> {
  const passwordHash = await bcrypt.hash(password, deps.bcryptRounds);

  let user;
  try {
    user = await authRepository.createUser({ email, name, passwordHash });
  } catch (error: unknown) {
    // Prisma unique constraint violation (P2002)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
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

  // Send verification email (non-blocking — registration succeeds even if this fails)
  try {
    await sendVerificationCode(user.id, user.email, deps);
  } catch (error: unknown) {
    logger.warn({ err: error, userId: user.id }, 'Failed to send verification email during registration');
  }

  return { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarPath ? `/api/v1/auth/avatar/${user.id}` : null, createdAt: user.createdAt };
}

async function login(email: string, password: string, deps: AuthServiceDeps): Promise<TokenPair> {
  if (isAccountLocked(email)) {
    throw new UnauthorizedError('Conta temporariamente bloqueada. Tente novamente em 15 minutos');
  }

  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    recordFailedAttempt(email);
    throw new UnauthorizedError('Credenciais inválidas');
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    recordFailedAttempt(email);
    throw new UnauthorizedError('Credenciais inválidas');
  }

  // Successful login — reset attempt counter
  resetAttempts(email);

  const accessToken = jwt.sign({ userId: user.id, jti: crypto.randomUUID() }, deps.jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  const refreshToken = jwt.sign({ userId: user.id, jti: crypto.randomUUID() }, deps.jwtRefreshSecret, {
    expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  await authRepository.createRefreshToken({
    token: refreshToken,
    userId: user.id,
    expiresAt: addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS),
  });

  return {
    accessToken,
    refreshToken,
    emailVerified: user.emailVerified,
    user: {
      name: user.name,
      avatarUrl: user.avatarPath ? `/api/v1/auth/avatar/${user.id}` : null,
    },
  };
}

async function refresh(refreshToken: string, deps: AuthServiceDeps): Promise<TokenPair> {
  let payload: { userId: string };

  try {
    payload = jwt.verify(refreshToken, deps.jwtRefreshSecret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as { userId: string };
  } catch {
    throw new UnauthorizedError('Token inválido ou revogado');
  }

  const tokenRecord = await authRepository.findRefreshToken(refreshToken);

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new UnauthorizedError('Token inválido ou revogado');
  }

  // Replay attack detection: if token was already revoked, someone stole it.
  // Revoke ALL user tokens as a security measure.
  if (tokenRecord.revokedAt) {
    await authRepository.revokeAllUserRefreshTokens(tokenRecord.userId);
    logger.warn({ userId: tokenRecord.userId }, 'Refresh token reuse detected — all tokens revoked');
    throw new UnauthorizedError('Token inválido ou revogado');
  }

  // Revoke old token (rotation)
  await authRepository.revokeRefreshToken(tokenRecord.id);

  // Issue new token pair
  const newAccessToken = jwt.sign({ userId: payload.userId, jti: crypto.randomUUID() }, deps.jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  const newRefreshToken = jwt.sign({ userId: payload.userId, jti: crypto.randomUUID() }, deps.jwtRefreshSecret, {
    expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  // Store new refresh token
  await authRepository.createRefreshToken({
    token: newRefreshToken,
    userId: payload.userId,
    expiresAt: addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS),
  });

  // Fetch user to check email verification status
  const user = await authRepository.findUserById(payload.userId);
  const emailVerified = user?.emailVerified ?? false;

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    emailVerified,
    user: {
      name: user?.name ?? '',
      avatarUrl: user?.avatarPath ? `/api/v1/auth/avatar/${payload.userId}` : null,
    },
  };
}

async function logout(userId: string, refreshToken: string, _deps: AuthServiceDeps): Promise<void> {
  const tokenRecord = await authRepository.findRefreshToken(refreshToken);

  // Idempotent — don't fail if token not found
  if (tokenRecord && tokenRecord.userId === userId) {
    await authRepository.revokeRefreshToken(tokenRecord.id);
  }
}

async function logoutAll(userId: string, _deps: AuthServiceDeps): Promise<void> {
  await authRepository.revokeAllUserRefreshTokens(userId);
}

function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

async function sendVerificationCode(userId: string, email: string, deps: AuthServiceDeps): Promise<void> {
  // Rate limit: max 5 verification emails per hour
  const since = subMinutes(new Date(), 60);
  const recentCount = await authRepository.countRecentVerifications(userId, since);

  if (recentCount >= MAX_VERIFICATION_EMAILS_PER_HOUR) {
    throw new ConflictError('Limite de envios atingido. Tente novamente em alguns minutos');
  }

  const code = generateVerificationCode();
  const expiresAt = addMinutes(new Date(), VERIFICATION_CODE_EXPIRY_MINUTES);

  await authRepository.createEmailVerification({ userId, code, expiresAt });

  const sent = await sendVerificationEmail({
    to: email,
    code,
    apiKey: deps.resendApiKey,
    from: deps.emailFrom,
  });

  if (!sent) {
    logger.error({ userId, email }, 'Failed to send verification email');
  }
}

async function verifyEmail(userId: string, code: string, _deps: AuthServiceDeps): Promise<void> {
  const verification = await authRepository.findValidVerification(userId, code);

  if (!verification) {
    throw new UnauthorizedError('Código inválido ou expirado');
  }

  await authRepository.markVerificationUsed(verification.id);
  await authRepository.setEmailVerified(userId);
}

async function resendVerification(userId: string, deps: AuthServiceDeps): Promise<void> {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new UnauthorizedError('Usuário não encontrado');
  }

  if (user.emailVerified) {
    throw new ConflictError('Email já verificado');
  }

  try {
    await sendVerificationCode(userId, user.email, deps);
  } catch (error: unknown) {
    // If it's an AppError (rate limit), re-throw so the handler catches it properly
    if (error instanceof AppError) {
      throw error;
    }
    logger.error({ err: error, userId }, 'Failed to send verification email');
    throw new AppError(502, 'Bad Gateway', 'Falha ao enviar email de verificação. Tente novamente.');
  }
}

async function deleteExpiredTokens(): Promise<number> {
  return authRepository.deleteExpiredTokens();
}

async function getProfile(userId: string): Promise<UserProfile | null> {
  const user = await authRepository.findUserById(userId);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarPath ? `/api/v1/auth/avatar/${user.id}` : null,
    createdAt: user.createdAt,
  };
}

async function updateAvatar(userId: string, avatarPath: string): Promise<void> {
  await authRepository.updateUser(userId, { avatarPath });
}

export const authService = { register, login, refresh, logout, logoutAll, verifyEmail, resendVerification, getProfile, updateAvatar, deleteExpiredTokens };
