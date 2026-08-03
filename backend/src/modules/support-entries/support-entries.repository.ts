import { prisma } from '../../shared/database/prisma.js';

export interface CreateSupportEntryData {
  date: string;
  description: string;
  duration: string;
  observation?: string;
}

export interface SupportEntryRecord {
  id: string;
  userId: string;
  date: string;
  description: string;
  duration: string;
  observation: string;
  isFinalized: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface SupportEntryWithAttachments extends SupportEntryRecord {
  attachments: SupportEntryAttachmentRecord[];
}

export interface SupportEntryAttachmentRecord {
  id: string;
  supportEntryId: string;
  name: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: Date;
}

export const supportEntriesRepository = {
  async findById(id: string, userId: string): Promise<SupportEntryRecord | null> {
    return prisma.supportEntry.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });
  },

  async findActiveByUserId(userId: string): Promise<SupportEntryRecord[]> {
    return prisma.supportEntry.findMany({
      where: {
        userId,
        isFinalized: false,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async create(userId: string, data: CreateSupportEntryData): Promise<SupportEntryRecord> {
    return prisma.supportEntry.create({
      data: {
        userId,
        date: data.date,
        description: data.description,
        duration: data.duration,
        observation: data.observation ?? '',
      },
    });
  },

  async softDelete(id: string, userId: string): Promise<void> {
    await prisma.supportEntry.updateMany({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
  },

  async finalizeAll(userId: string): Promise<number> {
    const result = await prisma.supportEntry.updateMany({
      where: {
        userId,
        isFinalized: false,
        deletedAt: null,
      },
      data: { isFinalized: true },
    });

    return result.count;
  },

  async findWithAttachments(id: string, userId: string): Promise<SupportEntryWithAttachments | null> {
    return prisma.supportEntry.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        attachments: true,
      },
    });
  },

  async findActiveWithAttachments(userId: string): Promise<SupportEntryWithAttachments[]> {
    return prisma.supportEntry.findMany({
      where: {
        userId,
        isFinalized: false,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        attachments: true,
      },
    });
  },

  async update(id: string, userId: string, data: Partial<CreateSupportEntryData>): Promise<SupportEntryRecord | null> {
    const existing = await prisma.supportEntry.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) return null;

    return prisma.supportEntry.update({
      where: { id },
      data,
    });
  },
};
