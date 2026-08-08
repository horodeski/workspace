import crypto from 'node:crypto';
import { subDays } from 'date-fns';
import { prisma } from '../../shared/database/prisma.js';

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatarPath: string | null;
  passwordHash: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenRecord {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

/**
 * Hash a refresh token with SHA-256 before storing/querying.
 * This ensures that a DB leak does not expose usable tokens (SEC-005).
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const authRepository = {
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findUserById(id: string): Promise<UserRecord | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async createUser(data: CreateUserData): Promise<UserRecord> {
    return prisma.user.create({ data });
  },

  async updateUser(id: string, data: { avatarPath?: string }): Promise<void> {
    await prisma.user.update({ where: { id }, data });
  },

  async findRefreshToken(token: string): Promise<RefreshTokenRecord | null> {
    const tokenHash = hashToken(token);
    const record = await prisma.refreshToken.findUnique({ where: { token: tokenHash } });

    if (!record) return null;

    // Timing-safe verification: compare stored hash with computed hash
    const storedBuffer = Buffer.from(record.token, 'hex');
    const computedBuffer = Buffer.from(tokenHash, 'hex');

    if (storedBuffer.length !== computedBuffer.length || !crypto.timingSafeEqual(storedBuffer, computedBuffer)) {
      return null;
    }

    return record;
  },

  async createRefreshToken(data: { token: string; userId: string; expiresAt: Date }): Promise<RefreshTokenRecord> {
    const tokenHash = hashToken(data.token);
    return prisma.refreshToken.create({
      data: { token: tokenHash, userId: data.userId, expiresAt: data.expiresAt },
    });
  },

  async revokeRefreshToken(id: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async deleteExpiredTokens(): Promise<number> {
    const { count } = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null }, createdAt: { lt: subDays(new Date(), 7) } },
        ],
      },
    });
    return count;
  },

  // Email verification methods

  async createEmailVerification(data: { userId: string; code: string; expiresAt: Date }) {
    return prisma.emailVerification.create({ data });
  },

  async findValidVerification(userId: string, code: string) {
    return prisma.emailVerification.findFirst({
      where: {
        userId,
        code,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async markVerificationUsed(id: string) {
    await prisma.emailVerification.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  },

  async setEmailVerified(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  },

  async countRecentVerifications(userId: string, since: Date): Promise<number> {
    return prisma.emailVerification.count({
      where: { userId, createdAt: { gt: since } },
    });
  },
};
