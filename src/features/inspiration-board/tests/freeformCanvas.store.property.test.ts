import * as fc from 'fast-check';
import { useBoardStore } from '../hooks/useBoardStore';
import { BoardItemType } from '../types/board.types';
import {
  DEFAULT_POSITION_X_MIN,
  DEFAULT_POSITION_X_MAX,
  DEFAULT_POSITION_Y_MIN,
  DEFAULT_POSITION_Y_MAX,
  DEFAULT_CARD_WIDTH,
  DEFAULT_CARD_HEIGHT,
  MIN_CARD_WIDTH,
  MAX_CARD_WIDTH,
  MIN_CARD_HEIGHT,
  MAX_CARD_HEIGHT,
} from '../constants';

const STORAGE_KEY = 'inspiration-board-storage';

const VALID_TYPES: BoardItemType[] = ['quote', 'image', 'link', 'note'];

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

/**
 * Property 1: Position persistence round-trip (legacy migration aspect)
 *
 * For any BoardItem saved WITHOUT position/size fields (legacy items),
 * loading from localStorage SHALL assign valid defaults:
 * position x in [100, 400], y in [100, 300]; size 240×180.
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 */
describe('Feature: freeform-inspiration-canvas, Property 1: Position persistence round-trip (legacy migration)', () => {
  beforeEach(() => {
    localStorage.clear();
    useBoardStore.setState({ items: [] });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('legacy items without position/size get valid defaults on load', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            content: validContentArb,
            type: validTypeArb,
            createdAt: validDateArb,
            updatedAt: validDateArb,
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (legacyItems) => {
          localStorage.clear();
          useBoardStore.setState({ items: [] });

          // Write legacy items (no position/size) to localStorage
          const persistedData = JSON.stringify({
            state: { items: legacyItems },
            version: 0,
          });
          localStorage.setItem(STORAGE_KEY, persistedData);

          // Rehydrate store from localStorage
          useBoardStore.persist.rehydrate();

          const storeItems = useBoardStore.getState().items;
          expect(storeItems).toHaveLength(legacyItems.length);

          for (let i = 0; i < storeItems.length; i++) {
            const item = storeItems[i];
            const legacy = legacyItems[i];

            // Core fields preserved
            expect(item.id).toBe(legacy.id);
            expect(item.content).toBe(legacy.content);
            expect(item.type).toBe(legacy.type);
            expect(item.createdAt).toBe(legacy.createdAt);
            expect(item.updatedAt).toBe(legacy.updatedAt);

            // Position assigned with valid defaults
            expect(item.position).toBeDefined();
            expect(item.position.x).toBeGreaterThanOrEqual(DEFAULT_POSITION_X_MIN);
            expect(item.position.x).toBeLessThanOrEqual(DEFAULT_POSITION_X_MAX);
            expect(item.position.y).toBeGreaterThanOrEqual(DEFAULT_POSITION_Y_MIN);
            expect(item.position.y).toBeLessThanOrEqual(DEFAULT_POSITION_Y_MAX);

            // Size assigned with defaults
            expect(item.size).toBeDefined();
            expect(item.size.width).toBe(DEFAULT_CARD_WIDTH);
            expect(item.size.height).toBe(DEFAULT_CARD_HEIGHT);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Default position within specified range
 *
 * For any newly added BoardItem, the assigned default position SHALL have
 * x in [100, 400] and y in [100, 300].
 *
 * **Validates: Requirements 1.4, 2.3**
 */
describe('Feature: freeform-inspiration-canvas, Property 3: Default position within specified range', () => {
  beforeEach(() => {
    useBoardStore.setState({ items: [] });
  });

  it('newly added items have default position x in [100,400] and y in [100,300]', () => {
    fc.assert(
      fc.property(validContentArb, validTypeArb, (content, type) => {
        useBoardStore.setState({ items: [] });

        useBoardStore.getState().addItem(content, type);

        const { items } = useBoardStore.getState();
        expect(items).toHaveLength(1);

        const item = items[0];
        expect(item.position.x).toBeGreaterThanOrEqual(DEFAULT_POSITION_X_MIN);
        expect(item.position.x).toBeLessThanOrEqual(DEFAULT_POSITION_X_MAX);
        expect(item.position.y).toBeGreaterThanOrEqual(DEFAULT_POSITION_Y_MIN);
        expect(item.position.y).toBeLessThanOrEqual(DEFAULT_POSITION_Y_MAX);
      }),
      { numRuns: 100 }
    );
  });

  it('newly added items have default size of 240x180', () => {
    fc.assert(
      fc.property(validContentArb, validTypeArb, (content, type) => {
        useBoardStore.setState({ items: [] });

        useBoardStore.getState().addItem(content, type);

        const { items } = useBoardStore.getState();
        expect(items).toHaveLength(1);

        const item = items[0];
        expect(item.size.width).toBe(DEFAULT_CARD_WIDTH);
        expect(item.size.height).toBe(DEFAULT_CARD_HEIGHT);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Store updatePosition and updateSize correctness
 *
 * For any existing BoardItem id and valid position/size value, calling
 * updatePosition(id, pos) changes ONLY that item's position; calling
 * updateSize(id, size) changes ONLY that item's size. All other items
 * and all other fields of the target item remain unchanged.
 *
 * **Validates: Requirements 6.4, 6.5**
 */
describe('Feature: freeform-inspiration-canvas, Property 4: Store updatePosition and updateSize correctness', () => {
  beforeEach(() => {
    useBoardStore.setState({ items: [] });
  });

  it('updatePosition changes only the target item position, all else unchanged', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 2, maxLength: 10 }),
        positionArb,
        (items, newPosition) => {
          useBoardStore.setState({ items: [...items] });

          // Pick a random target index
          const targetIndex = Math.floor(Math.random() * items.length);
          const targetId = items[targetIndex].id;

          // Snapshot state before
          const beforeItems = useBoardStore.getState().items.map((i) => ({ ...i }));

          useBoardStore.getState().updatePosition(targetId, newPosition);

          const afterItems = useBoardStore.getState().items;

          expect(afterItems).toHaveLength(beforeItems.length);

          for (let i = 0; i < afterItems.length; i++) {
            if (afterItems[i].id === targetId) {
              // Target: position changed
              expect(afterItems[i].position).toEqual(newPosition);
              // All other fields unchanged
              expect(afterItems[i].id).toBe(beforeItems[i].id);
              expect(afterItems[i].content).toBe(beforeItems[i].content);
              expect(afterItems[i].type).toBe(beforeItems[i].type);
              expect(afterItems[i].createdAt).toBe(beforeItems[i].createdAt);
              expect(afterItems[i].updatedAt).toBe(beforeItems[i].updatedAt);
              expect(afterItems[i].size).toEqual(beforeItems[i].size);
            } else {
              // Non-target: entirely unchanged
              expect(afterItems[i]).toEqual(beforeItems[i]);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('updateSize changes only the target item size, all else unchanged', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 2, maxLength: 10 }),
        sizeArb,
        (items, newSize) => {
          useBoardStore.setState({ items: [...items] });

          const targetIndex = Math.floor(Math.random() * items.length);
          const targetId = items[targetIndex].id;

          const beforeItems = useBoardStore.getState().items.map((i) => ({ ...i }));

          useBoardStore.getState().updateSize(targetId, newSize);

          const afterItems = useBoardStore.getState().items;

          expect(afterItems).toHaveLength(beforeItems.length);

          for (let i = 0; i < afterItems.length; i++) {
            if (afterItems[i].id === targetId) {
              // Target: size changed
              expect(afterItems[i].size).toEqual(newSize);
              // All other fields unchanged
              expect(afterItems[i].id).toBe(beforeItems[i].id);
              expect(afterItems[i].content).toBe(beforeItems[i].content);
              expect(afterItems[i].type).toBe(beforeItems[i].type);
              expect(afterItems[i].createdAt).toBe(beforeItems[i].createdAt);
              expect(afterItems[i].updatedAt).toBe(beforeItems[i].updatedAt);
              expect(afterItems[i].position).toEqual(beforeItems[i].position);
            } else {
              // Non-target: entirely unchanged
              expect(afterItems[i]).toEqual(beforeItems[i]);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: No-op for non-existent id
 *
 * For any id that does not exist in the store, calling updatePosition
 * or updateSize SHALL leave the entire store state unchanged.
 *
 * **Validates: Requirements 6.6**
 */
describe('Feature: freeform-inspiration-canvas, Property 5: No-op for non-existent id', () => {
  beforeEach(() => {
    useBoardStore.setState({ items: [] });
  });

  it('updatePosition with non-existent id leaves entire state unchanged', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 0, maxLength: 10 }),
        fc.uuid(),
        positionArb,
        (items, nonExistentId, position) => {
          fc.pre(!items.some((item) => item.id === nonExistentId));

          useBoardStore.setState({ items: [...items] });

          const beforeItems = useBoardStore.getState().items;

          useBoardStore.getState().updatePosition(nonExistentId, position);

          const afterItems = useBoardStore.getState().items;
          expect(afterItems).toEqual(beforeItems);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('updateSize with non-existent id leaves entire state unchanged', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 0, maxLength: 10 }),
        fc.uuid(),
        sizeArb,
        (items, nonExistentId, size) => {
          fc.pre(!items.some((item) => item.id === nonExistentId));

          useBoardStore.setState({ items: [...items] });

          const beforeItems = useBoardStore.getState().items;

          useBoardStore.getState().updateSize(nonExistentId, size);

          const afterItems = useBoardStore.getState().items;
          expect(afterItems).toEqual(beforeItems);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: updatedAt invariant on spatial changes
 *
 * For any BoardItem, calling updatePosition or updateSize SHALL NOT modify
 * the item's updatedAt timestamp.
 *
 * **Validates: Requirements 6.7**
 */
describe('Feature: freeform-inspiration-canvas, Property 6: updatedAt invariant on spatial changes', () => {
  beforeEach(() => {
    useBoardStore.setState({ items: [] });
  });

  it('updatePosition does not modify updatedAt', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 1, maxLength: 10 }),
        positionArb,
        (items, newPosition) => {
          useBoardStore.setState({ items: [...items] });

          const targetIndex = Math.floor(Math.random() * items.length);
          const targetId = items[targetIndex].id;

          const beforeUpdatedAt = useBoardStore
            .getState()
            .items.find((i) => i.id === targetId)!.updatedAt;

          useBoardStore.getState().updatePosition(targetId, newPosition);

          const afterUpdatedAt = useBoardStore
            .getState()
            .items.find((i) => i.id === targetId)!.updatedAt;

          expect(afterUpdatedAt).toBe(beforeUpdatedAt);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('updateSize does not modify updatedAt', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 1, maxLength: 10 }),
        sizeArb,
        (items, newSize) => {
          useBoardStore.setState({ items: [...items] });

          const targetIndex = Math.floor(Math.random() * items.length);
          const targetId = items[targetIndex].id;

          const beforeUpdatedAt = useBoardStore
            .getState()
            .items.find((i) => i.id === targetId)!.updatedAt;

          useBoardStore.getState().updateSize(targetId, newSize);

          const afterUpdatedAt = useBoardStore
            .getState()
            .items.find((i) => i.id === targetId)!.updatedAt;

          expect(afterUpdatedAt).toBe(beforeUpdatedAt);
        }
      ),
      { numRuns: 100 }
    );
  });
});
