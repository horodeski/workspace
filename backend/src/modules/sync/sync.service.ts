import { prisma } from '../../shared/database/prisma.js';
import type {
  LocalStorageImportInput,
  ActivityImport,
  SupportEntryImport,
  BoardImport,
  ReviewImport,
  OfflineOperation,
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
      // Import activities
      for (const activity of data.activities) {
        const imported = await importActivity(tx, userId, activity);
        if (imported) {
          result.activities.imported++;
        } else {
          result.activities.skipped++;
        }
      }

      // Import support entries
      for (const entry of data.supportEntries) {
        const imported = await importSupportEntry(tx, userId, entry);
        if (imported) {
          result.supportEntries.imported++;
        } else {
          result.supportEntries.skipped++;
        }
      }

      // Import boards (with items)
      for (const board of data.boards) {
        const imported = await importBoard(tx, userId, board);
        if (imported) {
          result.boards.imported++;
        } else {
          result.boards.skipped++;
        }
      }

      // Import reviews
      for (const review of data.reviews) {
        const imported = await importReview(tx, userId, review);
        if (imported) {
          result.reviews.imported++;
        } else {
          result.reviews.skipped++;
        }
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
  // If ID is provided and valid, check if it already exists
  if (isValidUuid(activity.id)) {
    const existing = await tx.activity.findUnique({ where: { id: activity.id } });
    if (existing) {
      return false; // Skip — ID already in use
    }
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

  await tx.activity.create({ data: createData as any });
  return true;
}

async function importSupportEntry(
  tx: PrismaTransaction,
  userId: string,
  entry: SupportEntryImport
): Promise<boolean> {
  if (isValidUuid(entry.id)) {
    const existing = await tx.supportEntry.findUnique({ where: { id: entry.id } });
    if (existing) {
      return false;
    }
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

  await tx.supportEntry.create({ data: createData as any });
  return true;
}

async function importBoard(
  tx: PrismaTransaction,
  userId: string,
  board: BoardImport
): Promise<boolean> {
  if (isValidUuid(board.id)) {
    const existing = await tx.board.findUnique({ where: { id: board.id } });
    if (existing) {
      return false;
    }
  }

  const boardData: Record<string, unknown> = {
    userId,
    name: board.name,
  };

  if (isValidUuid(board.id)) {
    boardData.id = board.id;
  }

  const createdBoard = await tx.board.create({ data: boardData as any });

  // Import board items
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
        // Check item ID doesn't already exist
        const existingItem = await tx.boardItem.findUnique({ where: { id: item.id } });
        if (!existingItem) {
          itemData.id = item.id;
        }
      }

      await tx.boardItem.create({ data: itemData as any });
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
    if (existing) {
      return false;
    }
  }

  // Also check for existing review for the same week/year (unique constraint)
  const existingByWeek = await tx.review.findFirst({
    where: {
      userId,
      weekNumber: review.weekNumber,
      year: review.year,
      deletedAt: null,
    },
  });

  if (existingByWeek) {
    return false;
  }

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

  await tx.review.create({ data: createData as any });
  return true;
}

// --- Offline push operation processing ---

/**
 * Process a single offline operation using last-write-wins strategy.
 * If the entity was modified after the operation's timestamp, the operation
 * is reported as a conflict but still applied (last-write-wins).
 */
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

/**
 * Determine if a conflict exists (entity updated after the operation timestamp).
 * With last-write-wins, we still apply the operation but report the conflict.
 */
function hasConflict(entityUpdatedAt: Date, operationTimestamp: Date): boolean {
  return entityUpdatedAt > operationTimestamp;
}

async function processActivityOperation(
  userId: string,
  operation: OfflineOperation,
  operationTime: Date
): Promise<PushOperationResult> {
  const data = operation.data as Record<string, unknown> | undefined;

  switch (operation.action) {
    case 'create': {
      if (!data) {
        return { operationId: operation.id, status: 'error', message: 'Dados ausentes para criação' };
      }
      await prisma.activity.create({
        data: {
          id: (data.id as string) || undefined,
          userId,
          title: (data.title as string) ?? '',
          description: (data.description as string) ?? '',
          date: (data.date as string) ?? '',
          startTime: (data.startTime as string) ?? null,
          duration: (data.duration as number) ?? null,
          recurrence: (data.recurrence as string) ?? 'none',
          priority: (data.priority as string) ?? null,
        },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    case 'update': {
      if (!data || !data.id) {
        return { operationId: operation.id, status: 'error', message: 'ID ausente para atualização' };
      }
      const existing = await prisma.activity.findFirst({
        where: { id: data.id as string, userId, deletedAt: null },
      });
      if (!existing) {
        return { operationId: operation.id, status: 'skipped', message: 'Atividade não encontrada' };
      }
      const conflict = hasConflict(existing.updatedAt, operationTime);
      const { id: _id, ...updateData } = data;
      await prisma.activity.update({
        where: { id: existing.id },
        data: updateData as any,
      });
      return {
        operationId: operation.id,
        status: conflict ? 'conflict' : 'applied',
        message: conflict ? 'Conflito resolvido por last-write-wins' : undefined,
      };
    }
    case 'delete': {
      if (!data || !data.id) {
        return { operationId: operation.id, status: 'error', message: 'ID ausente para exclusão' };
      }
      const existing = await prisma.activity.findFirst({
        where: { id: data.id as string, userId, deletedAt: null },
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
  const data = operation.data as Record<string, unknown> | undefined;

  switch (operation.action) {
    case 'create': {
      if (!data) {
        return { operationId: operation.id, status: 'error', message: 'Dados ausentes para criação' };
      }
      await prisma.supportEntry.create({
        data: {
          id: (data.id as string) || undefined,
          userId,
          date: (data.date as string) ?? '',
          description: (data.description as string) ?? '',
          duration: (data.duration as string) ?? '',
          observation: (data.observation as string) ?? '',
        },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    case 'update': {
      if (!data || !data.id) {
        return { operationId: operation.id, status: 'error', message: 'ID ausente para atualização' };
      }
      const existing = await prisma.supportEntry.findFirst({
        where: { id: data.id as string, userId, deletedAt: null },
      });
      if (!existing) {
        return { operationId: operation.id, status: 'skipped', message: 'Entrada não encontrada' };
      }
      const conflict = hasConflict(existing.updatedAt, operationTime);
      const { id: _id, ...updateData } = data;
      await prisma.supportEntry.update({
        where: { id: existing.id },
        data: updateData as any,
      });
      return {
        operationId: operation.id,
        status: conflict ? 'conflict' : 'applied',
        message: conflict ? 'Conflito resolvido por last-write-wins' : undefined,
      };
    }
    case 'delete': {
      if (!data || !data.id) {
        return { operationId: operation.id, status: 'error', message: 'ID ausente para exclusão' };
      }
      const existing = await prisma.supportEntry.findFirst({
        where: { id: data.id as string, userId, deletedAt: null },
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
  const data = operation.data as Record<string, unknown> | undefined;

  switch (operation.action) {
    case 'create': {
      if (!data) {
        return { operationId: operation.id, status: 'error', message: 'Dados ausentes para criação' };
      }
      await prisma.board.create({
        data: {
          id: (data.id as string) || undefined,
          userId,
          name: (data.name as string) ?? 'Novo Quadro',
        },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    case 'update': {
      if (!data || !data.id) {
        return { operationId: operation.id, status: 'error', message: 'ID ausente para atualização' };
      }
      const existing = await prisma.board.findFirst({
        where: { id: data.id as string, userId, deletedAt: null },
      });
      if (!existing) {
        return { operationId: operation.id, status: 'skipped', message: 'Quadro não encontrado' };
      }
      const conflict = hasConflict(existing.updatedAt, operationTime);
      const { id: _id, ...updateData } = data;
      await prisma.board.update({
        where: { id: existing.id },
        data: updateData as any,
      });
      return {
        operationId: operation.id,
        status: conflict ? 'conflict' : 'applied',
        message: conflict ? 'Conflito resolvido por last-write-wins' : undefined,
      };
    }
    case 'delete': {
      if (!data || !data.id) {
        return { operationId: operation.id, status: 'error', message: 'ID ausente para exclusão' };
      }
      const existing = await prisma.board.findFirst({
        where: { id: data.id as string, userId, deletedAt: null },
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
  const data = operation.data as Record<string, unknown> | undefined;

  switch (operation.action) {
    case 'create': {
      if (!data || !data.boardId) {
        return { operationId: operation.id, status: 'error', message: 'boardId ausente para criação' };
      }
      // Verify board ownership
      const board = await prisma.board.findFirst({
        where: { id: data.boardId as string, userId, deletedAt: null },
      });
      if (!board) {
        return { operationId: operation.id, status: 'skipped', message: 'Quadro não encontrado' };
      }
      await prisma.boardItem.create({
        data: {
          id: (data.id as string) || undefined,
          boardId: board.id,
          content: (data.content as string) ?? '',
          type: (data.type as string) ?? 'note',
          positionX: (data.positionX as number) ?? 0,
          positionY: (data.positionY as number) ?? 0,
          width: (data.width as number) ?? 240,
          height: (data.height as number) ?? 180,
        },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    case 'update': {
      if (!data || !data.id) {
        return { operationId: operation.id, status: 'error', message: 'ID ausente para atualização' };
      }
      // Verify the item belongs to a board owned by the user
      const item = await prisma.boardItem.findFirst({
        where: { id: data.id as string, deletedAt: null },
        include: { board: true },
      });
      if (!item || item.board.userId !== userId || item.board.deletedAt !== null) {
        return { operationId: operation.id, status: 'skipped', message: 'Item não encontrado' };
      }
      const conflict = hasConflict(item.updatedAt, operationTime);
      const { id: _id, boardId: _boardId, ...updateData } = data;
      await prisma.boardItem.update({
        where: { id: item.id },
        data: updateData as any,
      });
      return {
        operationId: operation.id,
        status: conflict ? 'conflict' : 'applied',
        message: conflict ? 'Conflito resolvido por last-write-wins' : undefined,
      };
    }
    case 'delete': {
      if (!data || !data.id) {
        return { operationId: operation.id, status: 'error', message: 'ID ausente para exclusão' };
      }
      const item = await prisma.boardItem.findFirst({
        where: { id: data.id as string, deletedAt: null },
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
  const data = operation.data as Record<string, unknown> | undefined;

  switch (operation.action) {
    case 'create': {
      if (!data) {
        return { operationId: operation.id, status: 'error', message: 'Dados ausentes para criação' };
      }
      // Check for unique constraint (userId + weekNumber + year)
      const existingByWeek = await prisma.review.findFirst({
        where: {
          userId,
          weekNumber: data.weekNumber as number,
          year: data.year as number,
          deletedAt: null,
        },
      });
      if (existingByWeek) {
        return { operationId: operation.id, status: 'skipped', message: 'Revisão já existe para esta semana' };
      }
      await prisma.review.create({
        data: {
          id: (data.id as string) || undefined,
          userId,
          weekNumber: (data.weekNumber as number) ?? 1,
          year: (data.year as number) ?? new Date().getFullYear(),
          startDate: (data.startDate as string) ?? '',
          endDate: (data.endDate as string) ?? '',
          learning: (data.learning as string) ?? '',
          decisions: (data.decisions as string) ?? '',
          resolvedProblems: (data.resolvedProblems as string) ?? '',
          timeWaste: (data.timeWaste as string) ?? '',
          nextWeekFocus: (data.nextWeekFocus as string) ?? '',
          isLocked: true,
        },
      });
      return { operationId: operation.id, status: 'applied' };
    }
    case 'update': {
      if (!data || !data.id) {
        return { operationId: operation.id, status: 'error', message: 'ID ausente para atualização' };
      }
      const existing = await prisma.review.findFirst({
        where: { id: data.id as string, userId, deletedAt: null },
      });
      if (!existing) {
        return { operationId: operation.id, status: 'skipped', message: 'Revisão não encontrada' };
      }
      const conflict = hasConflict(existing.updatedAt, operationTime);
      const { id: _id, ...updateData } = data;
      await prisma.review.update({
        where: { id: existing.id },
        data: updateData as any,
      });
      return {
        operationId: operation.id,
        status: conflict ? 'conflict' : 'applied',
        message: conflict ? 'Conflito resolvido por last-write-wins' : undefined,
      };
    }
    case 'delete': {
      if (!data || !data.id) {
        return { operationId: operation.id, status: 'error', message: 'ID ausente para exclusão' };
      }
      const existing = await prisma.review.findFirst({
        where: { id: data.id as string, userId, deletedAt: null },
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
