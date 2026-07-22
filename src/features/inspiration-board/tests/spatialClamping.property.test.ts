import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardReposition } from '../hooks/useKeyboardReposition';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  KEYBOARD_MOVE_STEP,
  MIN_CARD_WIDTH,
  MAX_CARD_WIDTH,
  MIN_CARD_HEIGHT,
  MAX_CARD_HEIGHT,
} from '../constants';

// --- Pure clamping functions matching the implementation logic ---

function clampPosition(
  x: number,
  y: number,
  canvasW: number,
  canvasH: number,
  cardW: number,
  cardH: number
) {
  return {
    x: Math.max(0, Math.min(x, canvasW - cardW)),
    y: Math.max(0, Math.min(y, canvasH - cardH)),
  };
}

function clampSize(width: number, height: number) {
  return {
    width: Math.max(MIN_CARD_WIDTH, Math.min(width, MAX_CARD_WIDTH)),
    height: Math.max(MIN_CARD_HEIGHT, Math.min(height, MAX_CARD_HEIGHT)),
  };
}

// --- Arbitraries ---

/** Generates arbitrary positions including negative, very large, and normal */
const arbitraryPosition = fc.record({
  x: fc.double({ min: -5000, max: 10000, noNaN: true, noDefaultInfinity: true }),
  y: fc.double({ min: -5000, max: 10000, noNaN: true, noDefaultInfinity: true }),
});

/** Generates arbitrary card sizes within valid range */
const validCardSize = fc.record({
  width: fc.integer({ min: MIN_CARD_WIDTH, max: MAX_CARD_WIDTH }),
  height: fc.integer({ min: MIN_CARD_HEIGHT, max: MAX_CARD_HEIGHT }),
});

/** Generates arbitrary size deltas (for resize operations) */
const arbitrarySize = fc.record({
  width: fc.double({ min: -2000, max: 2000, noNaN: true, noDefaultInfinity: true }),
  height: fc.double({ min: -2000, max: 2000, noNaN: true, noDefaultInfinity: true }),
});

/** Generates valid positions within canvas bounds for keyboard testing */
const validPosition = fc.record({
  x: fc.integer({ min: 0, max: CANVAS_WIDTH - MIN_CARD_WIDTH }),
  y: fc.integer({ min: 0, max: CANVAS_HEIGHT - MIN_CARD_HEIGHT }),
});

/** Arrow key direction arbitrary */
const arrowKeyArb = fc.constantFrom('ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown');

// --- Helper ---

function createKeyEvent(
  key: string,
  modifiers: { shiftKey?: boolean; ctrlKey?: boolean } = {}
): React.KeyboardEvent {
  return {
    key,
    shiftKey: modifiers.shiftKey ?? false,
    ctrlKey: modifiers.ctrlKey ?? false,
    preventDefault: jest.fn(),
  } as unknown as React.KeyboardEvent;
}

/**
 * Property 2: Position clamping invariant
 *
 * For any position update (via drag, keyboard move, or migration), the resulting
 * position SHALL satisfy: 0 <= x <= canvasWidth - cardWidth AND
 * 0 <= y <= canvasHeight - cardHeight. This holds regardless of whether
 * the input position is within bounds, negative, or exceeds canvas dimensions.
 *
 * **Validates: Requirements 1.8, 3.2, 7.2**
 */
describe('Feature: freeform-inspiration-canvas, Property 2: Position clamping invariant', () => {
  it('clamped position always satisfies 0 <= x <= canvasWidth - cardWidth AND 0 <= y <= canvasHeight - cardHeight', () => {
    fc.assert(
      fc.property(arbitraryPosition, validCardSize, (pos, cardSize) => {
        const clamped = clampPosition(
          pos.x,
          pos.y,
          CANVAS_WIDTH,
          CANVAS_HEIGHT,
          cardSize.width,
          cardSize.height
        );

        // x invariant
        expect(clamped.x).toBeGreaterThanOrEqual(0);
        expect(clamped.x).toBeLessThanOrEqual(CANVAS_WIDTH - cardSize.width);

        // y invariant
        expect(clamped.y).toBeGreaterThanOrEqual(0);
        expect(clamped.y).toBeLessThanOrEqual(CANVAS_HEIGHT - cardSize.height);
      }),
      { numRuns: 100 }
    );
  });

  it('clamping is idempotent: clamping an already-clamped position returns the same result', () => {
    fc.assert(
      fc.property(arbitraryPosition, validCardSize, (pos, cardSize) => {
        const clamped = clampPosition(
          pos.x,
          pos.y,
          CANVAS_WIDTH,
          CANVAS_HEIGHT,
          cardSize.width,
          cardSize.height
        );

        const doubleClamped = clampPosition(
          clamped.x,
          clamped.y,
          CANVAS_WIDTH,
          CANVAS_HEIGHT,
          cardSize.width,
          cardSize.height
        );

        expect(doubleClamped).toEqual(clamped);
      }),
      { numRuns: 100 }
    );
  });

  it('keyboard move (Shift+Arrow) always produces positions within canvas bounds', () => {
    fc.assert(
      fc.property(validPosition, validCardSize, arrowKeyArb, (pos, size, key) => {
        const onPositionChange = jest.fn();
        const onSizeChange = jest.fn();

        const { result } = renderHook(() =>
          useKeyboardReposition({
            itemId: 'test-id',
            position: pos,
            size,
            canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
            onPositionChange,
            onSizeChange,
          })
        );

        act(() => {
          result.current.handleKeyDown(createKeyEvent(key, { shiftKey: true }));
        });

        expect(onPositionChange).toHaveBeenCalledTimes(1);
        const newPos = onPositionChange.mock.calls[0][1];

        // Position clamping invariant
        expect(newPos.x).toBeGreaterThanOrEqual(0);
        expect(newPos.x).toBeLessThanOrEqual(CANVAS_WIDTH - size.width);
        expect(newPos.y).toBeGreaterThanOrEqual(0);
        expect(newPos.y).toBeLessThanOrEqual(CANVAS_HEIGHT - size.height);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 9: Size clamping invariant
 *
 * For any resize operation (pointer-based or keyboard), the resulting size
 * SHALL satisfy: 120 <= width <= 800 AND 80 <= height <= 600.
 * This holds regardless of the resize delta magnitude or direction.
 *
 * **Validates: Requirements 9.4, 9.5**
 */
describe('Feature: freeform-inspiration-canvas, Property 9: Size clamping invariant', () => {
  it('clamped size always satisfies MIN_CARD_WIDTH <= width <= MAX_CARD_WIDTH AND MIN_CARD_HEIGHT <= height <= MAX_CARD_HEIGHT', () => {
    fc.assert(
      fc.property(arbitrarySize, (rawSize) => {
        const clamped = clampSize(rawSize.width, rawSize.height);

        // Width invariant
        expect(clamped.width).toBeGreaterThanOrEqual(MIN_CARD_WIDTH);
        expect(clamped.width).toBeLessThanOrEqual(MAX_CARD_WIDTH);

        // Height invariant
        expect(clamped.height).toBeGreaterThanOrEqual(MIN_CARD_HEIGHT);
        expect(clamped.height).toBeLessThanOrEqual(MAX_CARD_HEIGHT);
      }),
      { numRuns: 100 }
    );
  });

  it('clamping is idempotent: clamping an already-clamped size returns the same result', () => {
    fc.assert(
      fc.property(arbitrarySize, (rawSize) => {
        const clamped = clampSize(rawSize.width, rawSize.height);
        const doubleClamped = clampSize(clamped.width, clamped.height);

        expect(doubleClamped).toEqual(clamped);
      }),
      { numRuns: 100 }
    );
  });

  it('keyboard resize (Ctrl+Arrow) always produces sizes within bounds', () => {
    fc.assert(
      fc.property(validPosition, validCardSize, arrowKeyArb, (pos, size, key) => {
        const onPositionChange = jest.fn();
        const onSizeChange = jest.fn();

        const { result } = renderHook(() =>
          useKeyboardReposition({
            itemId: 'test-id',
            position: pos,
            size,
            canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
            onPositionChange,
            onSizeChange,
          })
        );

        act(() => {
          result.current.handleKeyDown(createKeyEvent(key, { ctrlKey: true }));
        });

        expect(onSizeChange).toHaveBeenCalledTimes(1);
        const newSize = onSizeChange.mock.calls[0][1];

        // Size clamping invariant
        expect(newSize.width).toBeGreaterThanOrEqual(MIN_CARD_WIDTH);
        expect(newSize.width).toBeLessThanOrEqual(MAX_CARD_WIDTH);
        expect(newSize.height).toBeGreaterThanOrEqual(MIN_CARD_HEIGHT);
        expect(newSize.height).toBeLessThanOrEqual(MAX_CARD_HEIGHT);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 12: Keyboard spatial operations step size
 *
 * For any focused PostItCard at position (x, y) with size (w, h):
 * pressing Shift+Arrow SHALL move by exactly 20px (clamped).
 * Pressing Ctrl+Arrow SHALL resize by exactly 20px (clamped).
 * The step size is always KEYBOARD_MOVE_STEP (20px).
 *
 * **Validates: Requirements 7.1, 9.12**
 */
describe('Feature: freeform-inspiration-canvas, Property 12: Keyboard spatial operations step size', () => {
  it('Shift+Arrow moves position by exactly KEYBOARD_MOVE_STEP or clamps to boundary', () => {
    fc.assert(
      fc.property(validPosition, validCardSize, arrowKeyArb, (pos, size, key) => {
        const onPositionChange = jest.fn();
        const onSizeChange = jest.fn();

        const { result } = renderHook(() =>
          useKeyboardReposition({
            itemId: 'test-id',
            position: pos,
            size,
            canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
            onPositionChange,
            onSizeChange,
          })
        );

        act(() => {
          result.current.handleKeyDown(createKeyEvent(key, { shiftKey: true }));
        });

        expect(onPositionChange).toHaveBeenCalledTimes(1);
        const newPos = onPositionChange.mock.calls[0][1];

        const maxX = CANVAS_WIDTH - size.width;
        const maxY = CANVAS_HEIGHT - size.height;

        // Compute expected unclamped position
        let expectedX = pos.x;
        let expectedY = pos.y;

        switch (key) {
          case 'ArrowLeft':
            expectedX = pos.x - KEYBOARD_MOVE_STEP;
            break;
          case 'ArrowRight':
            expectedX = pos.x + KEYBOARD_MOVE_STEP;
            break;
          case 'ArrowUp':
            expectedY = pos.y - KEYBOARD_MOVE_STEP;
            break;
          case 'ArrowDown':
            expectedY = pos.y + KEYBOARD_MOVE_STEP;
            break;
        }

        // Apply clamping
        expectedX = Math.max(0, Math.min(expectedX, maxX));
        expectedY = Math.max(0, Math.min(expectedY, maxY));

        expect(newPos.x).toBe(expectedX);
        expect(newPos.y).toBe(expectedY);
      }),
      { numRuns: 100 }
    );
  });

  it('Ctrl+Arrow resizes by exactly KEYBOARD_MOVE_STEP or clamps to size bounds', () => {
    fc.assert(
      fc.property(validPosition, validCardSize, arrowKeyArb, (pos, size, key) => {
        const onPositionChange = jest.fn();
        const onSizeChange = jest.fn();

        const { result } = renderHook(() =>
          useKeyboardReposition({
            itemId: 'test-id',
            position: pos,
            size,
            canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
            onPositionChange,
            onSizeChange,
          })
        );

        act(() => {
          result.current.handleKeyDown(createKeyEvent(key, { ctrlKey: true }));
        });

        expect(onSizeChange).toHaveBeenCalledTimes(1);
        const newSize = onSizeChange.mock.calls[0][1];

        // Compute expected unclamped size
        let expectedWidth = size.width;
        let expectedHeight = size.height;

        switch (key) {
          case 'ArrowRight':
            expectedWidth = size.width + KEYBOARD_MOVE_STEP;
            break;
          case 'ArrowLeft':
            expectedWidth = size.width - KEYBOARD_MOVE_STEP;
            break;
          case 'ArrowDown':
            expectedHeight = size.height + KEYBOARD_MOVE_STEP;
            break;
          case 'ArrowUp':
            expectedHeight = size.height - KEYBOARD_MOVE_STEP;
            break;
        }

        // Apply clamping
        expectedWidth = Math.max(MIN_CARD_WIDTH, Math.min(expectedWidth, MAX_CARD_WIDTH));
        expectedHeight = Math.max(MIN_CARD_HEIGHT, Math.min(expectedHeight, MAX_CARD_HEIGHT));

        expect(newSize.width).toBe(expectedWidth);
        expect(newSize.height).toBe(expectedHeight);
      }),
      { numRuns: 100 }
    );
  });

  it('step size is always exactly KEYBOARD_MOVE_STEP (20px) when not clamped', () => {
    // Generate positions/sizes that are safely within bounds (won't trigger clamping)
    const safePosition = fc.record({
      x: fc.integer({ min: KEYBOARD_MOVE_STEP, max: CANVAS_WIDTH - MAX_CARD_WIDTH - KEYBOARD_MOVE_STEP }),
      y: fc.integer({ min: KEYBOARD_MOVE_STEP, max: CANVAS_HEIGHT - MAX_CARD_HEIGHT - KEYBOARD_MOVE_STEP }),
    });
    const safeSize = fc.record({
      width: fc.integer({ min: MIN_CARD_WIDTH + KEYBOARD_MOVE_STEP, max: MAX_CARD_WIDTH - KEYBOARD_MOVE_STEP }),
      height: fc.integer({ min: MIN_CARD_HEIGHT + KEYBOARD_MOVE_STEP, max: MAX_CARD_HEIGHT - KEYBOARD_MOVE_STEP }),
    });

    fc.assert(
      fc.property(safePosition, safeSize, arrowKeyArb, (pos, size, key) => {
        const onPositionChange = jest.fn();
        const onSizeChange = jest.fn();

        const { result } = renderHook(() =>
          useKeyboardReposition({
            itemId: 'test-id',
            position: pos,
            size,
            canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
            onPositionChange,
            onSizeChange,
          })
        );

        // Test Shift+Arrow (move)
        act(() => {
          result.current.handleKeyDown(createKeyEvent(key, { shiftKey: true }));
        });

        const newPos = onPositionChange.mock.calls[0][1];

        // Exactly one axis changes by exactly KEYBOARD_MOVE_STEP
        switch (key) {
          case 'ArrowLeft':
            expect(newPos.x).toBe(pos.x - KEYBOARD_MOVE_STEP);
            expect(newPos.y).toBe(pos.y);
            break;
          case 'ArrowRight':
            expect(newPos.x).toBe(pos.x + KEYBOARD_MOVE_STEP);
            expect(newPos.y).toBe(pos.y);
            break;
          case 'ArrowUp':
            expect(newPos.x).toBe(pos.x);
            expect(newPos.y).toBe(pos.y - KEYBOARD_MOVE_STEP);
            break;
          case 'ArrowDown':
            expect(newPos.x).toBe(pos.x);
            expect(newPos.y).toBe(pos.y + KEYBOARD_MOVE_STEP);
            break;
        }
      }),
      { numRuns: 100 }
    );
  });
});
