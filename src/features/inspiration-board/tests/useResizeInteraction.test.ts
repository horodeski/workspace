import { renderHook, act } from '@testing-library/react';
import { useResizeInteraction } from '../hooks/useResizeInteraction';

// Polyfill PointerEvent for jsdom which doesn't support it natively
if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? 'mouse';
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).PointerEvent = PointerEventPolyfill;
}

describe('useResizeInteraction', () => {
  const defaultOptions = {
    itemId: 'item-1',
    itemType: 'note' as const,
    initialSize: { width: 240, height: 180 },
    initialPosition: { x: 100, y: 100 },
    canvasSize: { width: 3000, height: 2000 },
    onResizeEnd: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create a synthetic React-compatible PointerEvent
  function createPointerEvent(
    element: HTMLElement,
    clientX: number,
    clientY: number,
    overrides: Partial<{ pointerId: number; shiftKey: boolean }> = {}
  ): React.PointerEvent<HTMLElement> {
    return {
      type: 'pointerdown',
      button: 0,
      pointerId: overrides.pointerId ?? 1,
      clientX,
      clientY,
      shiftKey: overrides.shiftKey ?? false,
      currentTarget: element,
      target: element,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      nativeEvent: new PointerEvent('pointerdown', { clientX, clientY }),
    } as unknown as React.PointerEvent<HTMLElement>;
  }

  function createResizeElement() {
    const element = document.createElement('div');
    element.setPointerCapture = jest.fn();
    element.releasePointerCapture = jest.fn();
    return element;
  }

  describe('initial state', () => {
    it('returns isResizing as false initially', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );
      expect(result.current.isResizing).toBe(false);
    });

    it('returns currentSize matching initialSize', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );
      expect(result.current.currentSize).toEqual({ width: 240, height: 180 });
    });

    it('returns currentPosition matching initialPosition', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );
      expect(result.current.currentPosition).toEqual({ x: 100, y: 100 });
    });

    it('provides a handleResizeStart function', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );
      expect(typeof result.current.handleResizeStart).toBe('function');
    });
  });

  describe('resize start behavior', () => {
    it('sets isResizing to true on resize start', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('se', event);
      });

      expect(result.current.isResizing).toBe(true);
    });

    it('calls setPointerCapture on the element', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('se', event);
      });

      expect(element.setPointerCapture).toHaveBeenCalledWith(1);
    });

    it('calls preventDefault and stopPropagation', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('se', event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('corner handle resize (se)', () => {
    it('increases width and height on se drag right/down', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('se', event);
      });

      const moveEvent = new PointerEvent('pointermove', {
        clientX: 550,
        clientY: 430,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      expect(result.current.currentSize).toEqual({
        width: 290,
        height: 210,
      });
      // Position unchanged for se
      expect(result.current.currentPosition).toEqual({ x: 100, y: 100 });
    });
  });

  describe('corner handle resize (nw)', () => {
    it('adjusts size and position on nw drag', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('nw', event);
      });

      // Drag left/up by (-30, -20) → width increases by 30, height increases by 20
      const moveEvent = new PointerEvent('pointermove', {
        clientX: 470,
        clientY: 380,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      // nw: width -= deltaX(-30) = 240+30=270, height -= deltaY(-20) = 180+20=200
      // position.x += deltaX(-30) = 100-30=70, position.y += deltaY(-20) = 100-20=80
      expect(result.current.currentSize).toEqual({ width: 270, height: 200 });
      expect(result.current.currentPosition).toEqual({ x: 70, y: 80 });
    });
  });

  describe('corner handle resize (ne)', () => {
    it('adjusts width, height, and y position on ne drag', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('ne', event);
      });

      // Drag right/up by (40, -25)
      const moveEvent = new PointerEvent('pointermove', {
        clientX: 540,
        clientY: 375,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      // ne: width += deltaX(40) = 280, height -= deltaY(-25) = 205
      // position.y += deltaY(-25) = 75
      expect(result.current.currentSize).toEqual({ width: 280, height: 205 });
      expect(result.current.currentPosition).toEqual({ x: 100, y: 75 });
    });
  });

  describe('corner handle resize (sw)', () => {
    it('adjusts width, x position, and height on sw drag', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('sw', event);
      });

      // Drag left/down by (-20, 30)
      const moveEvent = new PointerEvent('pointermove', {
        clientX: 480,
        clientY: 430,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      // sw: width -= deltaX(-20) = 260, position.x += deltaX(-20) = 80, height += deltaY(30) = 210
      expect(result.current.currentSize).toEqual({ width: 260, height: 210 });
      expect(result.current.currentPosition).toEqual({ x: 80, y: 100 });
    });
  });

  describe('edge handle resize', () => {
    it('only adjusts width on east edge drag', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('e', event);
      });

      const moveEvent = new PointerEvent('pointermove', {
        clientX: 560,
        clientY: 450,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      // Only width changes; height and position remain the same
      expect(result.current.currentSize).toEqual({ width: 300, height: 180 });
      expect(result.current.currentPosition).toEqual({ x: 100, y: 100 });
    });

    it('only adjusts height on south edge drag', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('s', event);
      });

      const moveEvent = new PointerEvent('pointermove', {
        clientX: 560,
        clientY: 450,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      expect(result.current.currentSize).toEqual({ width: 240, height: 230 });
      expect(result.current.currentPosition).toEqual({ x: 100, y: 100 });
    });

    it('adjusts width and x position on west edge drag', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('w', event);
      });

      // Drag left by -40
      const moveEvent = new PointerEvent('pointermove', {
        clientX: 460,
        clientY: 400,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      // w: width -= deltaX(-40) = 280, position.x += deltaX(-40) = 60
      expect(result.current.currentSize).toEqual({ width: 280, height: 180 });
      expect(result.current.currentPosition).toEqual({ x: 60, y: 100 });
    });

    it('adjusts height and y position on north edge drag', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('n', event);
      });

      // Drag up by -30
      const moveEvent = new PointerEvent('pointermove', {
        clientX: 500,
        clientY: 370,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      // n: height -= deltaY(-30) = 210, position.y += deltaY(-30) = 70
      expect(result.current.currentSize).toEqual({ width: 240, height: 210 });
      expect(result.current.currentPosition).toEqual({ x: 100, y: 70 });
    });
  });

  describe('size clamping', () => {
    it('clamps width to minimum 120', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('e', event);
      });

      // Drag left by -200 → width would be 240-200=40 → clamp to 120
      const moveEvent = new PointerEvent('pointermove', {
        clientX: 300,
        clientY: 400,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      expect(result.current.currentSize.width).toBe(120);
    });

    it('clamps height to minimum 80', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('s', event);
      });

      // Drag up by -200 → height would be 180-200=-20 → clamp to 80
      const moveEvent = new PointerEvent('pointermove', {
        clientX: 500,
        clientY: 200,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      expect(result.current.currentSize.height).toBe(80);
    });

    it('clamps width to maximum 800', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('e', event);
      });

      // Drag right by +700 → width would be 240+700=940 → clamp to 800
      const moveEvent = new PointerEvent('pointermove', {
        clientX: 1200,
        clientY: 400,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      expect(result.current.currentSize.width).toBe(800);
    });

    it('clamps height to maximum 600', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('s', event);
      });

      // Drag down by +500 → height would be 180+500=680 → clamp to 600
      const moveEvent = new PointerEvent('pointermove', {
        clientX: 500,
        clientY: 900,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      expect(result.current.currentSize.height).toBe(600);
    });
  });

  describe('position clamping', () => {
    it('clamps position x to minimum 0 on west resize', () => {
      const options = {
        ...defaultOptions,
        initialPosition: { x: 20, y: 100 },
      };
      const { result } = renderHook(() => useResizeInteraction(options));

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('w', event);
      });

      // Drag left by -50 → position.x would be 20 + (-50) = -30 → clamp to 0
      const moveEvent = new PointerEvent('pointermove', {
        clientX: 450,
        clientY: 400,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      expect(result.current.currentPosition.x).toBe(0);
    });

    it('clamps position y to minimum 0 on north resize', () => {
      const options = {
        ...defaultOptions,
        initialPosition: { x: 100, y: 10 },
      };
      const { result } = renderHook(() => useResizeInteraction(options));

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('n', event);
      });

      // Drag up by -30 → position.y would be 10 + (-30) = -20 → clamp to 0
      const moveEvent = new PointerEvent('pointermove', {
        clientX: 500,
        clientY: 370,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      expect(result.current.currentPosition.y).toBe(0);
    });
  });

  describe('image aspect ratio preservation', () => {
    const imageOptions = {
      ...defaultOptions,
      itemType: 'image' as const,
      initialSize: { width: 300, height: 200 }, // aspect ratio 1.5
    };

    it('maintains aspect ratio on corner resize for image cards', () => {
      const { result } = renderHook(() => useResizeInteraction(imageOptions));

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('se', event);
      });

      // Drag right by 60 (width change dominates)
      const moveEvent = new PointerEvent('pointermove', {
        clientX: 560,
        clientY: 410,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      // Width changed by 60 (=60), height changed by 10 (=10)
      // Width dominates: newWidth = 360, newHeight = 360 / 1.5 = 240
      expect(result.current.currentSize.width).toBe(360);
      expect(result.current.currentSize.height).toBe(240);
    });

    it('allows free resize on image cards with Shift held', () => {
      const { result } = renderHook(() => useResizeInteraction(imageOptions));

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('se', event);
      });

      // Drag with Shift held
      const moveEvent = new PointerEvent('pointermove', {
        clientX: 560,
        clientY: 410,
        shiftKey: true,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      // Without aspect ratio lock: width = 360, height = 210
      expect(result.current.currentSize).toEqual({ width: 360, height: 210 });
    });

    it('does not apply aspect ratio lock on edge handles for image cards', () => {
      const { result } = renderHook(() => useResizeInteraction(imageOptions));

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('e', event);
      });

      const moveEvent = new PointerEvent('pointermove', {
        clientX: 560,
        clientY: 400,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(moveEvent);
      });

      // Edge handle only changes width, no aspect ratio lock
      expect(result.current.currentSize).toEqual({ width: 360, height: 200 });
    });
  });

  describe('pointer up behavior', () => {
    it('sets isResizing to false on pointer up', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('se', event);
      });

      expect(result.current.isResizing).toBe(true);

      const upEvent = new PointerEvent('pointerup', {
        clientX: 550,
        clientY: 430,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(upEvent);
      });

      expect(result.current.isResizing).toBe(false);
    });

    it('calls onResizeEnd with final size and position', () => {
      const onResizeEnd = jest.fn();
      const { result } = renderHook(() =>
        useResizeInteraction({ ...defaultOptions, onResizeEnd })
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('se', event);
      });

      const upEvent = new PointerEvent('pointerup', {
        clientX: 550,
        clientY: 430,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(upEvent);
      });

      expect(onResizeEnd).toHaveBeenCalledWith(
        'item-1',
        { width: 290, height: 210 },
        { x: 100, y: 100 }
      );
    });

    it('releases pointer capture on pointer up', () => {
      const { result } = renderHook(() =>
        useResizeInteraction(defaultOptions)
      );

      const element = createResizeElement();
      const event = createPointerEvent(element, 500, 400);

      act(() => {
        result.current.handleResizeStart('se', event);
      });

      const upEvent = new PointerEvent('pointerup', {
        clientX: 550,
        clientY: 430,
        pointerId: 1,
      });

      act(() => {
        element.dispatchEvent(upEvent);
      });

      expect(element.releasePointerCapture).toHaveBeenCalledWith(1);
    });
  });

  describe('position sync with external changes', () => {
    it('updates currentSize when initialSize changes while not resizing', () => {
      const { result, rerender } = renderHook(
        (props) => useResizeInteraction(props),
        { initialProps: defaultOptions }
      );

      expect(result.current.currentSize).toEqual({ width: 240, height: 180 });

      rerender({
        ...defaultOptions,
        initialSize: { width: 300, height: 250 },
      });

      expect(result.current.currentSize).toEqual({ width: 300, height: 250 });
    });

    it('updates currentPosition when initialPosition changes while not resizing', () => {
      const { result, rerender } = renderHook(
        (props) => useResizeInteraction(props),
        { initialProps: defaultOptions }
      );

      expect(result.current.currentPosition).toEqual({ x: 100, y: 100 });

      rerender({
        ...defaultOptions,
        initialPosition: { x: 200, y: 300 },
      });

      expect(result.current.currentPosition).toEqual({ x: 200, y: 300 });
    });
  });
});
