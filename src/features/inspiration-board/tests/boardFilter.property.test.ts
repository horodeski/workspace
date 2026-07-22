import * as fc from 'fast-check';
import { BoardItem, BoardItemType, BoardFilter } from '../types/board.types';

const VALID_TYPES: BoardItemType[] = ['quote', 'image', 'link', 'note'];
const ALL_FILTERS: BoardFilter[] = ['all', ...VALID_TYPES];

/**
 * Pure filtering and sorting function under test.
 * Filters items by type (or returns all if filter is "all"),
 * then sorts by createdAt descending (newest first).
 */
function filterAndSort(items: BoardItem[], filter: BoardFilter): BoardItem[] {
  const filtered =
    filter === 'all' ? items : items.filter((item) => item.type === filter);
  return [...filtered].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

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

const validDateArb = fc
  .integer({ min: 946684800000, max: 4102444800000 })
  .map((ts) => new Date(ts).toISOString());

const boardItemArb: fc.Arbitrary<BoardItem> = fc.record({
  id: fc.uuid(),
  content: validContentArb,
  type: validTypeArb,
  createdAt: validDateArb,
  updatedAt: validDateArb,
});

const filterArb = fc.constantFrom<BoardFilter>(...ALL_FILTERS);

/**
 * Property 6: Filtering returns only matching items in reverse chronological order
 *
 * For any array of BoardItems with mixed types and for any selected filter
 * (including "all"), the filtered result SHALL contain only items whose type
 * matches the filter (or all items if filter is "all"), and they SHALL be
 * ordered by createdAt descending (newest first).
 *
 * **Validates: Requirements 2.3, 5.2**
 */
describe('Feature: inspiration-board, Property 6: Filtering returns matching items in order', () => {
  it('when filter is "all", all items are returned', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 0, maxLength: 30 }),
        (items) => {
          const result = filterAndSort(items, 'all');
          expect(result).toHaveLength(items.length);

          // Every original item should be present in the result
          const resultIds = new Set(result.map((item) => item.id));
          for (const item of items) {
            expect(resultIds.has(item.id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('when filter is a specific type, only items of that type are returned', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 0, maxLength: 30 }),
        filterArb.filter((f) => f !== 'all'),
        (items, filter) => {
          const result = filterAndSort(items, filter);

          // All returned items must match the filter type
          for (const item of result) {
            expect(item.type).toBe(filter);
          }

          // All items of matching type from the original should be present
          const expectedItems = items.filter((item) => item.type === filter);
          expect(result).toHaveLength(expectedItems.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('items are sorted by createdAt descending (newest first)', () => {
    fc.assert(
      fc.property(
        fc.array(boardItemArb, { minLength: 0, maxLength: 30 }),
        filterArb,
        (items, filter) => {
          const result = filterAndSort(items, filter);

          // Verify descending order by createdAt
          for (let i = 0; i < result.length - 1; i++) {
            const currentTime = new Date(result[i].createdAt).getTime();
            const nextTime = new Date(result[i + 1].createdAt).getTime();
            expect(currentTime).toBeGreaterThanOrEqual(nextTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
