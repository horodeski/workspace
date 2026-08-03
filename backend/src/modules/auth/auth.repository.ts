import { prisma } from '../../shared/database/prisma.js';

export interface CreateUserData {
  email: string;
  passwordHash: string;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
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

  async findRefreshToken(token: string): Promise<RefreshTokenRecord | null> {
    return prisma.refreshToken.findUnique({ where: { token } });
  },

  async createRefreshToken(data: { token: string; userId: string; expiresAt: Date }): Promise<RefreshTokenRecord> {
    return prisma.refreshToken.create({ data });
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
};
