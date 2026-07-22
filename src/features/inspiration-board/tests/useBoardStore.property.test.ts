import * as fc from 'fast-check';
import { useBoardStore } from '../hooks/useBoardStore';
import { BoardItemType } from '../types/board.types';
import {
  DEFAULT_POSITION_X_MIN,
  DEFAULT_POSITION_X_MAX,
  DEFAULT_POSITION_Y_MIN,
  DEFAULT_POSITION_Y_MAX,
  MIN_CARD_WIDTH,
  MAX_CARD_WIDTH,
  MIN_CARD_HEIGHT,
  MAX_CARD_HEIGHT,
} from '../constants';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const VALID_TYPES: BoardItemType[] = ['quote', 'image', 'link', 'note'];

/**
 * Generator for valid content: 1–500 characters, not whitespace-only.
 */
const validContentArb = fc
  .tuple(
    fc.string({ minLength: 0, maxLength: 498 }),
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789')
  )
  .map(([str, nonWs]) => {
    const insertPos = Math.floor(str.length / 2);
    return str.slice(0, insertPos) + nonWs + str.slice(insertPos);
  })
  .filter((s) => s.length >= 1 && s.length <= 500 && s.trim().length > 0);

const validTypeArb = fc.constantFrom<BoardItemType>(...VALID_TYPES);

/**
 * Property 1: Adding a valid item produces a well-formed BoardItem
 *
 * For any valid content string (1–500 non-whitespace-only characters) and for any valid type
 * ("quote", "image", "link", or "note"), calling addItem(content, type) SHALL produce a new
 * BoardItem in the store with: a unique UUID id, the exact provided content, the exact provided
 * type, and a valid ISO 8601 createdAt timestamp.
 *
 * **Validates: Requirements 1.1**
 */
describe('Feature: inspiration-board, Property 1: Adding a valid item produces a well-formed BoardItem', () => {
  beforeEach(() => {
    useBoardStore.setState({ items: [] });
  });

  it('addItem produces a BoardItem with valid UUID id, exact content, exact type, and valid ISO 8601 createdAt', () => {
    fc.assert(
      fc.property(validContentArb, validTypeArb, (content, type) => {
        useBoardStore.setState({ items: [] });

        const { addItem } = useBoardStore.getState();
        addItem(content, type);

        const { items } = useBoardStore.getState();
        expect(items).toHaveLength(1);

        const item = items[0];

        expect(item.id).toMatch(UUID_REGEX);
        expect(item.content).toBe(content);
        expect(item.type).toBe(type);
        expect(item.createdAt).toMatch(ISO_8601_REGEX);

        const parsedDate = new Date(item.createdAt);
        expect(parsedDate.getTime()).not.toBeNaN();

        expect(item.updatedAt).toMatch(ISO_8601_REGEX);
        expect(item.updatedAt).toBe(item.createdAt);
      }),
      { numRuns: 100 }
    );
  });

  it('each addItem call produces a unique id across multiple calls', () => {
    fc.assert(
      fc.property(validContentArb, validTypeArb, (content, type) => {
        const { addItem } = useBoardStore.getState();
        addItem(content, type);

        const { items } = useBoardStore.getState();
        const ids = items.map((item) => item.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(ids.length);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Operations on non-existent ids are no-ops
 *
 * For any array of BoardItems and for any id that does not exist in that array,
 * calling `removeItem(id)` or `updateItem(id, content)` SHALL leave the
 * collection unchanged.
 *
 * **Validates: Requirements 3.3, 4.5**
 */
describe('Feature: inspiration-board, Property 4: Operations on non-existent ids are no-ops', () => {
  const validDateArb = fc
    .integer({ min: 946684800000, max: 4102444800000 })
    .map((ts) => new Date(ts).toISOString());

  const positionArb = fc.record({
    x: fc.integer({ min: 0, max: 2800 }),
    y: fc.integer({ min: 0, max: 1800 }),
  });

  const sizeArb = fc.record({
    width: fc.integer({ min: MIN_CARD_WIDTH, max: MAX_CARD_WIDTH }),
    height: fc.integer({ min: MIN_CARD_HEIGHT, max: MAX_CARD_HEIGHT }),
  });

  const boardItemArb = fc.record({
    id: fc.uuid(),
    content: validContentArb,
    type: validTypeArb,
    createdAt: validDateArb,
    updatedAt: validDateArb,
    position: positionArb,
    size: sizeArb,
  });

  beforeEach(() => {
    useBoardStore.setState({ items: [] });
  });

  it('removeItem with non-existent id leaves collection unchanged', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 0, maxLength: 20 }),
        fc.uuid(),
        (items, nonExistentId) => {
          // Ensure the generated id is not in the items array
          fc.pre(!items.some((item) => item.id === nonExistentId));

          // Set up store with items directly
          useBoardStore.setState({ items: [...items] });

          // Call removeItem with a non-existent id
          useBoardStore.getState().removeItem(nonExistentId);

          // Verify items are unchanged
          const storeItems = useBoardStore.getState().items;
          expect(storeItems).toHaveLength(items.length);
          expect(storeItems).toEqual(items);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('updateItem with non-existent id leaves collection unchanged', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 0, maxLength: 20 }),
        fc.uuid(),
        validContentArb,
        (items, nonExistentId, newContent) => {
          // Ensure the generated id is not in the items array
          fc.pre(!items.some((item) => item.id === nonExistentId));

          // Set up store with items directly
          useBoardStore.setState({ items: [...items] });

          // Call updateItem with a non-existent id
          useBoardStore.getState().updateItem(nonExistentId, newContent);

          // Verify items are unchanged
          const storeItems = useBoardStore.getState().items;
          expect(storeItems).toHaveLength(items.length);
          expect(storeItems).toEqual(items);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: Update preserves identity fields and modifies content/timestamp
 *
 * For any existing BoardItem in the store and for any new valid content string,
 * calling `updateItem(id, newContent)` SHALL update the item's content to the
 * new value and set updatedAt to a timestamp >= the previous updatedAt, while
 * preserving the original id, type, and createdAt.
 *
 * **Validates: Requirements 4.2**
 */
describe('Feature: inspiration-board, Property 5: Update preserves identity fields', () => {
  beforeEach(() => {
    useBoardStore.setState({ items: [] });
  });

  it('updateItem updates content and updatedAt while preserving id, type, and createdAt', () => {
    fc.assert(
      fc.property(
        validContentArb,
        validTypeArb,
        validContentArb,
        (initialContent, type, newContent) => {
          // Reset the store
          useBoardStore.setState({ items: [] });

          // Add an item with known content/type
          useBoardStore.getState().addItem(initialContent, type);

          const items = useBoardStore.getState().items;
          expect(items).toHaveLength(1);

          const originalItem = items[0];
          const originalId = originalItem.id;
          const originalType = originalItem.type;
          const originalCreatedAt = originalItem.createdAt;
          const originalUpdatedAt = originalItem.updatedAt;

          // Call updateItem with new content
          useBoardStore.getState().updateItem(originalId, newContent);

          const updatedItems = useBoardStore.getState().items;
          expect(updatedItems).toHaveLength(1);

          const updatedItem = updatedItems[0];

          // Content is updated to new value
          expect(updatedItem.content).toBe(newContent);

          // updatedAt is >= previous updatedAt
          expect(
            new Date(updatedItem.updatedAt).getTime()
          ).toBeGreaterThanOrEqual(new Date(originalUpdatedAt).getTime());

          // id is preserved
          expect(updatedItem.id).toBe(originalId);

          // type is preserved
          expect(updatedItem.type).toBe(originalType);

          // createdAt is preserved
          expect(updatedItem.createdAt).toBe(originalCreatedAt);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 7: Persistence round-trip preserves data
 *
 * For any valid array of BoardItems, serializing the store state to localStorage
 * and then rehydrating a new store instance from that localStorage data SHALL
 * produce a collection equal to the original.
 *
 * **Validates: Requirements 6.1, 6.2**
 */
describe('Feature: inspiration-board, Property 7: Persistence round-trip preserves data', () => {
  const STORAGE_KEY = 'inspiration-board-storage';

  const validDateArb = fc
    .integer({ min: 946684800000, max: 4102444800000 })
    .map((ts) => new Date(ts).toISOString());

  const positionArb = fc.record({
    x: fc.integer({ min: 0, max: 2800 }),
    y: fc.integer({ min: 0, max: 1800 }),
  });

  const sizeArb = fc.record({
    width: fc.integer({ min: MIN_CARD_WIDTH, max: MAX_CARD_WIDTH }),
    height: fc.integer({ min: MIN_CARD_HEIGHT, max: MAX_CARD_HEIGHT }),
  });

  const boardItemArb = fc.record({
    id: fc.uuid(),
    content: validContentArb,
    type: validTypeArb,
    createdAt: validDateArb,
    updatedAt: validDateArb,
    position: positionArb,
    size: sizeArb,
  });

  beforeEach(() => {
    localStorage.clear();
    useBoardStore.setState({ items: [] });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('serializing to localStorage and rehydrating produces equal data', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 0, maxLength: 20 }),
        (items) => {
          // Clear localStorage and reset store
          localStorage.clear();
          useBoardStore.setState({ items: [] });

          // Write items to localStorage in the expected persisted format
          const persistedData = JSON.stringify({
            state: { items },
            version: 0,
          });
          localStorage.setItem(STORAGE_KEY, persistedData);

          // Rehydrate the store from localStorage
          useBoardStore.persist.rehydrate();

          // Verify the store's items match the original array
          const storeItems = useBoardStore.getState().items;
          expect(storeItems).toEqual(items);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 8: Invalid localStorage data results in empty initialization
 *
 * For any localStorage value that is not valid JSON or does not conform to the
 * expected BoardItems data structure, rehydrating the store SHALL produce an
 * empty items collection and log a warning.
 *
 * **Validates: Requirements 6.3**
 */
describe('Feature: inspiration-board, Property 8: Invalid localStorage results in empty init', () => {
  const STORAGE_KEY = 'inspiration-board-storage';

  beforeEach(() => {
    localStorage.clear();
    useBoardStore.setState({ items: [] });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  /**
   * Generator for invalid JSON strings - strings that cannot be parsed as JSON.
   */
  const invalidJsonArb = fc
    .oneof(
      // Random strings that aren't valid JSON
      fc.string({ minLength: 1, maxLength: 200 }).filter((s) => {
        try {
          JSON.parse(s);
          return false;
        } catch {
          return true;
        }
      }),
      // Deliberately malformed JSON patterns
      fc.constantFrom(
        '{missing-quotes: true}',
        '{"unclosed": ',
        '[1, 2, 3',
        'undefined',
        'NaN',
        '{key: value}',
        "{'single': 'quotes'}",
        '{,}',
        '[,]'
      )
    );

  /**
   * Generator for valid JSON that does NOT conform to the expected shape.
   * The expected shape is: { state: { items: [BoardItem, ...] }, version: 0 }
   */
  const invalidStructureArb = fc.oneof(
    // Primitive JSON values (not objects with state.items)
    fc.constantFrom(
      JSON.stringify(null),
      JSON.stringify(42),
      JSON.stringify('hello'),
      JSON.stringify(true),
      JSON.stringify([1, 2, 3])
    ),
    // Object missing state field
    fc.record({
      version: fc.integer(),
    }).map((obj) => JSON.stringify(obj)),
    // Object with state but missing items
    fc.record({
      state: fc.record({ notItems: fc.string() }),
      version: fc.integer(),
    }).map((obj) => JSON.stringify(obj)),
    // Object with state.items that is not an array
    fc.record({
      state: fc.record({ items: fc.string() }),
      version: fc.integer(),
    }).map((obj) => JSON.stringify(obj)),
    // Object with state.items array but items have wrong shape
    fc.record({
      state: fc.record({
        items: fc.array(
          fc.oneof(
            // Missing required fields
            fc.record({ id: fc.string() }).map((r) => r as unknown),
            // Wrong type field value
            fc.record({
              id: fc.uuid(),
              content: fc.string(),
              type: fc.constantFrom('invalid', 'wrong', 'bad', 'text', 'video'),
              createdAt: fc.string(),
              updatedAt: fc.string(),
            }).map((r) => r as unknown),
            // Non-string fields
            fc.record({
              id: fc.integer(),
              content: fc.integer(),
              type: fc.integer(),
              createdAt: fc.integer(),
              updatedAt: fc.integer(),
            }).map((r) => r as unknown)
          ),
          { minLength: 1, maxLength: 5 }
        ),
      }),
      version: fc.integer(),
    }).map((obj) => JSON.stringify(obj))
  );

  it('invalid JSON in localStorage results in empty items and console.warn', () => {
    fc.assert(
      fc.property(invalidJsonArb, (invalidJson) => {
        // Reset state and mocks
        localStorage.clear();
        useBoardStore.setState({ items: [] });
        (console.warn as jest.Mock).mockClear();

        // Set invalid JSON to localStorage
        localStorage.setItem(STORAGE_KEY, invalidJson);

        // Rehydrate the store
        useBoardStore.persist.rehydrate();

        // Store should have empty items
        const { items } = useBoardStore.getState();
        expect(items).toEqual([]);

        // console.warn should have been called
        expect(console.warn).toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  it('valid JSON with wrong structure results in empty items and console.warn', () => {
    fc.assert(
      fc.property(invalidStructureArb, (invalidStructure) => {
        // Reset state and mocks
        localStorage.clear();
        useBoardStore.setState({ items: [] });
        (console.warn as jest.Mock).mockClear();

        // Set invalid structure to localStorage
        localStorage.setItem(STORAGE_KEY, invalidStructure);

        // Rehydrate the store
        useBoardStore.persist.rehydrate();

        // Store should have empty items
        const { items } = useBoardStore.getState();
        expect(items).toEqual([]);

        // console.warn should have been called
        expect(console.warn).toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });
});
