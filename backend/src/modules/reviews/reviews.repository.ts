import { prisma } from '../../shared/database/prisma.js';
import type { PaginationOptions, PaginatedResult } from '../../shared/utils/pagination.js';

export interface ReviewRecord {
  id: string;
  userId: string;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  learning: string;
  decisions: string;
  resolvedProblems: string;
  timeWaste: string;
  nextWeekFocus: string;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateReviewData {
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  learning?: string;
  decisions?: string;
  resolvedProblems?: string;
  timeWaste?: string;
  nextWeekFocus?: string;
}

export interface UpdateReviewData {
  learning?: string;
  decisions?: string;
  resolvedProblems?: string;
  timeWaste?: string;
  nextWeekFocus?: string;
}

export const reviewsRepository = {
  async findById(id: string, userId: string): Promise<ReviewRecord | null> {
    return prisma.review.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });
  },

  async findByWeek(
    userId: string,
    year: number,
    weekNumber: number
  ): Promise<ReviewRecord | null> {
    return prisma.review.findFirst({
      where: {
        userId,
        year,
        weekNumber,
        deletedAt: null,
      },
    });
  },

  async create(userId: string, data: CreateReviewData): Promise<ReviewRecord> {
    return prisma.review.create({
      data: {
        userId,
        weekNumber: data.weekNumber,
        year: data.year,
        startDate: data.startDate,
        endDate: data.endDate,
        learning: data.learning ?? '',
        decisions: data.decisions ?? '',
        resolvedProblems: data.resolvedProblems ?? '',
        timeWaste: data.timeWaste ?? '',
        nextWeekFocus: data.nextWeekFocus ?? '',
        isLocked: true,
      },
    });
  },

  async update(
    id: string,
    userId: string,
    data: UpdateReviewData
  ): Promise<ReviewRecord | null> {
    const existing = await prisma.review.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      return null;
    }

    return prisma.review.update({
      where: { id },
      data,
    });
  },

  async unlock(id: string, userId: string): Promise<ReviewRecord | null> {
    const existing = await prisma.review.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      return null;
    }

    return prisma.review.update({
      where: { id },
      data: { isLocked: false },
    });
  },

  async softDelete(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.review.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      return false;
    }

    await prisma.review.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  },

  async listPaginated(
    userId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<ReviewRecord>> {
    const { cursor, limit } = options;

    const where = {
      userId,
      deletedAt: null,
    };

    const totalCount = await prisma.review.count({ where });

    const reviews = await prisma.review.findMany({
      where,
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = reviews.length > limit;
    const data = hasMore ? reviews.slice(0, limit) : reviews;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data,
      nextCursor,
      hasMore,
      totalCount,
    };
  },

  async findReviewsForWeeks(
    userId: string,
    weeks: Array<{ year: number; weekNumber: number }>
  ): Promise<ReviewRecord[]> {
    if (weeks.length === 0) {
      return [];
    }

    return prisma.review.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: weeks.map((w) => ({
          year: w.year,
          weekNumber: w.weekNumber,
        })),
      },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });
  },
};
