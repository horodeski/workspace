import { prisma } from '../../shared/database/prisma.js';
import type {
  LocalStorageImportInput,
  ActivityImport,
  SupportEntryImport,
  BoardImport,
  ReviewImport,
  OfflineOperation,
} from './sync.schemas.js';
import {
  activityCreateDataSchema,
  activityUpdateDataSchema,
  activityDeleteDataSchema,
  supportEntryCreateDataSchema,
  supportEntryUpdateDataSchema,
  supportEntryDeleteDataSchema,
  boardCreateDataSchema,
  boardUpdateDataSchema,
  boardDeleteDataSchema,
  boardItemCreateDataSchema,
  boardItemUpdateDataSchema,
  boardItemDeleteDataSchema,
  reviewCreateDataSchema,
  reviewUpdateDataSchema,
  reviewDeleteDataSchema,
} from './sync.schemas.js';

export interface ImportResult {
  activities: { imported: number; skipped: number };
  supportEntries: { imported: number; skipped: number };
  boards: { imported: number; skipped: number };
  reviews: { imported: number; skipped: number };
}

export interface PushOperationResult {
  operationId: string;
  status: 'applied' | 'conflict' | 'skipped' | 'error';
  message?: string;
}

export interface PushResult {
  results: PushOperationResult[];
  applied: number;
  conflicts: number;
  errors: number;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string | undefined): id is string {
  return !!id && UUID_REGEX.test(id);
}

export const syncService = {
  async importFromLocalStorage(
    userId: string,
    data: LocalStorageImportInput
  ): Promise<ImportResult> {
    const result: ImportResult = {
      activities: { imported: 0, skipped: 0 },
      supportEntries: { imported: 0, skipped: 0 },
      boards: { imported: 0, skipped: 0 },
      reviews: { imported: 0, skipped: 0 },
    };

    await prisma.$transaction(async (tx) => {
      for (const activity of data.activities) {
        const imported = await importActivity(tx, userId, activity);
        if (imported) result.activities.imported++;
        else result.activities.skipped++;
      }

      for (const entry of data.supportEntries) {
        const imported = await importSupportEntry(tx, userId, entry);
        if (imported) result.supportEntries.imported++;
        else result.supportEntries.skipped++;
      }

      for (const board of data.boards) {
        const imported = await importBoard(tx, userId, board);
        if (imported) result.boards.imported++;
        else result.boards.skipped++;
      }

      for (const review of data.reviews) {
        const imported = await importReview(tx, userId, review);
        if (imported) result.reviews.imported++;
        else result.reviews.skipped++;
      }
    });

    return result;
  },

  async pushOfflineOperations(
    userId: string,
    operations: OfflineOperation[]
  ): Promise<PushResult> {
    const results: PushOperationResult[] = [];

    for (const operation of operations) {
      const result = await processOfflineOperation(userId, operation);
      results.push(result);
    }

    return {
      results,
      applied: results.filter((r) => r.status === 'applied').length,
      conflicts: results.filter((r) => r.status === 'conflict').length,
      errors: results.filter((r) => r.status === 'error').length,
    };
  },
};

type PrismaTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function importActivity(
  tx: PrismaTransaction,
  userId: string,
  activity: ActivityImport
): Promise<boolean> {
  if (isValidUuid(activity.id)) {
    const existing = await tx.activity.findUnique({ where: { id: activity.id } });
    if (existing) return false;
  }

  const createData: Record<string, unknown> = {
    userId,
    title: activity.title,
    description: activity.description ?? '',
    date: activity.date,
    startTime: activity.startTime ?? null,
    duration: activity.duration ?? null,
    recurrence: activity.recurrence ?? 'none',
    priority: activity.priority ?? null,
  };

  if (isValidUuid(activity.id)) {
    createData.id = activity.id;
  }

  await tx.activity.create({ data: createData as Parameters<typeof tx.activity.create>[0]['data'] });
  return true;
}

async function importSupportEntry(
  tx: PrismaTransaction,
  userId: string,
  entry: SupportEntryImport
): Promise<boolean> {
  if (isValidUuid(entry.id)) {
    const existing = await tx.supportEntry.findUnique({ where: { id: entry.id } });
    if (existing) return false;
  }

  const createData: Record<string, unknown> = {
    userId,
    date: entry.date,
    description: entry.description,
    duration: entry.duration,
    observation: entry.observation ?? '',
  };

  if (isValidUuid(entry.id)) {
    createData.id = entry.id;
  }

  await tx.supportEntry.create({ data: createData as Parameters<typeof tx.supportEntry.create>[0]['data'] });
  return true;
}

async function importBoard(
  tx: PrismaTransaction,
  userId: string,
  board: BoardImport
): Promise<boolean> {
  if (isValidUuid(board.id)) {
    const existing = await tx.board.findUnique({ where: { id: board.id } });
    if (existing) return false;
  }

  const boardData: Record<string, unknown> = {
    userId,
    name: board.name,
  };

  if (isValidUuid(board.id)) {
    boardData.id = board.id;
  }

  const createdBoard = await tx.board.create({ data: boardData as Parameters<typeof tx.board.create>[0]['data'] });

  if (board.items && board.items.length > 0) {
    for (const item of board.items) {
      const itemData: Record<string, unknown> = {
        boardId: createdBoard.id,
        content: item.content,
        type: item.type,
        positionX: item.position?.x ?? 0,
        positionY: item.position?.y ?? 0,
        width: item.size?.width ?? 240,
        height: item.size?.height ?? 180,
      };

      if (isValidUuid(item.id)) {
        const existingItem = await tx.boardItem.findUnique({ where: { id: item.id } });
        if (!existingItem) {
          itemData.id = item.id;
        }
      }

      await tx.boardItem.create({ data: itemData as Parameters<typeof tx.boardItem.create>[0]['data'] });
    }
  }

  return true;
}

async function importReview(
  tx: PrismaTransaction,
  userId: string,
  review: ReviewImport
): Promise<boolean> {
  if (isValidUuid(review.id)) {
    const existing = await tx.review.findUnique({ where: { id: review.id } });
    if (existing) return false;
  }

  const existingByWeek = await tx.review.findFirst({
    where: {
      userId,
      weekNumber: review.weekNumber,
      year: review.year,
      deletedAt: null,
    },
  });

  if (existingByWeek) return false;

  const createData: Record<string, unknown> = {
    userId,
    weekNumber: review.weekNumber,
    year: review.year,
    startDate: review.startDate,
    endDate: review.endDate,
    learning: review.learning ?? '',
    decisions: review.decisions ?? '',
    resolvedProblems: review.resolvedProblems ?? '',
    timeWaste: review.timeWaste ?? '',
    nextWeekFocus: review.nextWeekFocus ?? '',
    isLocked: true,
  };

  if (isValidUuid(review.id)) {
    createData.id = review.id;
  }

  await tx.review.create({ data: createData as Parameters<typeof tx.review.create>[0]['data'] });
  return true;
}

// ============================================================
// Offline push operation processing — with strict allowlists
// ============================================================

async function processOfflineOperation(
  userId: string,
  operation: OfflineOperation
): Promise<PushOperationResult> {
  try {
    const operationTime = new Date(operation.timestamp);

    switch (operation.entity) {
      case 'activity':
        return await processActivityOperation(userId, operation, operationTime);
      case 'support-entry':
        return await processSupportEntryOperation(userId, operation, operationTime);
      case 'board':
        return await processBoardOperation(userId, operation, operationTime);
      case 'board-item':
        return await processBoardItemOperation(userId, operation, operationTime);
      case 'review':
        return await processReviewOperation(userId, operation, operationTime);
      default:
        return {
          operationId: operation.id,
          status: 'error',
          message: `Entidade desconhecida: ${operation.entity}`,
        };
    }
  } catch (error) {
    return {
      operationId: operation.id,
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

function hasConflict(entityUpdatedAt: Date, operationTimestamp: Date): boolean {
  return entityUpdatedAt > operationTimestamp;
}

async function processActivityOperation(
  userId: string,
  operation: OfflineOperation,
  operationTime: Date
): Promise<PushOperationResult> {
  switch (operation.action) {
    case 'create': {
      const parsed = activityCreateDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const data = parsed.data;
      await prisma.activity.create({
        data: {
          id: data.id || undefined,
          userId,
          title: data.title,
          description: data.description,
          date: data.date,
          startTime: data.startTime,
          duration: data.duration,
          recurrence: data.recurrence,
          priority: data.priority,
        },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    case 'update': {
      const parsed = activityUpdateDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const data = parsed.data;
      const existing = await prisma.activity.findFirst({
        where: { id: data.id, userId, deletedAt: null },
      });
      if (!existing) {
        return { operationId: operation.id, status: 'skipped', message: 'Atividade não encontrada' };
      }
      const conflict = hasConflict(existing.updatedAt, operationTime);
      // Allowlist: only client-editable fields
      await prisma.activity.update({
        where: { id: existing.id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.date !== undefined && { date: data.date }),
          ...(data.startTime !== undefined && { startTime: data.startTime }),
          ...(data.duration !== undefined && { duration: data.duration }),
          ...(data.recurrence !== undefined && { recurrence: data.recurrence }),
          ...(data.priority !== undefined && { priority: data.priority }),
        },
      });
      return {
        operationId: operation.id,
        status: conflict ? 'conflict' : 'applied',
        message: conflict ? 'Conflito resolvido por last-write-wins' : undefined,
      };
    }
    case 'delete': {
      const parsed = activityDeleteDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const existing = await prisma.activity.findFirst({
        where: { id: parsed.data.id, userId, deletedAt: null },
      });
      if (!existing) {
        return { operationId: operation.id, status: 'skipped', message: 'Atividade não encontrada' };
      }
      await prisma.activity.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    default:
      return { operationId: operation.id, status: 'error', message: 'Ação inválida' };
  }
}

async function processSupportEntryOperation(
  userId: string,
  operation: OfflineOperation,
  operationTime: Date
): Promise<PushOperationResult> {
  switch (operation.action) {
    case 'create': {
      const parsed = supportEntryCreateDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const data = parsed.data;
      await prisma.supportEntry.create({
        data: {
          id: data.id || undefined,
          userId,
          date: data.date,
          description: data.description,
          duration: data.duration,
          observation: data.observation,
        },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    case 'update': {
      const parsed = supportEntryUpdateDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const data = parsed.data;
      const existing = await prisma.supportEntry.findFirst({
        where: { id: data.id, userId, deletedAt: null },
      });
      if (!existing) {
        return { operationId: operation.id, status: 'skipped', message: 'Entrada não encontrada' };
      }
      const conflict = hasConflict(existing.updatedAt, operationTime);
      await prisma.supportEntry.update({
        where: { id: existing.id },
        data: {
          ...(data.date !== undefined && { date: data.date }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.duration !== undefined && { duration: data.duration }),
          ...(data.observation !== undefined && { observation: data.observation }),
        },
      });
      return {
        operationId: operation.id,
        status: conflict ? 'conflict' : 'applied',
        message: conflict ? 'Conflito resolvido por last-write-wins' : undefined,
      };
    }
    case 'delete': {
      const parsed = supportEntryDeleteDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const existing = await prisma.supportEntry.findFirst({
        where: { id: parsed.data.id, userId, deletedAt: null },
      });
      if (!existing) {
        return { operationId: operation.id, status: 'skipped', message: 'Entrada não encontrada' };
      }
      await prisma.supportEntry.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    default:
      return { operationId: operation.id, status: 'error', message: 'Ação inválida' };
  }
}

async function processBoardOperation(
  userId: string,
  operation: OfflineOperation,
  operationTime: Date
): Promise<PushOperationResult> {
  switch (operation.action) {
    case 'create': {
      const parsed = boardCreateDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const data = parsed.data;
      await prisma.board.create({
        data: {
          id: data.id || undefined,
          userId,
          name: data.name,
        },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    case 'update': {
      const parsed = boardUpdateDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const data = parsed.data;
      const existing = await prisma.board.findFirst({
        where: { id: data.id, userId, deletedAt: null },
      });
      if (!existing) {
        return { operationId: operation.id, status: 'skipped', message: 'Quadro não encontrado' };
      }
      const conflict = hasConflict(existing.updatedAt, operationTime);
      await prisma.board.update({
        where: { id: existing.id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
        },
      });
      return {
        operationId: operation.id,
        status: conflict ? 'conflict' : 'applied',
        message: conflict ? 'Conflito resolvido por last-write-wins' : undefined,
      };
    }
    case 'delete': {
      const parsed = boardDeleteDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const existing = await prisma.board.findFirst({
        where: { id: parsed.data.id, userId, deletedAt: null },
      });
      if (!existing) {
        return { operationId: operation.id, status: 'skipped', message: 'Quadro não encontrado' };
      }
      await prisma.board.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    default:
      return { operationId: operation.id, status: 'error', message: 'Ação inválida' };
  }
}

async function processBoardItemOperation(
  userId: string,
  operation: OfflineOperation,
  operationTime: Date
): Promise<PushOperationResult> {
  switch (operation.action) {
    case 'create': {
      const parsed = boardItemCreateDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const data = parsed.data;
      // Verify board ownership
      const board = await prisma.board.findFirst({
        where: { id: data.boardId, userId, deletedAt: null },
      });
      if (!board) {
        return { operationId: operation.id, status: 'skipped', message: 'Quadro não encontrado' };
      }
      await prisma.boardItem.create({
        data: {
          id: data.id || undefined,
          boardId: board.id,
          content: data.content,
          type: data.type,
          positionX: data.positionX,
          positionY: data.positionY,
          width: data.width,
          height: data.height,
        },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    case 'update': {
      const parsed = boardItemUpdateDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const data = parsed.data;
      const item = await prisma.boardItem.findFirst({
        where: { id: data.id, deletedAt: null },
        include: { board: true },
      });
      if (!item || item.board.userId !== userId || item.board.deletedAt !== null) {
        return { operationId: operation.id, status: 'skipped', message: 'Item não encontrado' };
      }
      const conflict = hasConflict(item.updatedAt, operationTime);
      await prisma.boardItem.update({
        where: { id: item.id },
        data: {
          ...(data.content !== undefined && { content: data.content }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.positionX !== undefined && { positionX: data.positionX }),
          ...(data.positionY !== undefined && { positionY: data.positionY }),
          ...(data.width !== undefined && { width: data.width }),
          ...(data.height !== undefined && { height: data.height }),
        },
      });
      return {
        operationId: operation.id,
        status: conflict ? 'conflict' : 'applied',
        message: conflict ? 'Conflito resolvido por last-write-wins' : undefined,
      };
    }
    case 'delete': {
      const parsed = boardItemDeleteDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const item = await prisma.boardItem.findFirst({
        where: { id: parsed.data.id, deletedAt: null },
        include: { board: true },
      });
      if (!item || item.board.userId !== userId || item.board.deletedAt !== null) {
        return { operationId: operation.id, status: 'skipped', message: 'Item não encontrado' };
      }
      await prisma.boardItem.update({
        where: { id: item.id },
        data: { deletedAt: new Date() },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    default:
      return { operationId: operation.id, status: 'error', message: 'Ação inválida' };
  }
}

async function processReviewOperation(
  userId: string,
  operation: OfflineOperation,
  operationTime: Date
): Promise<PushOperationResult> {
  switch (operation.action) {
    case 'create': {
      const parsed = reviewCreateDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const data = parsed.data;
      // Check unique constraint
      const existingByWeek = await prisma.review.findFirst({
        where: {
          userId,
          weekNumber: data.weekNumber,
          year: data.year,
          deletedAt: null,
        },
      });
      if (existingByWeek) {
        return { operationId: operation.id, status: 'skipped', message: 'Revisão já existe para esta semana' };
      }
      await prisma.review.create({
        data: {
          id: data.id || undefined,
          userId,
          weekNumber: data.weekNumber,
          year: data.year,
          startDate: data.startDate,
          endDate: data.endDate,
          learning: data.learning,
          decisions: data.decisions,
          resolvedProblems: data.resolvedProblems,
          timeWaste: data.timeWaste,
          nextWeekFocus: data.nextWeekFocus,
          isLocked: true, // SEC-002: always server-controlled
        },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    case 'update': {
      const parsed = reviewUpdateDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const data = parsed.data;
      const existing = await prisma.review.findFirst({
        where: { id: data.id, userId, deletedAt: null },
      });
      if (!existing) {
        return { operationId: operation.id, status: 'skipped', message: 'Revisão não encontrada' };
      }
      const conflict = hasConflict(existing.updatedAt, operationTime);
      // SEC-002: isLocked, weekNumber, year, startDate, endDate — NOT editable
      await prisma.review.update({
        where: { id: existing.id },
        data: {
          ...(data.learning !== undefined && { learning: data.learning }),
          ...(data.decisions !== undefined && { decisions: data.decisions }),
          ...(data.resolvedProblems !== undefined && { resolvedProblems: data.resolvedProblems }),
          ...(data.timeWaste !== undefined && { timeWaste: data.timeWaste }),
          ...(data.nextWeekFocus !== undefined && { nextWeekFocus: data.nextWeekFocus }),
        },
      });
      return {
        operationId: operation.id,
        status: conflict ? 'conflict' : 'applied',
        message: conflict ? 'Conflito resolvido por last-write-wins' : undefined,
      };
    }
    case 'delete': {
      const parsed = reviewDeleteDataSchema.safeParse(operation.data);
      if (!parsed.success) {
        return { operationId: operation.id, status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
      }
      const existing = await prisma.review.findFirst({
        where: { id: parsed.data.id, userId, deletedAt: null },
      });
      if (!existing) {
        return { operationId: operation.id, status: 'skipped', message: 'Revisão não encontrada' };
      }
      await prisma.review.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    default:
      return { operationId: operation.id, status: 'error', message: 'Ação inválida' };
  }
}
