import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_ITEM_WIDTH,
  DEFAULT_ITEM_HEIGHT,
  MIN_ITEM_WIDTH,
  MIN_ITEM_HEIGHT,
  MAX_ITEM_WIDTH,
  MAX_ITEM_HEIGHT,
  DEFAULT_BOARD_NAME,
} from '../constants';
import type { BoardItem, BoardItemType, BoardItemPosition, BoardItemSize } from '../types/board.types';

/**
 * In-memory mock DB and API for board-module tests.
 */
interface MockBoard {
  id: string;
  name: string;
  items: BoardItem[];
  createdAt: string;
  updatedAt: string;
}

let mockBoards: MockBoard[] = [];

function resetMockDb() {
  const now = new Date().toISOString();
  mockBoards = [
    {
      id: crypto.randomUUID(),
      name: DEFAULT_BOARD_NAME,
      items: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function clampPosition(position: BoardItemPosition, size: BoardItemSize): BoardItemPosition {
  return {
    x: Math.max(0, Math.min(Math.round(position.x), CANVAS_WIDTH - size.width)),
    y: Math.max(0, Math.min(Math.round(position.y), CANVAS_HEIGHT - size.height)),
  };
}

function clampSize(size: BoardItemSize): BoardItemSize {
  return {
    width: Math.max(MIN_ITEM_WIDTH, Math.min(Math.round(size.width), MAX_ITEM_WIDTH)),
    height: Math.max(MIN_ITEM_HEIGHT, Math.min(Math.round(size.height), MAX_ITEM_HEIGHT)),
  };
}

function randomPosition(): BoardItemPosition {
  return {
    x: Math.floor(Math.random() * (CANVAS_WIDTH - DEFAULT_ITEM_WIDTH)),
    y: Math.floor(Math.random() * (CANVAS_HEIGHT - DEFAULT_ITEM_HEIGHT)),
  };
}

jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    del: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

import { useBoardModuleStore } from '../hooks/useBoardModuleStore';
import { api } from '@/lib/api';

const mockedApi = api as jest.Mocked<typeof api>;

function setupApiMocks() {
  mockedApi.get.mockImplementation(async (url: string) => {
    if (url === '/boards') {
      return mockBoards.map(({ items: _items, ...rest }) => rest);
    }
    const boardMatch = url.match(/^\/boards\/([^/]+)$/);
    if (boardMatch) {
      const board = mockBoards.find((b) => b.id === boardMatch[1]);
      if (!board) throw new Error('Board not found');
      return { ...board };
    }
    return null;
  });

  mockedApi.post.mockImplementation(async (url: string, body?: unknown) => {
    const data = body as Record<string, unknown> | undefined;

    if (url === '/boards') {
      const now = new Date().toISOString();
      const newBoard: MockBoard = {
        id: crypto.randomUUID(),
        name: data?.name as string,
        items: [],
        createdAt: now,
        updatedAt: now,
      };
      mockBoards.push(newBoard);
      return { id: newBoard.id, name: newBoard.name, createdAt: newBoard.createdAt, updatedAt: newBoard.updatedAt };
    }

    const itemMatch = url.match(/^\/boards\/([^/]+)\/items$/);
    if (itemMatch) {
      const board = mockBoards.find((b) => b.id === itemMatch[1]);
      if (!board) throw new Error('Board not found');

      const content = (data?.content as string || '').trim();
      const type = data?.type as BoardItemType;

      if (!content || content.length > 500) {
        throw new Error('Invalid content');
      }

      const now = new Date().toISOString();
      const newItem: BoardItem = {
        id: crypto.randomUUID(),
        content,
        type,
        createdAt: now,
        updatedAt: now,
        position: randomPosition(),
        size: { width: DEFAULT_ITEM_WIDTH, height: DEFAULT_ITEM_HEIGHT },
      };
      board.items.push(newItem);
      return newItem;
    }

    return {};
  });

  mockedApi.put.mockImplementation(async () => ({}));

  mockedApi.patch.mockImplementation(async (url: string, body?: unknown) => {
    const data = body as Record<string, unknown> | undefined;

    // PATCH /boards/:id (rename)
    const renameMatch = url.match(/^\/boards\/([^/]+)$/);
    if (renameMatch && data?.name) {
      const board = mockBoards.find((b) => b.id === renameMatch[1]);
      if (!board) throw new Error('Board not found');
      board.name = data.name as string;
      board.updatedAt = new Date().toISOString();
      return { ...board };
    }

    // PATCH /boards/:boardId/items/:itemId (update content)
    const updateMatch = url.match(/^\/boards\/([^/]+)\/items\/([^/]+)$/);
    if (updateMatch && data?.content !== undefined) {
      const board = mockBoards.find((b) => b.id === updateMatch[1]);
      if (!board) throw new Error('Board not found');
      const item = board.items.find((i) => i.id === updateMatch[2]);
      if (!item) return;

      const content = (data.content as string || '').trim();
      if (!content || content.length > 500) return;

      item.content = content;
      item.updatedAt = new Date().toISOString();
      return { ...item };
    }

    // PATCH /boards/:boardId/items/:itemId/position
    const posMatch = url.match(/^\/boards\/([^/]+)\/items\/([^/]+)\/position$/);
    if (posMatch) {
      const board = mockBoards.find((b) => b.id === posMatch[1]);
      if (!board) throw new Error('Board not found');
      const item = board.items.find((i) => i.id === posMatch[2]);
      if (!item) return;

      const newPos = clampPosition(data as unknown as BoardItemPosition, item.size);
      item.position = newPos;
      item.updatedAt = new Date().toISOString();
      return { ...item };
    }

    // PATCH /boards/:boardId/items/:itemId/size
    const sizeMatch = url.match(/^\/boards\/([^/]+)\/items\/([^/]+)\/size$/);
    if (sizeMatch) {
      const board = mockBoards.find((b) => b.id === sizeMatch[1]);
      if (!board) throw new Error('Board not found');
      const item = board.items.find((i) => i.id === sizeMatch[2]);
      if (!item) return;

      const newSize = clampSize(data as unknown as BoardItemSize);
      item.size = newSize;
      item.position = clampPosition(item.position, newSize);
      item.updatedAt = new Date().toISOString();
      return { ...item };
    }

    return {};
  });

  mockedApi.del.mockImplementation(async (url: string) => {
    const boardDelMatch = url.match(/^\/boards\/([^/]+)$/);
    if (boardDelMatch) {
      mockBoards = mockBoards.filter((b) => b.id !== boardDelMatch[1]);
      return;
    }

    const itemDelMatch = url.match(/^\/boards\/([^/]+)\/items\/([^/]+)$/);
    if (itemDelMatch) {
      const board = mockBoards.find((b) => b.id === itemDelMatch[1]);
      if (board) {
        board.items = board.items.filter((i) => i.id !== itemDelMatch[2]);
      }
      return;
    }
  });
}

// Reset store and mock DB before each test
beforeEach(async () => {
  resetMockDb();
  setupApiMocks();
  const board = mockBoards[0];
  // Set store to match mock DB initial state (one default board, active)
  useBoardModuleStore.setState({
    boards: [{ id: board.id, name: board.name, createdAt: board.createdAt, updatedAt: board.updatedAt }],
    activeBoard: { ...board },
    activeBoardId: board.id,
    filters: {},
    isLoading: false,
    error: null,
  });
});

/** Helper: get items from activeBoard */
function getActiveItems() {
  return useBoardModuleStore.getState().activeBoard?.items ?? [];
}

describe('useBoardModuleStore - Item CRUD', () => {
  describe('addItem', () => {
    it('adds an item to the active board with valid content', async () => {
      await useBoardModuleStore.getState().addItem('Hello World', 'note');

      const items = getActiveItems();
      expect(items).toHaveLength(1);

      const item = items[0];
      expect(item.content).toBe('Hello World');
      expect(item.type).toBe('note');
      expect(item.size.width).toBe(DEFAULT_ITEM_WIDTH);
      expect(item.size.height).toBe(DEFAULT_ITEM_HEIGHT);
    });

    it('generates a valid UUID for the item', async () => {
      await useBoardModuleStore.getState().addItem('Test content', 'quote');

      const items = getActiveItems();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(items[0].id).toMatch(uuidRegex);
    });

    it('positions item within canvas bounds', async () => {
      await useBoardModuleStore.getState().addItem('Bounded item', 'image');

      const item = getActiveItems()[0];

      expect(item.position.x).toBeGreaterThanOrEqual(0);
      expect(item.position.x).toBeLessThanOrEqual(CANVAS_WIDTH - DEFAULT_ITEM_WIDTH);
      expect(item.position.y).toBeGreaterThanOrEqual(0);
      expect(item.position.y).toBeLessThanOrEqual(CANVAS_HEIGHT - DEFAULT_ITEM_HEIGHT);
    });

    it('sets createdAt and updatedAt as valid ISO 8601 timestamps', async () => {
      await useBoardModuleStore.getState().addItem('Timestamped', 'link');

      const item = getActiveItems()[0];

      expect(new Date(item.createdAt).toISOString()).toBe(item.createdAt);
      expect(new Date(item.updatedAt).toISOString()).toBe(item.updatedAt);
    });

    it('is a no-op when content is empty', async () => {
      await useBoardModuleStore.getState().addItem('', 'note');

      const items = getActiveItems();
      expect(items).toHaveLength(0);
    });

    it('is a no-op when content exceeds 500 characters', async () => {
      await useBoardModuleStore.getState().addItem('a'.repeat(501), 'note');

      const items = getActiveItems();
      expect(items).toHaveLength(0);
    });

    it('is a no-op when activeBoardId is null', async () => {
      useBoardModuleStore.setState({ activeBoardId: null });
      await useBoardModuleStore.getState().addItem('Content', 'note');

      const items = getActiveItems();
      expect(items).toHaveLength(0);
    });

    it('adds items only to the active board', async () => {
      // Create second board
      await useBoardModuleStore.getState().createBoard('Second Board');

      // Active board is now second one; add item
      await useBoardModuleStore.getState().addItem('Active board item', 'note');

      const items = getActiveItems();
      expect(items).toHaveLength(1);
      expect(items[0].content).toBe('Active board item');

      // First board should have no items
      expect(mockBoards[0].items).toHaveLength(0);
    });
  });

  describe('updateItem', () => {
    it('updates the content of an existing item', async () => {
      await useBoardModuleStore.getState().addItem('Original', 'note');
      const itemId = getActiveItems()[0].id;

      await useBoardModuleStore.getState().updateItem(itemId, 'Updated');

      expect(getActiveItems()[0].content).toBe('Updated');
    });

    it('updates the updatedAt timestamp', async () => {
      await useBoardModuleStore.getState().addItem('Original', 'note');
      const item = getActiveItems()[0];
      const originalUpdatedAt = item.updatedAt;

      await useBoardModuleStore.getState().updateItem(item.id, 'Updated');

      const updatedItem = getActiveItems()[0];
      expect(updatedItem.updatedAt).toBeDefined();
      expect(new Date(updatedItem.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );
    });

    it('preserves id, type, createdAt, position, and size', async () => {
      await useBoardModuleStore.getState().addItem('Original', 'quote');
      const originalItem = { ...getActiveItems()[0] };

      await useBoardModuleStore.getState().updateItem(originalItem.id, 'Updated');

      const updatedItem = getActiveItems()[0];
      expect(updatedItem.id).toBe(originalItem.id);
      expect(updatedItem.type).toBe(originalItem.type);
      expect(updatedItem.createdAt).toBe(originalItem.createdAt);
      expect(updatedItem.position).toEqual(originalItem.position);
      expect(updatedItem.size).toEqual(originalItem.size);
    });

    it('is a no-op for invalid content (empty)', async () => {
      await useBoardModuleStore.getState().addItem('Original', 'note');
      const itemId = getActiveItems()[0].id;

      await useBoardModuleStore.getState().updateItem(itemId, '');

      expect(getActiveItems()[0].content).toBe('Original');
    });

    it('is a no-op for non-existent item id', async () => {
      await useBoardModuleStore.getState().addItem('Original', 'note');

      await useBoardModuleStore.getState().updateItem('non-existent-id', 'Updated');

      expect(getActiveItems()[0].content).toBe('Original');
    });

    it('is a no-op when activeBoardId is null', async () => {
      await useBoardModuleStore.getState().addItem('Original', 'note');
      const itemId = getActiveItems()[0].id;

      useBoardModuleStore.setState({ activeBoardId: null });
      await useBoardModuleStore.getState().updateItem(itemId, 'Updated');

      // Restore activeBoardId to check item unchanged
      expect(mockBoards[0].items[0].content).toBe('Original');
    });
  });

  describe('removeItem', () => {
    it('removes an item from the active board', async () => {
      await useBoardModuleStore.getState().addItem('To be removed', 'note');
      const itemId = getActiveItems()[0].id;

      await useBoardModuleStore.getState().removeItem(itemId);

      expect(getActiveItems()).toHaveLength(0);
    });

    it('only removes the specified item, leaving others unchanged', async () => {
      await useBoardModuleStore.getState().addItem('Item 1', 'note');
      await useBoardModuleStore.getState().addItem('Item 2', 'quote');

      const firstItemId = getActiveItems()[0].id;
      await useBoardModuleStore.getState().removeItem(firstItemId);

      const items = getActiveItems();
      expect(items).toHaveLength(1);
      expect(items[0].content).toBe('Item 2');
    });

    it('is a no-op for non-existent item id', async () => {
      await useBoardModuleStore.getState().addItem('Existing', 'note');

      await useBoardModuleStore.getState().removeItem('non-existent-id');

      expect(getActiveItems()).toHaveLength(1);
    });

    it('is a no-op when activeBoardId is null', async () => {
      await useBoardModuleStore.getState().addItem('Existing', 'note');
      const itemId = getActiveItems()[0].id;

      useBoardModuleStore.setState({ activeBoardId: null });
      await useBoardModuleStore.getState().removeItem(itemId);

      // Item still exists in mock DB
      expect(mockBoards[0].items).toHaveLength(1);
    });
  });

  describe('updatePosition', () => {
    it('updates item position within bounds', async () => {
      await useBoardModuleStore.getState().addItem('Positioned item', 'note');
      const itemId = getActiveItems()[0].id;

      await useBoardModuleStore.getState().updatePosition(itemId, { x: 100, y: 200 });

      const item = getActiveItems()[0];
      expect(item.position).toEqual({ x: 100, y: 200 });
    });

    it('clamps negative x position to 0', async () => {
      await useBoardModuleStore.getState().addItem('Item', 'note');
      const itemId = getActiveItems()[0].id;

      await useBoardModuleStore.getState().updatePosition(itemId, { x: -50, y: 100 });

      expect(getActiveItems()[0].position.x).toBe(0);
    });

    it('clamps negative y position to 0', async () => {
      await useBoardModuleStore.getState().addItem('Item', 'note');
      const itemId = getActiveItems()[0].id;

      await useBoardModuleStore.getState().updatePosition(itemId, { x: 100, y: -30 });

      expect(getActiveItems()[0].position.y).toBe(0);
    });

    it('clamps x position to CANVAS_WIDTH - item.width', async () => {
      await useBoardModuleStore.getState().addItem('Item', 'note');
      const itemId = getActiveItems()[0].id;

      await useBoardModuleStore.getState().updatePosition(itemId, { x: 5000, y: 100 });

      expect(getActiveItems()[0].position.x).toBe(CANVAS_WIDTH - DEFAULT_ITEM_WIDTH);
    });

    it('clamps y position to CANVAS_HEIGHT - item.height', async () => {
      await useBoardModuleStore.getState().addItem('Item', 'note');
      const itemId = getActiveItems()[0].id;

      await useBoardModuleStore.getState().updatePosition(itemId, { x: 100, y: 5000 });

      expect(getActiveItems()[0].position.y).toBe(CANVAS_HEIGHT - DEFAULT_ITEM_HEIGHT);
    });

    it('is a no-op for non-existent item id', async () => {
      await useBoardModuleStore.getState().addItem('Item', 'note');
      const originalPosition = { ...getActiveItems()[0].position };

      await useBoardModuleStore.getState().updatePosition('non-existent-id', { x: 999, y: 999 });

      expect(getActiveItems()[0].position).toEqual(originalPosition);
    });
  });

  describe('updateSize', () => {
    it('updates item size within valid range', async () => {
      await useBoardModuleStore.getState().addItem('Resizable item', 'note');
      const itemId = getActiveItems()[0].id;

      await useBoardModuleStore.getState().updateSize(itemId, { width: 400, height: 300 });

      expect(getActiveItems()[0].size).toEqual({ width: 400, height: 300 });
    });

    it('clamps width below minimum to MIN_ITEM_WIDTH', async () => {
      await useBoardModuleStore.getState().addItem('Item', 'note');
      const itemId = getActiveItems()[0].id;

      await useBoardModuleStore.getState().updateSize(itemId, { width: 50, height: 180 });

      expect(getActiveItems()[0].size.width).toBe(MIN_ITEM_WIDTH);
    });

    it('clamps height below minimum to MIN_ITEM_HEIGHT', async () => {
      await useBoardModuleStore.getState().addItem('Item', 'note');
      const itemId = getActiveItems()[0].id;

      await useBoardModuleStore.getState().updateSize(itemId, { width: 240, height: 30 });

      expect(getActiveItems()[0].size.height).toBe(MIN_ITEM_HEIGHT);
    });

    it('clamps width above maximum to MAX_ITEM_WIDTH', async () => {
      await useBoardModuleStore.getState().addItem('Item', 'note');
      const itemId = getActiveItems()[0].id;

      await useBoardModuleStore.getState().updateSize(itemId, { width: 1000, height: 180 });

      expect(getActiveItems()[0].size.width).toBe(MAX_ITEM_WIDTH);
    });

    it('clamps height above maximum to MAX_ITEM_HEIGHT', async () => {
      await useBoardModuleStore.getState().addItem('Item', 'note');
      const itemId = getActiveItems()[0].id;

      await useBoardModuleStore.getState().updateSize(itemId, { width: 240, height: 900 });

      expect(getActiveItems()[0].size.height).toBe(MAX_ITEM_HEIGHT);
    });

    it('adjusts position when new size would exceed canvas bounds', async () => {
      await useBoardModuleStore.getState().addItem('Item', 'note');
      const itemId = getActiveItems()[0].id;

      // First position the item near the right/bottom edge
      await useBoardModuleStore.getState().updatePosition(itemId, { x: 2900, y: 1900 });

      // Now resize to a larger size - position should be adjusted
      await useBoardModuleStore.getState().updateSize(itemId, { width: 400, height: 300 });

      const item = getActiveItems()[0];
      // Position should be clamped so item stays within canvas
      expect(item.position.x).toBeLessThanOrEqual(CANVAS_WIDTH - item.size.width);
      expect(item.position.y).toBeLessThanOrEqual(CANVAS_HEIGHT - item.size.height);
      expect(item.position.x).toBeGreaterThanOrEqual(0);
      expect(item.position.y).toBeGreaterThanOrEqual(0);
    });

    it('does not adjust position when item still fits', async () => {
      await useBoardModuleStore.getState().addItem('Item', 'note');
      const itemId = getActiveItems()[0].id;

      // Position the item away from edges
      await useBoardModuleStore.getState().updatePosition(itemId, { x: 100, y: 100 });

      // Resize within bounds - position should stay the same
      await useBoardModuleStore.getState().updateSize(itemId, { width: 300, height: 200 });

      expect(getActiveItems()[0].position).toEqual({ x: 100, y: 100 });
    });

    it('is a no-op for non-existent item id', async () => {
      await useBoardModuleStore.getState().addItem('Item', 'note');
      const originalSize = { ...getActiveItems()[0].size };

      await useBoardModuleStore.getState().updateSize('non-existent-id', { width: 500, height: 400 });

      expect(getActiveItems()[0].size).toEqual(originalSize);
    });
  });
});
