import { migrateLegacyData } from '../hooks/migration';
import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  LEGACY_BOARD_NAME,
  DEFAULT_ITEM_WIDTH,
  DEFAULT_ITEM_HEIGHT,
} from '../constants';

describe('migrateLegacyData', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('migrates valid legacy items to a new board named "Inspirações"', () => {
    const legacyItems = [
      {
        id: 'item-1',
        content: 'Test quote',
        type: 'quote',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
        position: { x: 100, y: 200 },
        size: { width: 240, height: 180 },
      },
      {
        id: 'item-2',
        content: 'Test image',
        type: 'image',
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-02T00:00:00.000Z',
        position: { x: 300, y: 400 },
        size: { width: 300, height: 200 },
      },
    ];

    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({ state: { items: legacyItems }, version: 0 })
    );

    migrateLegacyData();

    const newData = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(newData.state.boards).toHaveLength(1);
    expect(newData.state.boards[0].name).toBe(LEGACY_BOARD_NAME);
    expect(newData.state.boards[0].items).toHaveLength(2);
    expect(newData.state.activeBoardId).toBe(newData.state.boards[0].id);
  });

  it('preserves all attributes of valid items during migration', () => {
    const legacyItem = {
      id: 'item-preserve',
      content: 'Preserved content',
      type: 'note',
      createdAt: '2024-03-15T10:30:00.000Z',
      updatedAt: '2024-03-16T14:00:00.000Z',
      position: { x: 500, y: 600 },
      size: { width: 400, height: 300 },
    };

    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({ state: { items: [legacyItem] }, version: 0 })
    );

    migrateLegacyData();

    const newData = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    const migratedItem = newData.state.boards[0].items[0];

    expect(migratedItem.id).toBe(legacyItem.id);
    expect(migratedItem.content).toBe(legacyItem.content);
    expect(migratedItem.type).toBe(legacyItem.type);
    expect(migratedItem.createdAt).toBe(legacyItem.createdAt);
    expect(migratedItem.updatedAt).toBe(legacyItem.updatedAt);
    expect(migratedItem.position).toEqual(legacyItem.position);
    expect(migratedItem.size).toEqual(legacyItem.size);
  });

  it('skips migration when new-format data already exists', () => {
    const legacyItems = [
      {
        id: 'item-1',
        content: 'Legacy content',
        type: 'quote',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
        position: { x: 0, y: 0 },
        size: { width: 240, height: 180 },
      },
    ];

    const existingNewData = {
      state: {
        boards: [
          {
            id: 'existing-board',
            name: 'Existing Board',
            items: [],
            createdAt: '2024-05-01T00:00:00.000Z',
          },
        ],
        activeBoardId: 'existing-board',
      },
      version: 0,
    };

    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({ state: { items: legacyItems }, version: 0 })
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingNewData));

    migrateLegacyData();

    // New data should remain unchanged
    const newData = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(newData.state.boards[0].name).toBe('Existing Board');
    expect(newData.state.boards[0].items).toHaveLength(0);

    // Legacy key should still exist (migration was skipped)
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).not.toBeNull();
  });

  it('discards invalid items (missing required fields) and keeps valid ones', () => {
    const legacyItems = [
      {
        id: 'valid-item',
        content: 'Valid content',
        type: 'link',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
        position: { x: 10, y: 20 },
        size: { width: 240, height: 180 },
      },
      {
        // Missing id
        content: 'No ID item',
        type: 'note',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
      {
        id: 'missing-content',
        // Missing content
        type: 'quote',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
      {
        id: 'missing-type',
        content: 'Has content',
        // Missing type
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
      {
        id: 'missing-dates',
        content: 'Has content',
        type: 'image',
        // Missing createdAt and updatedAt
      },
    ];

    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({ state: { items: legacyItems }, version: 0 })
    );

    migrateLegacyData();

    const newData = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(newData.state.boards[0].items).toHaveLength(1);
    expect(newData.state.boards[0].items[0].id).toBe('valid-item');

    // Should have warned about each invalid item
    expect(console.warn).toHaveBeenCalledTimes(4);
  });

  it('removes the legacy key after successful migration', () => {
    const legacyItems = [
      {
        id: 'item-1',
        content: 'Test content',
        type: 'quote',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
        position: { x: 0, y: 0 },
        size: { width: 240, height: 180 },
      },
    ];

    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({ state: { items: legacyItems }, version: 0 })
    );

    migrateLegacyData();

    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it('handles invalid JSON in legacy key gracefully', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, 'not valid json {{{');

    migrateLegacyData();

    expect(console.warn).toHaveBeenCalledWith(
      'Failed to parse legacy board data from localStorage. Discarding invalid data.'
    );
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('does nothing when no legacy key exists', () => {
    migrateLegacyData();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('assigns default position and size for items without them', () => {
    const legacyItems = [
      {
        id: 'item-no-spatial',
        content: 'Item without position/size',
        type: 'note',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
        // No position or size
      },
    ];

    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({ state: { items: legacyItems }, version: 0 })
    );

    migrateLegacyData();

    const newData = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    const migratedItem = newData.state.boards[0].items[0];

    expect(migratedItem.position).toEqual({ x: 0, y: 0 });
    expect(migratedItem.size).toEqual({
      width: DEFAULT_ITEM_WIDTH,
      height: DEFAULT_ITEM_HEIGHT,
    });
  });
});
