import { DEFAULT_BOARD_NAME } from '../constants';

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
  mockedApi.patch.mockImplementation(async () => ({}));
  mockedApi.del.mockImplementation(async () => undefined);
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

describe('useBoardModuleStore - Filters', () => {
  describe('getActiveFilter', () => {
    it('returns "all" as default filter for any board', () => {
      const { getActiveFilter } = useBoardModuleStore.getState();
      expect(getActiveFilter()).toBe('all');
    });

    it('returns "all" when activeBoardId is null', () => {
      useBoardModuleStore.setState({ activeBoardId: null });
      const { getActiveFilter } = useBoardModuleStore.getState();
      expect(getActiveFilter()).toBe('all');
    });

    it('returns the filter for the active board after setFilter', () => {
      const { boards, setFilter } = useBoardModuleStore.getState();
      const boardId = boards[0].id;

      setFilter(boardId, 'quote');

      const { getActiveFilter } = useBoardModuleStore.getState();
      expect(getActiveFilter()).toBe('quote');
    });
  });

  describe('setFilter', () => {
    it('updates the filter for a specific board', () => {
      const { boards, setFilter } = useBoardModuleStore.getState();
      const boardId = boards[0].id;

      setFilter(boardId, 'image');

      const { filters } = useBoardModuleStore.getState();
      expect(filters[boardId]).toBe('image');
    });

    it('can set different filter values', () => {
      const { boards, setFilter } = useBoardModuleStore.getState();
      const boardId = boards[0].id;

      setFilter(boardId, 'link');
      expect(useBoardModuleStore.getState().filters[boardId]).toBe('link');

      useBoardModuleStore.getState().setFilter(boardId, 'note');
      expect(useBoardModuleStore.getState().filters[boardId]).toBe('note');
    });
  });

  describe('filter independence per board', () => {
    it('preserves filters independently for each board', async () => {
      await useBoardModuleStore.getState().createBoard('Second Board');

      const { boards, setFilter } = useBoardModuleStore.getState();
      const firstBoardId = boards[0].id;
      const secondBoardId = boards[1].id;

      // Set different filters for each board
      setFilter(firstBoardId, 'quote');
      useBoardModuleStore.getState().setFilter(secondBoardId, 'image');

      // Switch to first board and verify its filter
      useBoardModuleStore.getState().setActiveBoard(firstBoardId);
      expect(useBoardModuleStore.getState().getActiveFilter()).toBe('quote');

      // Switch to second board and verify its filter
      useBoardModuleStore.getState().setActiveBoard(secondBoardId);
      expect(useBoardModuleStore.getState().getActiveFilter()).toBe('image');

      // Switch back to first board - filter should still be preserved
      useBoardModuleStore.getState().setActiveBoard(firstBoardId);
      expect(useBoardModuleStore.getState().getActiveFilter()).toBe('quote');
    });

    it('returns "all" for a board that has no filter set', async () => {
      await useBoardModuleStore.getState().createBoard('Second Board');

      const { boards, setFilter } = useBoardModuleStore.getState();
      const firstBoardId = boards[0].id;
      const secondBoardId = boards[1].id;

      // Set filter only for first board
      setFilter(firstBoardId, 'note');

      // Second board should still return 'all'
      useBoardModuleStore.getState().setActiveBoard(secondBoardId);
      expect(useBoardModuleStore.getState().getActiveFilter()).toBe('all');
    });
  });
});
