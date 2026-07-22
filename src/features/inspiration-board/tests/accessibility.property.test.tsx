import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { PostItCard } from '../components/PostItCard';
import type { BoardItem, BoardItemType } from '../types/board.types';

/**
 * Feature: freeform-inspiration-canvas, Property 14: Accessibility attributes format
 *
 * Validates: Requirements 7.4, 8.9
 *
 * For any BoardItem rendered as a PostItCard, the component SHALL have an aria-label
 * containing the item type followed by the first 50 characters of content.
 * For image-type items, the <img> element SHALL have an alt attribute of "Image card {id}".
 * These attributes SHALL be present regardless of content length or type.
 */

const boardItemTypes: BoardItemType[] = ['quote', 'image', 'link', 'note'];

const boardItemTypeArb = fc.constantFrom(...boardItemTypes);

const boardItemArb: fc.Arbitrary<BoardItem> = fc.record({
  id: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
  type: boardItemTypeArb,
  createdAt: fc.integer({ min: 946684800000, max: 1893456000000 }).map((ts) => new Date(ts).toISOString()),
  updatedAt: fc.integer({ min: 946684800000, max: 1893456000000 }).map((ts) => new Date(ts).toISOString()),
  position: fc.record({
    x: fc.integer({ min: 0, max: 2760 }),
    y: fc.integer({ min: 0, max: 1820 }),
  }),
  size: fc.record({
    width: fc.integer({ min: 120, max: 800 }),
    height: fc.integer({ min: 80, max: 600 }),
  }),
});

const imageItemArb: fc.Arbitrary<BoardItem> = fc.record({
  id: fc.uuid(),
  content: fc.webUrl().map((url) => url),
  type: fc.constant('image' as BoardItemType),
  createdAt: fc.integer({ min: 946684800000, max: 1893456000000 }).map((ts) => new Date(ts).toISOString()),
  updatedAt: fc.integer({ min: 946684800000, max: 1893456000000 }).map((ts) => new Date(ts).toISOString()),
  position: fc.record({
    x: fc.integer({ min: 0, max: 2760 }),
    y: fc.integer({ min: 0, max: 1820 }),
  }),
  size: fc.record({
    width: fc.integer({ min: 120, max: 800 }),
    height: fc.integer({ min: 80, max: 600 }),
  }),
});

describe('Feature: freeform-inspiration-canvas, Property 14: Accessibility attributes format', () => {
  const noop = jest.fn();

  it('aria-label contains type + first 50 chars of content for any BoardItem', () => {
    fc.assert(
      fc.property(boardItemArb, (item) => {
        const { unmount } = render(
          <PostItCard
            item={item}
            zIndex={1}
            onEdit={noop}
            onDelete={noop}
            onBringToFront={noop}
            onUpdatePosition={noop}
            onUpdateSize={noop}
          />
        );

        const card = screen.getByRole('application');
        const expectedLabel = `${item.type} ${item.content.slice(0, 50)}`;
        expect(card.getAttribute('aria-label')).toBe(expectedLabel);

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('image-type items have img alt="Image card {id}"', () => {
    fc.assert(
      fc.property(imageItemArb, (item) => {
        const { unmount } = render(
          <PostItCard
            item={item}
            zIndex={1}
            onEdit={noop}
            onDelete={noop}
            onBringToFront={noop}
            onUpdatePosition={noop}
            onUpdateSize={noop}
          />
        );

        const img = screen.getByRole('img');
        expect(img.getAttribute('alt')).toBe(`Image card ${item.id}`);

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
