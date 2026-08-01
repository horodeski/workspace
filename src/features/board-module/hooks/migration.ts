import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  LEGACY_BOARD_NAME,
  DEFAULT_ITEM_WIDTH,
  DEFAULT_ITEM_HEIGHT,
} from '../constants';

interface LegacyItem {
  id?: unknown;
  content?: unknown;
  type?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  [key: string]: unknown;
}

interface LegacyStorageData {
  state?: {
    items?: LegacyItem[];
  };
  version?: number;
}

function isValidLegacyItem(item: unknown): item is LegacyItem & {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
} {
  if (typeof item !== 'object' || item === null) return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i.id === 'string' &&
    typeof i.content === 'string' &&
    typeof i.type === 'string' &&
    typeof i.createdAt === 'string' &&
    typeof i.updatedAt === 'string'
  );
}

/**
 * Migrates legacy inspiration-board data to the new board-module format.
 * This function should be called at module scope BEFORE the Zustand store
 * is created, so that when persist middleware reads localStorage it finds
 * the already-migrated data.
 */
export function migrateLegacyData(): void {
  try {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return;

    const newDataExists = localStorage.getItem(STORAGE_KEY);
    if (newDataExists) return;

    let legacyData: LegacyStorageData;
    try {
      legacyData = JSON.parse(legacyRaw) as LegacyStorageData;
    } catch {
      console.warn(
        'Failed to parse legacy board data from localStorage. Discarding invalid data.'
      );
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return;
    }

    const legacyItems = legacyData?.state?.items;
    if (!Array.isArray(legacyItems)) {
      console.warn(
        'Legacy board data does not contain a valid items array. Discarding.'
      );
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return;
    }

    const validItems = legacyItems.filter((item) => {
      if (isValidLegacyItem(item)) {
        return true;
      }
      console.warn('Discarding invalid legacy board item:', item);
      return false;
    });

    // Build migrated items with defaults for position/size if missing
    const migratedItems = validItems.map((item) => ({
      id: item.id,
      content: item.content,
      type: item.type,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      position: item.position ?? { x: 0, y: 0 },
      size: item.size ?? { width: DEFAULT_ITEM_WIDTH, height: DEFAULT_ITEM_HEIGHT },
    }));

    const now = new Date().toISOString();
    const boardId = crypto.randomUUID();

    const newState = {
      state: {
        boards: [
          {
            id: boardId,
            name: LEGACY_BOARD_NAME,
            items: migratedItems,
            createdAt: now,
          },
        ],
        activeBoardId: boardId,
      },
      version: 0,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.warn('Error during legacy board data migration:', error);
  }
}
