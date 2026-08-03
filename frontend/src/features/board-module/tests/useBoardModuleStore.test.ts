import {
  DEFAULT_BOARD_NAME,
} from '../constants';

/**
 * In-memory mock DB for board CRUD tests.
 */
interface MockBoard {
  id: string;
  name: string;
  items: never[];
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

    return {};
  });

  mockedApi.put.mockImplementation(async () => ({}));

  mockedApi.patch.mockImplementation(async (url: string, body?: unknown) => {
    const data = body as Record<string, unknown> | undefined;

    const renameMatch = url.match(/^\/boards\/([^/]+)$/);
    if (renameMatch && data?.name) {
      const board = mockBoards.find((b) => b.id === renameMatch[1]);
      if (!board) throw new Error('Board not found');
      board.name = data.name as string;
      board.updatedAt = new Date().toISOString();
      return { ...board };
    }

    return {};
  });

  mockedApi.del.mockImplementation(async (url: string) => {
    const boardDelMatch = url.match(/^\/boards\/([^/]+)$/);
    if (boardDelMatch) {
      mockBoards = mockBoards.filter((b) => b.id !== boardDelMatch[1]);
      return;
    }
  });
}

// Reset store and mock DB before each test
beforeEach(() => {
  resetMockDb();
  setupApiMocks();
  const board = mockBoards[0];
  useBoardModuleStore.setState({
    boards: [{ id: board.id, name: board.name, createdAt: board.createdAt, updatedAt: board.updatedAt }],
    activeBoard: { ...board },
    activeBoardId: board.id,
    filters: {},
    isLoading: false,
    error: null,
  });
});

describe('useBoardModuleStore - Board CRUD', () => {
  describe('default initialization', () => {
    it('initializes with a default board named "Meu Quadro"', () => {
      const { boards, activeBoardId } = useBoardModuleStore.getState();
      expect(boards).toHaveLength(1);
      expect(boards[0].name).toBe(DEFAULT_BOARD_NAME);
      expect(boards[0].id).toBeDefined();
      expect(boards[0].createdAt).toBeDefined();
      expect(activeBoardId).toBe(boards[0].id);
    });
  });

  describe('createBoard', () => {
    it('creates a new board with valid name and sets it as active', async () => {
      const result = await useBoardModuleStore.getState().createBoard('Novo Quadro');

      expect(result).toEqual({ success: true });

      const { boards, activeBoardId } = useBoardModuleStore.getState();
      expect(boards).toHaveLength(2);
      expect(boards[1].name).toBe('Novo Quadro');
      expect(activeBoardId).toBe(boards[1].id);
    });

    it('trims the board name before storing', async () => {
      await useBoardModuleStore.getState().createBoard('  Espaços  ');

      const { boards } = useBoardModuleStore.getState();
      expect(boards[1].name).toBe('Espaços');
    });

    it('returns error for empty name', async () => {
      const result = await useBoardModuleStore.getState().createBoard('');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      const { boards } = useBoardModuleStore.getState();
      expect(boards).toHaveLength(1);
    });

    it('returns error for whitespace-only name', async () => {
      const result = await useBoardModuleStore.getState().createBoard('   ');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns error for name exceeding 50 characters', async () => {
      const longName = 'a'.repeat(51);
      const result = await useBoardModuleStore.getState().createBoard(longName);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('allows duplicate board names', async () => {
      await useBoardModuleStore.getState().createBoard('Duplicado');
      const result = await useBoardModuleStore.getState().createBoard('Duplicado');

      expect(result).toEqual({ success: true });

      const { boards } = useBoardModuleStore.getState();
      expect(boards).toHaveLength(3);
      expect(boards[1].name).toBe('Duplicado');
      expect(boards[2].name).toBe('Duplicado');
      expect(boards[1].id).not.toBe(boards[2].id);
    });

    it('generates a valid UUID for the new board', async () => {
      await useBoardModuleStore.getState().createBoard('Test Board');

      const { boards } = useBoardModuleStore.getState();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(boards[1].id).toMatch(uuidRegex);
    });

    it('sets createdAt as a valid ISO 8601 date', async () => {
      await useBoardModuleStore.getState().createBoard('Test Board');

      const { boards } = useBoardModuleStore.getState();
      const date = new Date(boards[1].createdAt);
      expect(date.toISOString()).toBe(boards[1].createdAt);
    });
  });

  describe('renameBoard', () => {
    it('renames an existing board with valid name', async () => {
      const { boards } = useBoardModuleStore.getState();
      const boardId = boards[0].id;

      const result = await useBoardModuleStore.getState().renameBoard(boardId, 'Novo Nome');

      expect(result).toEqual({ success: true });

      const updated = useBoardModuleStore.getState().boards[0];
      expect(updated.name).toBe('Novo Nome');
    });

    it('trims the new name', async () => {
      const { boards } = useBoardModuleStore.getState();
      await useBoardModuleStore.getState().renameBoard(boards[0].id, '  Trimmed  ');

      const updated = useBoardModuleStore.getState().boards[0];
      expect(updated.name).toBe('Trimmed');
    });

    it('returns error for invalid name', async () => {
      const { boards } = useBoardModuleStore.getState();
      const result = await useBoardModuleStore.getState().renameBoard(boards[0].id, '');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      const updated = useBoardModuleStore.getState().boards[0];
      expect(updated.name).toBe(DEFAULT_BOARD_NAME);
    });

    it('returns error for non-existent board', async () => {
      const result = await useBoardModuleStore.getState().renameBoard('non-existent-id', 'New Name');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('deleteBoard', () => {
    it('is a no-op when only one board exists', async () => {
      const { boards } = useBoardModuleStore.getState();
      const boardId = boards[0].id;

      await useBoardModuleStore.getState().deleteBoard(boardId);

      const state = useBoardModuleStore.getState();
      expect(state.boards).toHaveLength(1);
      expect(state.boards[0].id).toBe(boardId);
    });

    it('removes the board when multiple boards exist', async () => {
      await useBoardModuleStore.getState().createBoard('Second Board');

      const { boards } = useBoardModuleStore.getState();
      const secondBoardId = boards[1].id;

      await useBoardModuleStore.getState().deleteBoard(secondBoardId);

      const state = useBoardModuleStore.getState();
      expect(state.boards).toHaveLength(1);
      expect(state.boards.find((b) => b.id === secondBoardId)).toBeUndefined();
    });

    it('reassigns activeBoardId to first remaining board when active board is deleted', async () => {
      await useBoardModuleStore.getState().createBoard('Second Board');

      const { boards, activeBoardId } = useBoardModuleStore.getState();
      expect(activeBoardId).toBe(boards[1].id);

      await useBoardModuleStore.getState().deleteBoard(boards[1].id);

      const state = useBoardModuleStore.getState();
      expect(state.activeBoardId).toBe(state.boards[0].id);
    });

    it('keeps activeBoardId unchanged when a non-active board is deleted', async () => {
      await useBoardModuleStore.getState().createBoard('Second Board');

      const { boards } = useBoardModuleStore.getState();
      // Switch to first board
      useBoardModuleStore.getState().setActiveBoard(boards[0].id);

      await useBoardModuleStore.getState().deleteBoard(boards[1].id);

      const state = useBoardModuleStore.getState();
      expect(state.activeBoardId).toBe(boards[0].id);
    });

    it('is a no-op for non-existent board id', async () => {
      await useBoardModuleStore.getState().createBoard('Second Board');

      await useBoardModuleStore.getState().deleteBoard('non-existent-id');

      const state = useBoardModuleStore.getState();
      expect(state.boards).toHaveLength(2);
    });
  });

  describe('setActiveBoard', () => {
    it('sets activeBoardId when board exists', async () => {
      await useBoardModuleStore.getState().createBoard('Second Board');

      const { boards } = useBoardModuleStore.getState();
      useBoardModuleStore.getState().setActiveBoard(boards[0].id);

      const state = useBoardModuleStore.getState();
      expect(state.activeBoardId).toBe(boards[0].id);
    });

    it('sets activeBoardId even when board id does not exist in boards list', () => {
      // setActiveBoard just sets the ID and fetches; it doesn't validate locally
      useBoardModuleStore.getState().setActiveBoard('non-existent-id');

      const state = useBoardModuleStore.getState();
      expect(state.activeBoardId).toBe('non-existent-id');
    });
  });
});
