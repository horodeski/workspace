import * as fc from 'fast-check';
import { BoardItem, BoardItemType, BoardFilter } from '../types/board.types';
import {
  MIN_CARD_WIDTH,
  MAX_CARD_WIDTH,
  MIN_CARD_HEIGHT,
  MAX_CARD_HEIGHT,
} from '../constants';

const VALID_TYPES: BoardItemType[] = ['quote', 'image', 'link', 'note'];
const ALL_FILTERS: BoardFilter[] = ['all', ...VALID_TYPES];

// --- Generators ---

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

const boardItemArb: fc.Arbitrary<BoardItem> = fc.record({
  id: fc.uuid(),
  content: validContentArb,
  type: validTypeArb,
  createdAt: validDateArb,
  updatedAt: validDateArb,
  position: positionArb,
  size: sizeArb,
});

const filterArb = fc.constantFrom<BoardFilter>(...ALL_FILTERS);

// --- Z-index tracker logic (mirrors FreeformCanvas's handleBringToFront) ---

/**
 * A pure z-index tracker that mirrors the FreeformCanvas component logic:
 * - Maintains a map of id -> z-index
 * - Each bringToFront(id) assigns the next highest z-index
 */
class ZIndexTracker {
  private zIndexMap: Record<string, number> = {};
  private highestZIndex = 0;

  bringToFront(id: string): void {
    this.highestZIndex += 1;
    this.zIndexMap[id] = this.highestZIndex;
  }

  getZIndex(id: string): number {
    return this.zIndexMap[id] ?? 0;
  }

  getAllZIndices(): Record<string, number> {
    return { ...this.zIndexMap };
  }
}

// --- Filter logic (mirrors the canvas filtering behavior) ---

function filterItems(items: BoardItem[], filter: BoardFilter): BoardItem[] {
  return filter === 'all' ? items : items.filter((item) => item.type === filter);
}

/**
 * Property 7: Z-index ordering after drag
 *
 * For any sequence of drag-end operations on different cards, the most recently
 * dragged card SHALL always have the highest z-index among all cards. Formally:
 * after calling bringToFront(id), the z-index assigned to that id SHALL be
 * strictly greater than all other cards' z-indices.
 *
 * **Validates: Requirements 1.7**
 */
describe('Feature: freeform-inspiration-canvas, Property 7: Z-index ordering after drag', () => {
  it('most recently brought-to-front card has strictly highest z-index', () => {
    fc.assert(
      fc.property(
        // Generate a set of unique card ids (at least 2)
        fc.array(fc.uuid(), { minLength: 2, maxLength: 20 }).chain((ids) => {
          const uniqueIds = [...new Set(ids)];
          if (uniqueIds.length < 2) return fc.constant({ ids: ['a', 'b'], operations: ['a'] });
          // Generate a non-empty sequence of bringToFront operations using those ids
          return fc
            .array(fc.constantFrom(...uniqueIds), { minLength: 1, maxLength: 50 })
            .map((operations) => ({ ids: uniqueIds, operations }));
        }),
        ({ ids, operations }) => {
          const tracker = new ZIndexTracker();

          // Execute all bringToFront operations
          for (const id of operations) {
            tracker.bringToFront(id);
          }

          // The last operation's id should have the strictly highest z-index
          const lastId = operations[operations.length - 1];
          const lastZIndex = tracker.getZIndex(lastId);

          for (const id of ids) {
            if (id !== lastId) {
              const otherZIndex = tracker.getZIndex(id);
              expect(lastZIndex).toBeGreaterThan(otherZIndex);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('z-index is monotonically increasing with each bringToFront call', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 30 }),
        (operations) => {
          const tracker = new ZIndexTracker();
          let previousZ = 0;

          for (const id of operations) {
            tracker.bringToFront(id);
            const currentZ = tracker.getZIndex(id);
            expect(currentZ).toBeGreaterThan(previousZ);
            previousZ = currentZ;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 8: Filter displays only matching items
 *
 * For any set of BoardItems and any selected type filter, the canvas SHALL
 * render exactly the subset of items whose type matches the filter (or all
 * items when filter is "all"). Filtered items SHALL retain their persisted
 * positions — no position modification occurs due to filtering.
 *
 * **Validates: Requirements 5.1, 5.2**
 */
describe('Feature: freeform-inspiration-canvas, Property 8: Filter displays only matching items', () => {
  it('filter returns exact subset and positions are unchanged', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 0, maxLength: 30 }),
        filterArb,
        (items, filter) => {
          const result = filterItems(items, filter);

          if (filter === 'all') {
            // All items should be returned
            expect(result).toHaveLength(items.length);
            expect(result).toEqual(items);
          } else {
            // Only items of matching type
            const expectedItems = items.filter((item) => item.type === filter);
            expect(result).toHaveLength(expectedItems.length);

            for (const item of result) {
              expect(item.type).toBe(filter);
            }

            // All matching items from original should be present
            const resultIds = new Set(result.map((item) => item.id));
            for (const expected of expectedItems) {
              expect(resultIds.has(expected.id)).toBe(true);
            }
          }

          // Positions must remain unchanged for all filtered items
          for (const filteredItem of result) {
            const original = items.find((item) => item.id === filteredItem.id);
            expect(original).toBeDefined();
            expect(filteredItem.position).toEqual(original!.position);
            expect(filteredItem.size).toEqual(original!.size);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filtering never modifies the original items array', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 1, maxLength: 20 }),
        filterArb,
        (items, filter) => {
          // Deep copy to compare after filtering
          const originalItems = items.map((item) => ({ ...item, position: { ...item.position }, size: { ...item.size } }));

          filterItems(items, filter);

          // Original array must be unchanged
          expect(items).toEqual(originalItems);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filter with specific type returns zero items when none match', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 0, maxLength: 20 }),
        validTypeArb,
        (items, filterType) => {
          // Remove all items of the filter type
          const itemsWithoutType = items.filter((item) => item.type !== filterType);

          const result = filterItems(itemsWithoutType, filterType);
          expect(result).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
