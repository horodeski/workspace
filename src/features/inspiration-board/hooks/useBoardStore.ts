import { create } from 'zustand';
import { persist, PersistStorage, StorageValue } from 'zustand/middleware';
import {
  BoardItem,
  BoardItemType,
  BoardItemPosition,
  BoardItemSize,
} from '../types/board.types';
import {
  DEFAULT_CARD_WIDTH,
  DEFAULT_CARD_HEIGHT,
  DEFAULT_POSITION_X_MIN,
  DEFAULT_POSITION_X_MAX,
  DEFAULT_POSITION_Y_MIN,
  DEFAULT_POSITION_Y_MAX,
} from '../constants';

interface BoardState {
  items: BoardItem[];
  addItem: (content: string, type: BoardItemType) => void;
  updateItem: (id: string, content: string) => void;
  removeItem: (id: string) => void;
  updatePosition: (id: string, position: BoardItemPosition) => void;
  updateSize: (id: string, size: BoardItemSize) => void;
}

function isValidBoardItem(item: unknown): item is BoardItem {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;

  // Core fields are always required
  const hasRequiredFields =
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.type === 'string' &&
    ['quote', 'image', 'link', 'note'].includes(obj.type as string) &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string';

  if (!hasRequiredFields) return false;

  // Position and size are optional (legacy items may not have them; they get migrated)
  if (obj.position !== undefined) {
    if (
      typeof obj.position !== 'object' ||
      obj.position === null ||
      typeof (obj.position as Record<string, unknown>).x !== 'number' ||
      typeof (obj.position as Record<string, unknown>).y !== 'number'
    ) {
      return false;
    }
  }

  if (obj.size !== undefined) {
    if (
      typeof obj.size !== 'object' ||
      obj.size === null ||
      typeof (obj.size as Record<string, unknown>).width !== 'number' ||
      typeof (obj.size as Record<string, unknown>).height !== 'number'
    ) {
      return false;
    }
  }

  return true;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function migrateItem(item: Record<string, unknown>): BoardItem {
  const position =
    item.position &&
    typeof item.position === 'object' &&
    'x' in (item.position as object) &&
    'y' in (item.position as object)
      ? (item.position as { x: number; y: number })
      : {
          x: randomBetween(DEFAULT_POSITION_X_MIN, DEFAULT_POSITION_X_MAX),
          y: randomBetween(DEFAULT_POSITION_Y_MIN, DEFAULT_POSITION_Y_MAX),
        };

  const size =
    item.size &&
    typeof item.size === 'object' &&
    'width' in (item.size as object) &&
    'height' in (item.size as object)
      ? (item.size as { width: number; height: number })
      : {
          width: DEFAULT_CARD_WIDTH,
          height: DEFAULT_CARD_HEIGHT,
        };

  return {
    id: item.id as string,
    content: item.content as string,
    type: item.type as BoardItem['type'],
    createdAt: item.createdAt as string,
    updatedAt: item.updatedAt as string,
    position,
    size,
  };
}

function isValidStoredState(state: unknown): state is { items: BoardItem[] } {
  if (typeof state !== 'object' || state === null) return false;
  const obj = state as Record<string, unknown>;
  if (!Array.isArray(obj.items)) return false;
  return obj.items.every(isValidBoardItem);
}

const createLocalStorage = (): PersistStorage<Pick<BoardState, 'items'>> => ({
  getItem(name: string): StorageValue<Pick<BoardState, 'items'>> | null {
    try {
      const raw = localStorage.getItem(name);
      if (raw === null) return null;

      const parsed = JSON.parse(raw);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !isValidStoredState(parsed.state)
      ) {
        console.warn(
          '[useBoardStore] Invalid data found in localStorage. Discarding and initializing empty.'
        );
        localStorage.removeItem(name);
        return null;
      }

      // Migrate legacy items that may be missing position/size
      const migratedItems = parsed.state.items.map(
        (item: Record<string, unknown>) => migrateItem(item)
      );

      return {
        ...parsed,
        state: { items: migratedItems },
      } as StorageValue<Pick<BoardState, 'items'>>;
    } catch {
      console.warn(
        '[useBoardStore] Failed to parse localStorage data. Discarding and initializing empty.'
      );
      try {
        localStorage.removeItem(name);
      } catch {
        // localStorage may be unavailable
      }
      return null;
    }
  },

  setItem(name: string, value: StorageValue<Pick<BoardState, 'items'>>): void {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' ||
          error.code === 22 ||
          error.code === 1014)
      ) {
        console.warn(
          '[useBoardStore] localStorage quota exceeded. In-memory state preserved.'
        );
      } else {
        console.warn(
          '[useBoardStore] localStorage unavailable. In-memory state preserved.'
        );
      }
    }
  },

  removeItem(name: string): void {
    try {
      localStorage.removeItem(name);
    } catch {
      console.warn('[useBoardStore] localStorage unavailable.');
    }
  },
});

export const useBoardStore = create<BoardState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (content: string, type: BoardItemType) => {
        const now = new Date().toISOString();
        const newItem: BoardItem = {
          id: crypto.randomUUID(),
          content,
          type,
          createdAt: now,
          updatedAt: now,
          position: {
            x: randomBetween(DEFAULT_POSITION_X_MIN, DEFAULT_POSITION_X_MAX),
            y: randomBetween(DEFAULT_POSITION_Y_MIN, DEFAULT_POSITION_Y_MAX),
          },
          size: {
            width: DEFAULT_CARD_WIDTH,
            height: DEFAULT_CARD_HEIGHT,
          },
        };

        set((state) => ({
          items: [...state.items, newItem],
        }));
      },

      updateItem: (id: string, content: string) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, content, updatedAt: new Date().toISOString() }
              : item
          ),
        }));
      },

      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updatePosition: (id: string, position: BoardItemPosition) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, position } : item
          ),
        }));
      },

      updateSize: (id: string, size: BoardItemSize) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, size } : item
          ),
        }));
      },
    }),
    {
      name: 'inspiration-board-storage',
      storage: createLocalStorage(),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
