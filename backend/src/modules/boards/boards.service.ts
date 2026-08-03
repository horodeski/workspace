import { boardsRepository } from './boards.repository.js';
import {
  clampPosition,
  clampSize,
  adjustPositionForSize,
  generateRandomPosition,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
} from './clamping.js';
import { NotFoundError } from '../../shared/errors/errors.js';
import { AppError } from '../../shared/errors/app-error.js';
import { eventBus } from '../../shared/event-bus/index.js';
import type { BoardRecord, BoardWithItemsRecord, BoardItemRecord } from './boards.repository.js';

// --- Public types ---

export interface BoardSummary {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardWithItems {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  items: BoardItemResponse[];
}

export interface BoardItemResponse {
  id: string;
  boardId: string;
  content: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemInput {
  content: string;
  type: string;
}

export interface UpdateItemInput {
  content: string;
}

export interface PositionInput {
  x: number;
  y: number;
}

export interface SizeInput {
  width: number;
  height: number;
}

export interface BatchUpdateItemInput {
  id: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

// --- Helpers ---

function toBoardSummary(record: BoardRecord): BoardSummary {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function toItemResponse(record: BoardItemRecord): BoardItemResponse {
  return {
    id: record.id,
    boardId: record.boardId,
    content: record.content,
    type: record.type,
    position: { x: record.positionX, y: record.positionY },
    size: { width: record.width, height: record.height },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function toBoardWithItems(record: BoardWithItemsRecord): BoardWithItems {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    items: record.items.map(toItemResponse),
  };
}

// --- Service methods ---

async function createBoard(userId: string, name: string): Promise<BoardSummary> {
  const record = await boardsRepository.createBoard(userId, name);

  eventBus.publish({ type: 'board.created', payload: { boardId: record.id, userId } });

  return toBoardSummary(record);
}

async function listBoards(userId: string): Promise<BoardSummary[]> {
  const records = await boardsRepository.listBoards(userId);
  return records.map(toBoardSummary);
}

async function getBoard(userId: string, boardId: string): Promise<BoardWithItems> {
  const record = await boardsRepository.findBoardById(boardId, userId);

  if (!record) {
    throw new NotFoundError('Quadro');
  }

  return toBoardWithItems(record);
}

async function renameBoard(userId: string, boardId: string, name: string): Promise<BoardSummary> {
  const record = await boardsRepository.renameBoard(boardId, userId, name);

  if (!record) {
    throw new NotFoundError('Quadro');
  }

  return toBoardSummary(record);
}

async function deleteBoard(userId: string, boardId: string): Promise<void> {
  const count = await boardsRepository.countBoards(userId);

  if (count <= 1) {
    throw new AppError(400, 'Bad Request', 'Não é possível remover o único quadro');
  }

  eventBus.publish({ type: 'board.deleted', payload: { boardId, userId } });

  const deleted = await boardsRepository.softDeleteBoard(boardId, userId);

  if (!deleted) {
    throw new NotFoundError('Quadro');
  }
}

async function createItem(
  userId: string,
  boardId: string,
  data: CreateItemInput,
): Promise<BoardItemResponse> {
  // Verify board ownership
  const board = await boardsRepository.findBoardById(boardId, userId);

  if (!board) {
    throw new NotFoundError('Quadro');
  }

  const defaultSize = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
  const position = generateRandomPosition(defaultSize);

  const record = await boardsRepository.createItem(boardId, {
    content: data.content,
    type: data.type,
    positionX: position.x,
    positionY: position.y,
    width: defaultSize.width,
    height: defaultSize.height,
  });

  return toItemResponse(record);
}

async function updateItem(
  userId: string,
  boardId: string,
  itemId: string,
  data: UpdateItemInput,
): Promise<BoardItemResponse> {
  // Verify board ownership
  const board = await boardsRepository.findBoardById(boardId, userId);

  if (!board) {
    throw new NotFoundError('Quadro');
  }

  const record = await boardsRepository.updateItem(itemId, boardId, {
    content: data.content,
  });

  if (!record) {
    throw new NotFoundError('Item');
  }

  return toItemResponse(record);
}

async function deleteItem(userId: string, boardId: string, itemId: string): Promise<void> {
  // Verify board ownership
  const board = await boardsRepository.findBoardById(boardId, userId);

  if (!board) {
    throw new NotFoundError('Quadro');
  }

  const deleted = await boardsRepository.softDeleteItem(itemId, boardId);

  if (!deleted) {
    throw new NotFoundError('Item');
  }
}

async function updatePosition(
  userId: string,
  boardId: string,
  itemId: string,
  position: PositionInput,
): Promise<BoardItemResponse> {
  // Verify board ownership
  const board = await boardsRepository.findBoardById(boardId, userId);

  if (!board) {
    throw new NotFoundError('Quadro');
  }

  // Get current item to know its size for clamping
  const item = await boardsRepository.findItemById(itemId, boardId);

  if (!item) {
    throw new NotFoundError('Item');
  }

  const currentSize = { width: item.width, height: item.height };
  const clampedPosition = clampPosition(position, currentSize);

  const record = await boardsRepository.updateItem(itemId, boardId, {
    positionX: clampedPosition.x,
    positionY: clampedPosition.y,
  });

  if (!record) {
    throw new NotFoundError('Item');
  }

  return toItemResponse(record);
}

async function updateSize(
  userId: string,
  boardId: string,
  itemId: string,
  size: SizeInput,
): Promise<BoardItemResponse> {
  // Verify board ownership
  const board = await boardsRepository.findBoardById(boardId, userId);

  if (!board) {
    throw new NotFoundError('Quadro');
  }

  // Get current item for position adjustment
  const item = await boardsRepository.findItemById(itemId, boardId);

  if (!item) {
    throw new NotFoundError('Item');
  }

  const clampedSize = clampSize(size);
  const adjustedPosition = adjustPositionForSize(
    { x: item.positionX, y: item.positionY },
    clampedSize,
  );

  const record = await boardsRepository.updateItem(itemId, boardId, {
    width: clampedSize.width,
    height: clampedSize.height,
    positionX: adjustedPosition.x,
    positionY: adjustedPosition.y,
  });

  if (!record) {
    throw new NotFoundError('Item');
  }

  return toItemResponse(record);
}

async function batchUpdate(
  userId: string,
  boardId: string,
  updates: BatchUpdateItemInput[],
): Promise<BoardItemResponse[]> {
  // Verify board ownership
  const board = await boardsRepository.findBoardById(boardId, userId);

  if (!board) {
    throw new NotFoundError('Quadro');
  }

  // Build clamped update data for the repository
  const batchItems = updates.map((update) => {
    const existingItem = board.items.find((i) => i.id === update.id);

    // Use existing or default dimensions for clamping calculations
    let currentWidth = existingItem?.width ?? DEFAULT_WIDTH;
    let currentHeight = existingItem?.height ?? DEFAULT_HEIGHT;

    const result: { id: string; positionX?: number; positionY?: number; width?: number; height?: number } = {
      id: update.id,
    };

    // Apply size clamping first (size affects position bounds)
    if (update.size) {
      const clampedSize = clampSize(update.size);
      result.width = clampedSize.width;
      result.height = clampedSize.height;
      currentWidth = clampedSize.width;
      currentHeight = clampedSize.height;
    }

    // Apply position clamping using the (potentially new) size
    if (update.position) {
      const clampedPosition = clampPosition(update.position, {
        width: currentWidth,
        height: currentHeight,
      });
      result.positionX = clampedPosition.x;
      result.positionY = clampedPosition.y;
    } else if (update.size && existingItem) {
      // Size changed without explicit position — adjust position for new size
      const adjustedPosition = adjustPositionForSize(
        { x: existingItem.positionX, y: existingItem.positionY },
        { width: currentWidth, height: currentHeight },
      );
      result.positionX = adjustedPosition.x;
      result.positionY = adjustedPosition.y;
    }

    return result;
  });

  const records = await boardsRepository.batchUpdateItems(boardId, batchItems);
  return records.map(toItemResponse);
}

export const boardsService = {
  createBoard,
  listBoards,
  getBoard,
  renameBoard,
  deleteBoard,
  createItem,
  updateItem,
  deleteItem,
  updatePosition,
  updateSize,
  batchUpdate,
};
