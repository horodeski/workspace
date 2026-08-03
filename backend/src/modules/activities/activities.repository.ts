import { prisma } from '../../shared/database/prisma.js';
import type { PaginationOptions, PaginatedResult } from '../../shared/utils/pagination.js';

export interface ActivityRecord {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  startTime: string | null;
  duration: number | null;
  recurrence: string;
  priority: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  completions?: ActivityCompletionRecord[];
  attachments?: ActivityAttachmentRecord[];
}

export interface ActivityCompletionRecord {
  id: string;
  activityId: string;
  date: string;
  completed: boolean;
  createdAt: Date;
}

export interface ActivityAttachmentRecord {
  id: string;
  activityId: string;
  name: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: Date;
}

export interface CreateActivityData {
  title: string;
  description?: string;
  date: string;
  startTime?: string | null;
  duration?: number | null;
  recurrence?: string;
  priority?: string | null;
}

export interface UpdateActivityData {
  title?: string;
  description?: string;
  date?: string;
  startTime?: string | null;
  duration?: number | null;
  recurrence?: string;
  priority?: string | null;
}

export const activitiesRepository = {
  async findById(id: string, userId: string): Promise<ActivityRecord | null> {
    return prisma.activity.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        completions: true,
        attachments: true,
      },
    });
  },

  async findByUserId(
    userId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<ActivityRecord>> {
    const { cursor, limit, sort, filter } = options;

    const where: Record<string, unknown> = {
      userId,
      deletedAt: null,
    };

    if (filter) {
      if (filter.date) {
        where.date = filter.date;
      }
      if (filter.recurrence) {
        where.recurrence = filter.recurrence;
      }
      if (filter.priority) {
        where.priority = filter.priority;
      }
    }

    const orderBy: Record<string, string> = {};
    if (sort) {
      orderBy[sort.field] = sort.order;
    } else {
      orderBy.date = 'asc';
    }

    const totalCount = await prisma.activity.count({ where });

    const activities = await prisma.activity.findMany({
      where,
      include: {
        completions: true,
        attachments: true,
      },
      orderBy,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = activities.length > limit;
    const data = hasMore ? activities.slice(0, limit) : activities;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data,
      nextCursor,
      hasMore,
      totalCount,
    };
  },

  async findByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ActivityRecord[]> {
    return prisma.activity.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          {
            // Non-recurring activities within the date range
            recurrence: 'none',
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            // Recurring activities that started on or before the end date
            recurrence: { not: 'none' },
            date: { lte: endDate },
          },
        ],
      },
      include: {
        completions: true,
        attachments: true,
      },
      orderBy: { date: 'asc' },
    });
  },

  async create(userId: string, data: CreateActivityData): Promise<ActivityRecord> {
    return prisma.activity.create({
      data: {
        userId,
        title: data.title,
        description: data.description ?? '',
        date: data.date,
        startTime: data.startTime ?? null,
        duration: data.duration ?? null,
        recurrence: data.recurrence ?? 'none',
        priority: data.priority ?? null,
      },
      include: {
        completions: true,
        attachments: true,
      },
    });
  },

  async update(
    id: string,
    userId: string,
    data: UpdateActivityData
  ): Promise<ActivityRecord | null> {
    const existing = await prisma.activity.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      return null;
    }

    return prisma.activity.update({
      where: { id },
      data,
      include: {
        completions: true,
        attachments: true,
      },
    });
  },

  async softDelete(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.activity.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      return false;
    }

    await prisma.activity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  },

  async findCompletions(
    activityId: string,
    dates?: string[]
  ): Promise<ActivityCompletionRecord[]> {
    const where: Record<string, unknown> = { activityId };

    if (dates && dates.length > 0) {
      where.date = { in: dates };
    }

    return prisma.activityCompletion.findMany({ where });
  },

  async upsertCompletion(
    activityId: string,
    date: string,
    completed: boolean
  ): Promise<ActivityCompletionRecord> {
    return prisma.activityCompletion.upsert({
      where: {
        activityId_date: { activityId, date },
      },
      update: { completed },
      create: { activityId, date, completed },
    });
  },
};
