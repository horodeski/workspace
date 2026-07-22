import { renderHook, act } from '@testing-library/react';
import { useDragInteraction } from '../hooks/useDragInteraction';

// Polyfill PointerEvent for jsdom
class MockPointerEvent extends Event {
  clientX: number;
  clientY: number;
  pointerId: number;
  button: number;

  constructor(
    type: string,
    params: { clientX?: number; clientY?: number; pointerId?: number; button?: number } = {}
  ) {
    super(type, { bubbles: true });
    this.clientX = params.clientX ?? 0;
    this.clientY = params.clientY ?? 0;
    this.pointerId = params.pointerId ?? 1;
    this.button = params.button ?? 0;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).PointerEvent = MockPointerEvent;

describe('useDragInteraction', () => {
  const defaultOptions = {
    itemId: 'item-1',
    initialPosition: { x: 100, y: 200 },
    canvasSize: { width: 3000, height: 2000 },
    cardSize: { width: 240, height: 180 },
    onDragEnd: jest.fn(),
    onBringToFront: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns isDragging as false initially', () => {
      const { result } = renderHook(() => useDragInteraction(defaultOptions));
      expect(result.current.isDragging).toBe(false);
    });

    it('returns currentPosition matching initialPosition', () => {
      const { result } = renderHook(() => useDragInteraction(defaultOptions));
      expect(result.current.currentPosition).toEqual({ x: 100, y: 200 });
    });

    it('provides a handlePointerDown function', () => {
      const { result } = renderHook(() => useDragInteraction(defaultOptions));
      expect(typeof result.current.handlePointerDown).toBe('function');
    });
  });

  describe('pointer down behavior', () => {
    it('sets isDragging to true on pointer down', () => {
      const { result } = renderHook(() => useDragInteraction(defaultOptions));

      const element = document.createElement('div');
      element.setPointerCapture = jest.fn();
      element.releasePointerCapture = jest.fn();

      const event = createPointerEvent(element, 'pointerdown', 500, 400);

      act(() => {
        result.current.handlePointerDown(event);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('calls onBringToFront on pointer down', () => {
      const onBringToFront = jest.fn();
      const { result } = renderHook(() =>
        useDragInteraction({ ...defaultOptions, onBringToFront })
      );

      const element = document.createElement('div');
      element.setPointerCapture = jest.fn();
      element.releasePointerCapture = jest.fn();

      const event = createPointerEvent(element, 'pointerdown', 500, 400);

      act(() => {
        result.current.handlePointerDown(event);
      });

      expect(onBringToFront).toHaveBeenCalledWith('item-1');
    });

    it('calls setPointerCapture on the element', () => {
      const { result } = renderHook(() => useDragInteraction(defaultOptions));

      const element = document.createElement('div');
      element.setPointerCapture = jest.fn();
      element.releasePointerCapture = jest.fn();

      const event = createPointerEvent(element, 'pointerdown', 500, 400);

      act(() => {
        result.current.handlePointerDown(event);
      });

      expect(element.setPointerCapture).toHaveBeenCalledWith(1);
    });

    it('ignores non-primary button (right click)', () => {
      const { result } = renderHook(() => useDragInteraction(defaultOptions));

      const element = document.createElement('div');
      element.setPointerCapture = jest.fn();

      const event = createPointerEvent(element, 'pointerdown', 500, 400, {
        button: 2,
      });

      act(() => {
        result.current.handlePointerDown(event);
      });

      expect(result.current.isDragging).toBe(false);
      expect(element.setPointerCapture).not.toHaveBeenCalled();
    });
  });

  describe('pointer move behavior', () => {
    it('updates currentPosition based on pointer delta', () => {
      const { result } = renderHook(() => useDragInteraction(defaultOptions));

      const element = document.createElement('div');
      element.setPointerCapture = jest.fn();
      element.releasePointerCapture = jest.fn();

      // Start drag at clientX=500, clientY=400
      const downEvent = createPointerEvent(element, 'pointerdown', 500, 400);

      act(() => {
        result.current.handlePointerDown(downEvent);
      });

      // Move pointer by (+50, +30) → position should be (150, 230)
      const moveEvent = new MockPointerEvent('pointermove', {
        clientX: 550,
        clientY: 430,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      expect(result.current.currentPosition).toEqual({ x: 150, y: 230 });
    });

    it('clamps position to canvas bounds (min 0)', () => {
      const options = {
        ...defaultOptions,
        initialPosition: { x: 10, y: 20 },
      };
      const { result } = renderHook(() => useDragInteraction(options));

      const element = document.createElement('div');
      element.setPointerCapture = jest.fn();
      element.releasePointerCapture = jest.fn();

      const downEvent = createPointerEvent(element, 'pointerdown', 100, 100);

      act(() => {
        result.current.handlePointerDown(downEvent);
      });

      // Move pointer way left/up beyond canvas origin
      const moveEvent = new MockPointerEvent('pointermove', {
        clientX: -200,
        clientY: -200,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      expect(result.current.currentPosition.x).toBe(0);
      expect(result.current.currentPosition.y).toBe(0);
    });

    it('clamps position to canvas bounds (max canvasSize - cardSize)', () => {
      const options = {
        ...defaultOptions,
        initialPosition: { x: 2700, y: 1800 },
        canvasSize: { width: 3000, height: 2000 },
        cardSize: { width: 240, height: 180 },
      };
      const { result } = renderHook(() => useDragInteraction(options));

      const element = document.createElement('div');
      element.setPointerCapture = jest.fn();
      element.releasePointerCapture = jest.fn();

      const downEvent = createPointerEvent(element, 'pointerdown', 100, 100);

      act(() => {
        result.current.handlePointerDown(downEvent);
      });

      // Move pointer far right/down
      const moveEvent = new MockPointerEvent('pointermove', {
        clientX: 1000,
        clientY: 1000,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      // Max x = 3000 - 240 = 2760, max y = 2000 - 180 = 1820
      expect(result.current.currentPosition.x).toBe(2760);
      expect(result.current.currentPosition.y).toBe(1820);
    });
  });

  describe('pointer up behavior', () => {
    it('sets isDragging to false on pointer up', () => {
      const { result } = renderHook(() => useDragInteraction(defaultOptions));

      const element = document.createElement('div');
      element.setPointerCapture = jest.fn();
      element.releasePointerCapture = jest.fn();

      const downEvent = createPointerEvent(element, 'pointerdown', 500, 400);

      act(() => {
        result.current.handlePointerDown(downEvent);
      });

      expect(result.current.isDragging).toBe(true);

      const upEvent = new MockPointerEvent('pointerup', {
        clientX: 550,
        clientY: 430,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(upEvent);
      });

      expect(result.current.isDragging).toBe(false);
    });

    it('calls onDragEnd with final clamped position', () => {
      const onDragEnd = jest.fn();
      const { result } = renderHook(() =>
        useDragInteraction({ ...defaultOptions, onDragEnd })
      );

      const element = document.createElement('div');
      element.setPointerCapture = jest.fn();
      element.releasePointerCapture = jest.fn();

      const downEvent = createPointerEvent(element, 'pointerdown', 500, 400);

      act(() => {
        result.current.handlePointerDown(downEvent);
      });

      // Move then release at (+60, +40) → final position (160, 240)
      const upEvent = new MockPointerEvent('pointerup', {
        clientX: 560,
        clientY: 440,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(upEvent);
      });

      expect(onDragEnd).toHaveBeenCalledWith('item-1', { x: 160, y: 240 });
    });

    it('releases pointer capture on pointer up', () => {
      const { result } = renderHook(() => useDragInteraction(defaultOptions));

      const element = document.createElement('div');
      element.setPointerCapture = jest.fn();
      element.releasePointerCapture = jest.fn();

      const downEvent = createPointerEvent(element, 'pointerdown', 500, 400);

      act(() => {
        result.current.handlePointerDown(downEvent);
      });

      const upEvent = new MockPointerEvent('pointerup', {
        clientX: 500,
        clientY: 400,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(upEvent);
      });

      expect(element.releasePointerCapture).toHaveBeenCalledWith(1);
    });
  });

  describe('position sync with external changes', () => {
    it('updates currentPosition when initialPosition changes while not dragging', () => {
      const { result, rerender } = renderHook(
        (props) => useDragInteraction(props),
        { initialProps: defaultOptions }
      );

      expect(result.current.currentPosition).toEqual({ x: 100, y: 200 });

      rerender({
        ...defaultOptions,
        initialPosition: { x: 300, y: 400 },
      });

      expect(result.current.currentPosition).toEqual({ x: 300, y: 400 });
    });
  });
});

// Helper to create a synthetic React-compatible PointerEvent
function createPointerEvent(
  element: HTMLElement,
  type: string,
  clientX: number,
  clientY: number,
  overrides: Partial<{ button: number; pointerId: number }> = {}
): React.PointerEvent<HTMLElement> {
  return {
    type,
    button: overrides.button ?? 0,
    pointerId: overrides.pointerId ?? 1,
    clientX,
    clientY,
    currentTarget: element,
    target: element,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    nativeEvent: new MockPointerEvent(type, { clientX, clientY }),
  } as unknown as React.PointerEvent<HTMLElement>;
}
