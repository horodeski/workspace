import { useBoardModuleStore } from '../hooks/useBoardModuleStore';
import { DEFAULT_BOARD_NAME } from '../constants';

// Reset store state before each test
beforeEach(() => {
  useBoardModuleStore.setState(useBoardModuleStore.getInitialState());
});

describe('useBoardModuleStore - Board CRUD', () => {
  describe('default initialization', () => {
    it('initializes with a default board named "Meu Quadro"', () => {
      const { boards, activeBoardId } = useBoardModuleStore.getState();
      expect(boards).toHaveLength(1);
      expect(boards[0].name).toBe(DEFAULT_BOARD_NAME);
      expect(boards[0].items).toEqual([]);
      expect(boards[0].id).toBeDefined();
      expect(boards[0].createdAt).toBeDefined();
      expect(activeBoardId).toBe(boards[0].id);
    });
  });

  describe('createBoard', () => {
    it('creates a new board with valid name and sets it as active', () => {
      const { createBoard } = useBoardModuleStore.getState();
      const result = createBoard('Novo Quadro');

      expect(result).toEqual({ success: true });

      const { boards, activeBoardId } = useBoardModuleStore.getState();
      expect(boards).toHaveLength(2);
      expect(boards[1].name).toBe('Novo Quadro');
      expect(boards[1].items).toEqual([]);
      expect(activeBoardId).toBe(boards[1].id);
    });

    it('trims the board name before storing', () => {
      const { createBoard } = useBoardModuleStore.getState();
      createBoard('  Espaços  ');

      const { boards } = useBoardModuleStore.getState();
      expect(boards[1].name).toBe('Espaços');
    });

    it('returns error for empty name', () => {
      const { createBoard } = useBoardModuleStore.getState();
      const result = createBoard('');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      const { boards } = useBoardModuleStore.getState();
      expect(boards).toHaveLength(1);
    });

    it('returns error for whitespace-only name', () => {
      const { createBoard } = useBoardModuleStore.getState();
      const result = createBoard('   ');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns error for name exceeding 50 characters', () => {
      const { createBoard } = useBoardModuleStore.getState();
      const longName = 'a'.repeat(51);
      const result = createBoard(longName);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('allows duplicate board names', () => {
      const { createBoard } = useBoardModuleStore.getState();
      createBoard('Duplicado');
      const result = useBoardModuleStore.getState().createBoard('Duplicado');

      expect(result).toEqual({ success: true });

      const { boards } = useBoardModuleStore.getState();
      expect(boards).toHaveLength(3);
      expect(boards[1].name).toBe('Duplicado');
      expect(boards[2].name).toBe('Duplicado');
      expect(boards[1].id).not.toBe(boards[2].id);
    });

    it('generates a valid UUID for the new board', () => {
      const { createBoard } = useBoardModuleStore.getState();
      createBoard('Test Board');

      const { boards } = useBoardModuleStore.getState();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(boards[1].id).toMatch(uuidRegex);
    });

    it('sets createdAt as a valid ISO 8601 date', () => {
      const { createBoard } = useBoardModuleStore.getState();
      createBoard('Test Board');

      const { boards } = useBoardModuleStore.getState();
      const date = new Date(boards[1].createdAt);
      expect(date.toISOString()).toBe(boards[1].createdAt);
    });
  });

  describe('renameBoard', () => {
    it('renames an existing board with valid name', () => {
      const { boards } = useBoardModuleStore.getState();
      const boardId = boards[0].id;

      const { renameBoard } = useBoardModuleStore.getState();
      const result = renameBoard(boardId, 'Novo Nome');

      expect(result).toEqual({ success: true });

      const updated = useBoardModuleStore.getState().boards[0];
      expect(updated.name).toBe('Novo Nome');
    });

    it('trims the new name', () => {
      const { boards, renameBoard } = useBoardModuleStore.getState();
      renameBoard(boards[0].id, '  Trimmed  ');

      const updated = useBoardModuleStore.getState().boards[0];
      expect(updated.name).toBe('Trimmed');
    });

    it('returns error for invalid name', () => {
      const { boards, renameBoard } = useBoardModuleStore.getState();
      const result = renameBoard(boards[0].id, '');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      const updated = useBoardModuleStore.getState().boards[0];
      expect(updated.name).toBe(DEFAULT_BOARD_NAME);
    });

    it('returns error for non-existent board', () => {
      const { renameBoard } = useBoardModuleStore.getState();
      const result = renameBoard('non-existent-id', 'New Name');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('deleteBoard', () => {
    it('is a no-op when only one board exists', () => {
      const { boards, deleteBoard } = useBoardModuleStore.getState();
      const boardId = boards[0].id;

      deleteBoard(boardId);

      const state = useBoardModuleStore.getState();
      expect(state.boards).toHaveLength(1);
      expect(state.boards[0].id).toBe(boardId);
    });

    it('removes the board when multiple boards exist', () => {
      const { createBoard } = useBoardModuleStore.getState();
      createBoard('Second Board');

      const { boards, deleteBoard } = useBoardModuleStore.getState();
      const secondBoardId = boards[1].id;

      deleteBoard(secondBoardId);

      const state = useBoardModuleStore.getState();
      expect(state.boards).toHaveLength(1);
      expect(state.boards.find((b) => b.id === secondBoardId)).toBeUndefined();
    });

    it('reassigns activeBoardId to first remaining board when active board is deleted', () => {
      const { createBoard } = useBoardModuleStore.getState();
      createBoard('Second Board');

      // The second board is now active (createBoard sets it)
      const { boards, activeBoardId, deleteBoard } = useBoardModuleStore.getState();
      expect(activeBoardId).toBe(boards[1].id);

      deleteBoard(boards[1].id);

      const state = useBoardModuleStore.getState();
      expect(state.activeBoardId).toBe(state.boards[0].id);
    });

    it('keeps activeBoardId unchanged when a non-active board is deleted', () => {
      const { createBoard } = useBoardModuleStore.getState();
      createBoard('Second Board');

      // Switch back to first board
      const { boards, setActiveBoard } = useBoardModuleStore.getState();
      setActiveBoard(boards[0].id);

      const { deleteBoard } = useBoardModuleStore.getState();
      deleteBoard(boards[1].id);

      const state = useBoardModuleStore.getState();
      expect(state.activeBoardId).toBe(boards[0].id);
    });

    it('is a no-op for non-existent board id', () => {
      const { createBoard } = useBoardModuleStore.getState();
      createBoard('Second Board');

      const { deleteBoard } = useBoardModuleStore.getState();
      deleteBoard('non-existent-id');

      const state = useBoardModuleStore.getState();
      expect(state.boards).toHaveLength(2);
    });
  });

  describe('setActiveBoard', () => {
    it('sets activeBoardId when board exists', () => {
      const { createBoard } = useBoardModuleStore.getState();
      createBoard('Second Board');

      const { boards, setActiveBoard } = useBoardModuleStore.getState();
      setActiveBoard(boards[0].id);

      const state = useBoardModuleStore.getState();
      expect(state.activeBoardId).toBe(boards[0].id);
    });

    it('is a no-op when board id does not exist', () => {
      const { boards, setActiveBoard } = useBoardModuleStore.getState();
      const originalActiveId = boards[0].id;

      setActiveBoard('non-existent-id');

      const state = useBoardModuleStore.getState();
      expect(state.activeBoardId).toBe(originalActiveId);
    });
  });
});
