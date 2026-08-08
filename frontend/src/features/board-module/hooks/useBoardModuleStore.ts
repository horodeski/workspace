import { create } from 'zustand';

import { api } from '@/lib/api';
import type {
  BoardFilter,
  BoardItem,
  BoardItemType,
  BoardItemPosition,
  BoardItemSize,
} from '../types/board.types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MIN_ITEM_WIDTH,
  MIN_ITEM_HEIGHT,
  MAX_ITEM_WIDTH,
  MAX_ITEM_HEIGHT,
} from '../constants';

/** Board metadata returned by GET /boards (no items). */
export interface BoardSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardModuleState {
  // State
  boards: BoardSummary[];
  activeBoard: (BoardSummary & { items: BoardItem[] }) | null;
  activeBoardId: string | null;
  filters: Record<string, BoardFilter>;
  isLoading: boolean;
  isSwitchingBoard: boolean;
  error: string | null;

  // Board actions
  fetchBoards: () => Promise<void>;
  fetchBoard: (id: string) => Promise<void>;
  setActiveBoard: (id: string) => void;
  createBoard: (name: string) => Promise<{ success: boolean; error?: string }>;
  renameBoard: (id: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  deleteBoard: (id: string) => Promise<void>;

  // Item actions
  addItem: (content: string, type: BoardItemType) => Promise<void>;
  updateItem: (id: string, content: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updatePosition: (id: string, position: BoardItemPosition) => Promise<void>;
  updateSize: (id: string, size: BoardItemSize) => Promise<void>;

  // Filters (local only)
  setFilter: (boardId: string, filter: BoardFilter) => void;
  getActiveFilter: () => BoardFilter;
}

export const useBoardModuleStore = create<BoardModuleState>()((set, get) => ({
  // Initial state
  boards: [],
  activeBoard: null,
  activeBoardId: null,
  filters: {},
  isLoading: false,
  isSwitchingBoard: false,
  error: null,

  fetchBoards: async () => {
    set({ isLoading: true, error: null });
    try {
      const boards = await api.get<BoardSummary[]>('/boards');
      const { activeBoardId } = get();
      set({ boards, isLoading: false });
      // Auto-select first board if none active
      if (!activeBoardId && boards.length > 0) {
        set({ activeBoardId: boards[0].id });
        get().fetchBoard(boards[0].id);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to fetch boards';
      set({ error: message, isLoading: false });
    }
  },

  fetchBoard: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const board = await api.get<BoardSummary & { items: BoardItem[] }>(`/boards/${id}`);
      set({ activeBoard: board, isLoading: false, isSwitchingBoard: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to fetch board';
      set({ error: message, isLoading: false, isSwitchingBoard: false });
    }
  },

  setActiveBoard: (id: string) => {
    set({ activeBoardId: id, isSwitchingBoard: true });
    get().fetchBoard(id);
  },

  createBoard: async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 50) {
      const error = !trimmedName
        ? 'O nome do quadro é obrigatório'
        : 'O nome do quadro deve ter no máximo 50 caracteres';
      return { success: false, error };
    }

    set({ isLoading: true, error: null });
    try {
      const created = await api.post<BoardSummary>('/boards', { name: trimmedName });
      await get().fetchBoards();
      set({ activeBoardId: created.id });
      await get().fetchBoard(created.id);
      return { success: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create board';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  renameBoard: async (id: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName.length > 50) {
      const error = !trimmedName
        ? 'O nome do quadro é obrigatório'
        : 'O nome do quadro deve ter no máximo 50 caracteres';
      return { success: false, error };
    }

    set({ isLoading: true, error: null });
    try {
      await api.patch(`/boards/${id}`, { name: trimmedName });
      await get().fetchBoards();
      // Refresh active board if it was the one renamed
      const { activeBoardId } = get();
      if (activeBoardId === id) {
        await get().fetchBoard(id);
      }
      set({ isLoading: false });
      return { success: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to rename board';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  deleteBoard: async (id: string) => {
    const { boards, activeBoardId } = get();
    if (boards.length <= 1) return;

    set({ isLoading: true, error: null });
    try {
      await api.del(`/boards/${id}`);
      await get().fetchBoards();

      const { boards: updatedBoards } = get();
      if (activeBoardId === id && updatedBoards.length > 0) {
        const newActiveId = updatedBoards[0].id;
        set({ activeBoardId: newActiveId });
        await get().fetchBoard(newActiveId);
      }
      set({ isLoading: false });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to delete board';
      set({ error: message, isLoading: false });
    }
  },

  addItem: async (content: string, type: BoardItemType) => {
    const { activeBoardId } = get();
    if (!activeBoardId) return;

    set({ isLoading: true, error: null });
    try {
      await api.post(`/boards/${activeBoardId}/items`, { content, type });
      await get().fetchBoard(activeBoardId);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to add item';
      set({ error: message, isLoading: false });
    }
  },

  updateItem: async (id: string, content: string) => {
    const { activeBoardId } = get();
    if (!activeBoardId) return;

    set({ isLoading: true, error: null });
    try {
      await api.patch(`/boards/${activeBoardId}/items/${id}`, { content });
      await get().fetchBoard(activeBoardId);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update item';
      set({ error: message, isLoading: false });
    }
  },

  removeItem: async (id: string) => {
    const { activeBoardId } = get();
    if (!activeBoardId) return;

    set({ isLoading: true, error: null });
    try {
      await api.del(`/boards/${activeBoardId}/items/${id}`);
      await get().fetchBoard(activeBoardId);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to remove item';
      set({ error: message, isLoading: false });
    }
  },

  updatePosition: async (id: string, position: BoardItemPosition) => {
    const { activeBoardId, activeBoard } = get();
    if (!activeBoardId || !activeBoard) return;

    const item = activeBoard.items.find((i) => i.id === id);
    if (!item) return;

    // Round to integers and clamp within canvas bounds
    const clampedPosition = {
      x: Math.max(0, Math.min(Math.round(position.x), CANVAS_WIDTH - item.size.width)),
      y: Math.max(0, Math.min(Math.round(position.y), CANVAS_HEIGHT - item.size.height)),
    };

    // Optimistic update
    const previousItems = activeBoard.items;
    const updatedItems = activeBoard.items.map((i) =>
      i.id === id ? { ...i, position: clampedPosition } : i
    );
    set({ activeBoard: { ...activeBoard, items: updatedItems } });

    try {
      await api.patch(`/boards/${activeBoardId}/items/${id}/position`, clampedPosition);
    } catch (e: unknown) {
      // Revert on failure
      set({ activeBoard: { ...activeBoard, items: previousItems } });
      const message = e instanceof Error ? e.message : 'Failed to update position';
      set({ error: message });
    }
  },

  updateSize: async (id: string, size: BoardItemSize) => {
    const { activeBoardId, activeBoard } = get();
    if (!activeBoardId || !activeBoard) return;

    const item = activeBoard.items.find((i) => i.id === id);
    if (!item) return;

    // Clamp size within allowed bounds
    const clampedSize = {
      width: Math.max(MIN_ITEM_WIDTH, Math.min(Math.round(size.width), MAX_ITEM_WIDTH)),
      height: Math.max(MIN_ITEM_HEIGHT, Math.min(Math.round(size.height), MAX_ITEM_HEIGHT)),
    };

    // Re-clamp position after resize to keep item within canvas
    const clampedPosition = {
      x: Math.max(0, Math.min(item.position.x, CANVAS_WIDTH - clampedSize.width)),
      y: Math.max(0, Math.min(item.position.y, CANVAS_HEIGHT - clampedSize.height)),
    };

    // Optimistic update
    const previousItems = activeBoard.items;
    const updatedItems = activeBoard.items.map((i) =>
      i.id === id ? { ...i, size: clampedSize, position: clampedPosition } : i
    );
    set({ activeBoard: { ...activeBoard, items: updatedItems } });

    try {
      await api.patch(`/boards/${activeBoardId}/items/${id}/size`, clampedSize);
    } catch (e: unknown) {
      // Revert on failure
      set({ activeBoard: { ...activeBoard, items: previousItems } });
      const message = e instanceof Error ? e.message : 'Failed to update size';
      set({ error: message });
    }
  },

  // Filters (local only, not persisted to backend)
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
}));
