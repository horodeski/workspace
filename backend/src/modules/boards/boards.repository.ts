import { prisma } from '../../shared/database/prisma.js';

export interface BoardRecord {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface BoardWithItemsRecord extends BoardRecord {
  items: BoardItemRecord[];
}

export interface BoardItemRecord {
  id: string;
  boardId: string;
  content: string;
  type: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateItemData {
  content: string;
  type: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
}

export interface UpdateItemData {
  content?: string;
  type?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
}

export interface BatchUpdateItem {
  id: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
}

export const boardsRepository = {
  async findBoardById(id: string, userId: string): Promise<BoardWithItemsRecord | null> {
    return prisma.board.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  async listBoards(userId: string): Promise<BoardRecord[]> {
    return prisma.board.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createBoard(userId: string, name: string): Promise<BoardRecord> {
    return prisma.board.create({
      data: {
        userId,
        name,
      },
    });
  },

  async renameBoard(id: string, userId: string, name: string): Promise<BoardRecord | null> {
    const existing = await prisma.board.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      return null;
    }

    return prisma.board.update({
      where: { id },
      data: { name },
    });
  },

  async softDeleteBoard(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.board.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existing) {
      return false;
    }

    await prisma.board.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  },

  async countBoards(userId: string): Promise<number> {
    return prisma.board.count({
      where: {
        userId,
        deletedAt: null,
      },
    });
  },

  async findItemById(itemId: string, boardId: string): Promise<BoardItemRecord | null> {
    return prisma.boardItem.findFirst({
      where: {
        id: itemId,
        boardId,
        deletedAt: null,
      },
    });
  },

  async createItem(boardId: string, data: CreateItemData): Promise<BoardItemRecord> {
    return prisma.boardItem.create({
      data: {
        boardId,
        content: data.content,
        type: data.type,
        positionX: data.positionX,
        positionY: data.positionY,
        width: data.width,
        height: data.height,
      },
    });
  },

  async updateItem(itemId: string, boardId: string, data: UpdateItemData): Promise<BoardItemRecord | null> {
    const existing = await prisma.boardItem.findFirst({
      where: { id: itemId, boardId, deletedAt: null },
    });

    if (!existing) {
      return null;
    }

    return prisma.boardItem.update({
      where: { id: itemId },
      data,
    });
  },

  async softDeleteItem(itemId: string, boardId: string): Promise<boolean> {
    const existing = await prisma.boardItem.findFirst({
      where: { id: itemId, boardId, deletedAt: null },
    });

    if (!existing) {
      return false;
    }

    await prisma.boardItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    });

    return true;
  },

  async batchUpdateItems(boardId: string, updates: BatchUpdateItem[]): Promise<BoardItemRecord[]> {
    return prisma.$transaction(async (tx) => {
      const results: BoardItemRecord[] = [];

      for (const update of updates) {
        const existing = await tx.boardItem.findFirst({
          where: { id: update.id, boardId, deletedAt: null },
        });

        if (!existing) {
          continue;
        }

        const { id, ...data } = update;
        const updated = await tx.boardItem.update({
          where: { id },
          data,
        });

        results.push(updated);
      }

      return results;
    });
  },
};
