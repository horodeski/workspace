import * as fc from 'fast-check';
import { computeResizeFromDelta } from '../hooks/useResizeInteraction';
import {
  MIN_CARD_WIDTH,
  MIN_CARD_HEIGHT,
  MAX_CARD_WIDTH,
  MAX_CARD_HEIGHT,
} from '../constants';

/**
 * Validates: Requirements 9.6
 *
 * Property 10: Aspect ratio preservation for image cards
 *
 * For any image-type PostItCard with original aspect ratio r = width / height,
 * a corner resize interaction (without Shift held) SHALL produce a new size where
 * |newWidth / newHeight - r| < epsilon (floating point tolerance).
 */
describe('Feature: freeform-inspiration-canvas, Property 10: Aspect ratio preservation for image cards', () => {
  const cornerHandles = ['ne', 'nw', 'se', 'sw'] as const;

  it('corner resize on image card preserves aspect ratio within epsilon', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: MIN_CARD_WIDTH, max: MAX_CARD_WIDTH }),
        fc.integer({ min: MIN_CARD_HEIGHT, max: MAX_CARD_HEIGHT }),
        fc.constantFrom(...cornerHandles),
        fc.integer({ min: -80, max: 80 }),
        fc.integer({ min: -80, max: 80 }),
        (width, height, handle, deltaX, deltaY) => {
          const originalAspectRatio = width / height;

          const startSize = { width, height };
          const startPosition = { x: 200, y: 200 };

          const result = computeResizeFromDelta(
            handle,
            deltaX,
            deltaY,
            startSize,
            startPosition,
            'image',
            false // shiftHeld = false → aspect ratio locked
          );

          const resultWidth = result.size.width;
          const resultHeight = result.size.height;

          // Skip cases where clamping distorts the ratio
          // Clamping occurs when the result hits min/max bounds
          const isClamped =
            resultWidth === MIN_CARD_WIDTH ||
            resultWidth === MAX_CARD_WIDTH ||
            resultHeight === MIN_CARD_HEIGHT ||
            resultHeight === MAX_CARD_HEIGHT;

          if (isClamped) {
            // When clamped, the aspect ratio may not be preserved exactly
            // but the size must still be within valid bounds
            return (
              resultWidth >= MIN_CARD_WIDTH &&
              resultWidth <= MAX_CARD_WIDTH &&
              resultHeight >= MIN_CARD_HEIGHT &&
              resultHeight <= MAX_CARD_HEIGHT
            );
          }

          // When not clamped, aspect ratio should be preserved within epsilon
          const newAspectRatio = resultWidth / resultHeight;
          const epsilon = 0.02;

          return Math.abs(newAspectRatio - originalAspectRatio) < epsilon;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Validates: Requirements 9.8, 9.9
 *
 * Property 11: Resize handle dimension control
 *
 * For any resize from a corner handle, both width and height SHALL change.
 * For a horizontal edge handle (top/bottom), only height changes and width remains constant.
 * For a vertical edge handle (left/right), only width changes and height remains constant.
 */
describe('Feature: freeform-inspiration-canvas, Property 11: Resize handle dimension control', () => {
  const startSize = { width: 300, height: 200 };
  const startPosition = { x: 200, y: 200 };

  it('corner handles change both width and height', () => {
    const cornerHandles = ['ne', 'nw', 'se', 'sw'] as const;

    fc.assert(
      fc.property(
        fc.constantFrom(...cornerHandles),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (handle, absDeltaX, absDeltaY) => {
          // Use non-zero deltas that expand the card (positive for se)
          // We use a non-image type to avoid aspect ratio lock
          const deltaX = handle === 'se' || handle === 'ne' ? absDeltaX : -absDeltaX;
          const deltaY = handle === 'se' || handle === 'sw' ? absDeltaY : -absDeltaY;

          const result = computeResizeFromDelta(
            handle,
            deltaX,
            deltaY,
            startSize,
            startPosition,
            'note', // non-image type to avoid aspect ratio lock
            false
          );

          // Both dimensions should change from original
          const widthChanged = result.size.width !== startSize.width;
          const heightChanged = result.size.height !== startSize.height;

          return widthChanged && heightChanged;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('horizontal edge handles (n/s) change only height, width remains constant', () => {
    const horizontalEdgeHandles = ['n', 's'] as const;

    fc.assert(
      fc.property(
        fc.constantFrom(...horizontalEdgeHandles),
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: -100, max: 100 }),
        (handle, deltaX, deltaY) => {
          // Filter out zero deltaY since that wouldn't change anything
          fc.pre(deltaY !== 0);

          // Ensure the delta won't cause clamping which might mask results
          const expectedHeight =
            handle === 's'
              ? startSize.height + deltaY
              : startSize.height - deltaY;
          fc.pre(
            expectedHeight >= MIN_CARD_HEIGHT &&
            expectedHeight <= MAX_CARD_HEIGHT
          );

          const result = computeResizeFromDelta(
            handle,
            deltaX,
            deltaY,
            startSize,
            startPosition,
            'note',
            false
          );

          // Width must remain constant
          const widthConstant = result.size.width === startSize.width;
          // Height must change
          const heightChanged = result.size.height !== startSize.height;

          return widthConstant && heightChanged;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('vertical edge handles (e/w) change only width, height remains constant', () => {
    const verticalEdgeHandles = ['e', 'w'] as const;

    fc.assert(
      fc.property(
        fc.constantFrom(...verticalEdgeHandles),
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: -100, max: 100 }),
        (handle, deltaX, deltaY) => {
          // Filter out zero deltaX since that wouldn't change anything
          fc.pre(deltaX !== 0);

          // Ensure the delta won't cause clamping which might mask results
          const expectedWidth =
            handle === 'e'
              ? startSize.width + deltaX
              : startSize.width - deltaX;
          fc.pre(
            expectedWidth >= MIN_CARD_WIDTH &&
            expectedWidth <= MAX_CARD_WIDTH
          );

          const result = computeResizeFromDelta(
            handle,
            deltaX,
            deltaY,
            startSize,
            startPosition,
            'note',
            false
          );

          // Height must remain constant
          const heightConstant = result.size.height === startSize.height;
          // Width must change
          const widthChanged = result.size.width !== startSize.width;

          return heightConstant && widthChanged;
        }
      ),
      { numRuns: 100 }
    );
  });
});
