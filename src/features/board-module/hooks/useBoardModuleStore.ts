import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import {
  DEFAULT_BOARD_NAME,
  STORAGE_KEY,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_ITEM_WIDTH,
  DEFAULT_ITEM_HEIGHT,
  MIN_ITEM_WIDTH,
  MIN_ITEM_HEIGHT,
  MAX_ITEM_WIDTH,
  MAX_ITEM_HEIGHT,
} from '../constants';
import type { Board, BoardFilter, BoardItem, BoardItemType, BoardItemPosition, BoardItemSize } from '../types/board.types';
import { validateBoardName, validateItemContent } from './validation';
import { migrateLegacyData } from './migration';

export interface BoardModuleState {
  // State
  boards: Board[];
  activeBoardId: string | null;
  filters: Record<string, BoardFilter>;

  // Board CRUD
  createBoard: (name: string) => { success: boolean; error?: string };
  renameBoard: (id: string, newName: string) => { success: boolean; error?: string };
  deleteBoard: (id: string) => void;
  setActiveBoard: (id: string) => void;

  // Item CRUD (stubs — implemented in Task 3.1)
  addItem: (content: string, type: BoardItemType) => void;
  updateItem: (id: string, content: string) => void;
  removeItem: (id: string) => void;
  updatePosition: (id: string, position: BoardItemPosition) => void;
  updateSize: (id: string, size: BoardItemSize) => void;

  // Filters (stubs — implemented in Task 4.1)
  setFilter: (boardId: string, filter: BoardFilter) => void;
  getActiveFilter: () => BoardFilter;
}

function createDefaultBoard(): Board {
  return {
    id: crypto.randomUUID(),
    name: DEFAULT_BOARD_NAME,
    items: [],
    createdAt: new Date().toISOString(),
  };
}

function isValidBoard(board: unknown): board is Board {
  if (typeof board !== 'object' || board === null) return false;
  const b = board as Record<string, unknown>;
  return (
    typeof b.id === 'string' &&
    typeof b.name === 'string' &&
    Array.isArray(b.items)
  );
}

function isValidPersistedState(state: unknown): boolean {
  if (typeof state !== 'object' || state === null) return false;
  const s = state as Record<string, unknown>;
  if (!Array.isArray(s.boards) || s.boards.length === 0) return false;
  return s.boards.every(isValidBoard);
}

// Run legacy data migration before store creation so persist middleware
// finds the already-migrated data in localStorage.
migrateLegacyData();

export const useBoardModuleStore = create<BoardModuleState>()(
  persist(
    (set, get) => {
      const defaultBoard = createDefaultBoard();

      return {
        // Initial state
        boards: [defaultBoard],
        activeBoardId: defaultBoard.id,
        filters: {},

        // Board CRUD
        createBoard: (name: string) => {
      const validation = validateBoardName(name);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      const trimmedName = name.trim();
      const newBoard: Board = {
        id: crypto.randomUUID(),
        name: trimmedName,
        items: [],
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        boards: [...state.boards, newBoard],
        activeBoardId: newBoard.id,
      }));

      return { success: true };
    },

    renameBoard: (id: string, newName: string) => {
      const validation = validateBoardName(newName);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      const trimmedName = newName.trim();
      const { boards } = get();
      const boardExists = boards.some((b) => b.id === id);

      if (!boardExists) {
        return { success: false, error: 'Quadro não encontrado' };
      }

      set((state) => ({
        boards: state.boards.map((board) =>
          board.id === id ? { ...board, name: trimmedName } : board
        ),
      }));

      return { success: true };
    },

    deleteBoard: (id: string) => {
      const { boards, activeBoardId } = get();

      // No-op if only one board exists
      if (boards.length <= 1) {
        return;
      }

      // No-op if board doesn't exist
      const boardExists = boards.some((b) => b.id === id);
      if (!boardExists) {
        return;
      }

      const remainingBoards = boards.filter((b) => b.id !== id);

      // Reassign activeBoardId if the deleted board was active
      const newActiveBoardId =
        activeBoardId === id ? remainingBoards[0].id : activeBoardId;

      set({
        boards: remainingBoards,
        activeBoardId: newActiveBoardId,
      });
    },

    setActiveBoard: (id: string) => {
      const { boards } = get();
      const boardExists = boards.some((b) => b.id === id);

      // No-op if board doesn't exist
      if (!boardExists) {
        return;
      }

      set({ activeBoardId: id });
    },

    // Item CRUD (Task 3.1)
    addItem: (content: string, type: BoardItemType) => {
      const { activeBoardId, boards } = get();
      if (!activeBoardId) return;

      const validation = validateItemContent(content);
      if (!validation.success) return;

      const activeBoard = boards.find((b) => b.id === activeBoardId);
      if (!activeBoard) return;

      const now = new Date().toISOString();
      const newItem: BoardItem = {
        id: crypto.randomUUID(),
        content,
        type,
        createdAt: now,
        updatedAt: now,
        position: {
          x: Math.floor(Math.random() * (CANVAS_WIDTH - DEFAULT_ITEM_WIDTH + 1)),
          y: Math.floor(Math.random() * (CANVAS_HEIGHT - DEFAULT_ITEM_HEIGHT + 1)),
        },
        size: {
          width: DEFAULT_ITEM_WIDTH,
          height: DEFAULT_ITEM_HEIGHT,
        },
      };

      set((state) => ({
        boards: state.boards.map((board) =>
          board.id === activeBoardId
            ? { ...board, items: [...board.items, newItem] }
            : board
        ),
      }));
    },

    updateItem: (id: string, content: string) => {
      const { activeBoardId, boards } = get();
      if (!activeBoardId) return;

      const validation = validateItemContent(content);
      if (!validation.success) return;

      const activeBoard = boards.find((b) => b.id === activeBoardId);
      if (!activeBoard) return;

      const itemExists = activeBoard.items.some((item) => item.id === id);
      if (!itemExists) return;

      set((state) => ({
        boards: state.boards.map((board) =>
          board.id === activeBoardId
            ? {
                ...board,
                items: board.items.map((item) =>
                  item.id === id
                    ? { ...item, content, updatedAt: new Date().toISOString() }
                    : item
                ),
              }
            : board
        ),
      }));
    },

    removeItem: (id: string) => {
      const { activeBoardId, boards } = get();
      if (!activeBoardId) return;

      const activeBoard = boards.find((b) => b.id === activeBoardId);
      if (!activeBoard) return;

      const itemExists = activeBoard.items.some((item) => item.id === id);
      if (!itemExists) return;

      set((state) => ({
        boards: state.boards.map((board) =>
          board.id === activeBoardId
            ? { ...board, items: board.items.filter((item) => item.id !== id) }
            : board
        ),
      }));
    },

    updatePosition: (id: string, position: BoardItemPosition) => {
      const { activeBoardId, boards } = get();
      if (!activeBoardId) return;

      const activeBoard = boards.find((b) => b.id === activeBoardId);
      if (!activeBoard) return;

      const item = activeBoard.items.find((i) => i.id === id);
      if (!item) return;

      const clampedX = Math.max(0, Math.min(position.x, CANVAS_WIDTH - item.size.width));
      const clampedY = Math.max(0, Math.min(position.y, CANVAS_HEIGHT - item.size.height));

      set((state) => ({
        boards: state.boards.map((board) =>
          board.id === activeBoardId
            ? {
                ...board,
                items: board.items.map((i) =>
                  i.id === id
                    ? { ...i, position: { x: clampedX, y: clampedY } }
                    : i
                ),
              }
            : board
        ),
      }));
    },

    updateSize: (id: string, size: BoardItemSize) => {
      const { activeBoardId, boards } = get();
      if (!activeBoardId) return;

      const activeBoard = boards.find((b) => b.id === activeBoardId);
      if (!activeBoard) return;

      const item = activeBoard.items.find((i) => i.id === id);
      if (!item) return;

      // Clamp size within min/max limits
      const clampedWidth = Math.max(MIN_ITEM_WIDTH, Math.min(size.width, MAX_ITEM_WIDTH));
      const clampedHeight = Math.max(MIN_ITEM_HEIGHT, Math.min(size.height, MAX_ITEM_HEIGHT));

      // Adjust position if item would exceed canvas bounds with new size
      const clampedX = Math.max(0, Math.min(item.position.x, CANVAS_WIDTH - clampedWidth));
      const clampedY = Math.max(0, Math.min(item.position.y, CANVAS_HEIGHT - clampedHeight));

      set((state) => ({
        boards: state.boards.map((board) =>
          board.id === activeBoardId
            ? {
                ...board,
                items: board.items.map((i) =>
                  i.id === id
                    ? {
                        ...i,
                        size: { width: clampedWidth, height: clampedHeight },
                        position: { x: clampedX, y: clampedY },
                      }
                    : i
                ),
              }
            : board
        ),
      }));
    },

    // Filters (Task 4.1)
    setFilter: (boardId: string, filter: BoardFilter) => {
      set((state) => ({
        filters: { ...state.filters, [boardId]: filter },
      }));
    },
    getActiveFilter: () => {
      const { activeBoardId, filters } = get();
      if (!activeBoardId) return 'all';
      return filters[activeBoardId] ?? 'all';
    },
  };
},
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name: string) => localStorage.getItem(name),
        setItem: (name: string, value: string) => {
          try {
            localStorage.setItem(name, value);
          } catch (error) {
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
              console.warn('localStorage quota exceeded. Data not persisted.');
            } else {
              throw error;
            }
          }
        },
        removeItem: (name: string) => localStorage.removeItem(name),
      })),
      partialize: (state) => ({
        boards: state.boards,
        activeBoardId: state.activeBoardId,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.warn('Failed to rehydrate board-module state:', error);
            return;
          }

          if (!state) return;

          // Validate the restored data structure
          if (!isValidPersistedState(state)) {
            console.warn('Invalid board-module data in localStorage. Initializing with default state.');
            const defaultBoard = createDefaultBoard();
            useBoardModuleStore.setState({
              boards: [defaultBoard],
              activeBoardId: defaultBoard.id,
            });
            return;
          }

          // Validate activeBoardId references an existing board
          const boardIds = state.boards.map((b) => b.id);
          if (!state.activeBoardId || !boardIds.includes(state.activeBoardId)) {
            useBoardModuleStore.setState({
              activeBoardId: state.boards[0].id,
            });
          }
        };
      },
    }
  )
);
