import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDragInteractionOptions {
  itemId: string;
  initialPosition: { x: number; y: number };
  canvasSize: { width: number; height: number };
  cardSize: { width: number; height: number };
  onDragEnd: (id: string, position: { x: number; y: number }) => void;
  onBringToFront: (id: string) => void;
}

interface UseDragInteractionReturn {
  isDragging: boolean;
  currentPosition: { x: number; y: number };
  handlePointerDown: (e: React.PointerEvent) => void;
}

export function useDragInteraction(
  options: UseDragInteractionOptions
): UseDragInteractionReturn {
  const { itemId, initialPosition, canvasSize, cardSize, onDragEnd, onBringToFront } =
    options;

  const [isDragging, setIsDragging] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  // Use refs for all mutable state that event listeners need access to
  const startPointerRef = useRef({ x: 0, y: 0 });
  const startPositionRef = useRef(initialPosition);
  const elementRef = useRef<Element | null>(null);
  const isDraggingRef = useRef(false);

  // Keep latest callback refs to avoid stale closures in DOM event listeners
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  const canvasSizeRef = useRef(canvasSize);
  canvasSizeRef.current = canvasSize;

  const cardSizeRef = useRef(cardSize);
  cardSizeRef.current = cardSize;

  const itemIdRef = useRef(itemId);
  itemIdRef.current = itemId;

  // Keep currentPosition in sync when initialPosition changes externally
  const prevInitialPositionRef = useRef(initialPosition);
  useEffect(() => {
    if (
      prevInitialPositionRef.current.x !== initialPosition.x ||
      prevInitialPositionRef.current.y !== initialPosition.y
    ) {
      if (!isDraggingRef.current) {
        setCurrentPosition(initialPosition);
      }
      prevInitialPositionRef.current = initialPosition;
    }
  }, [initialPosition]);

  const clamp = useCallback(
    (pos: { x: number; y: number }) => ({
      x: Math.max(0, Math.min(pos.x, canvasSizeRef.current.width - cardSizeRef.current.width)),
      y: Math.max(0, Math.min(pos.y, canvasSizeRef.current.height - cardSizeRef.current.height)),
    }),
    []
  );

  // Stable event handlers that use refs — never recreated
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - startPointerRef.current.x;
      const deltaY = e.clientY - startPointerRef.current.y;

      const newPosition = {
        x: startPositionRef.current.x + deltaX,
        y: startPositionRef.current.y + deltaY,
      };

      const clamped = clamp(newPosition);
      setCurrentPosition(clamped);
    },
    [clamp]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      if (elementRef.current) {
        try {
          (elementRef.current as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          // Already released
        }
        elementRef.current.removeEventListener('pointermove', handlePointerMove);
        elementRef.current.removeEventListener('pointerup', handlePointerUp);
      }

      isDraggingRef.current = false;
      setIsDragging(false);

      // Compute final position
      const deltaX = e.clientX - startPointerRef.current.x;
      const deltaY = e.clientY - startPointerRef.current.y;
      const finalPosition = clamp({
        x: startPositionRef.current.x + deltaX,
        y: startPositionRef.current.y + deltaY,
      });

      setCurrentPosition(finalPosition);
      onDragEndRef.current(itemIdRef.current, finalPosition);
    },
    [clamp, handlePointerMove]
  );

  // Track current position in a ref so handlePointerDown always has the latest
  const currentPositionRef = useRef(initialPosition);
  useEffect(() => {
    currentPositionRef.current = currentPosition;
  });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only respond to primary button (left click / touch)
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      const element = e.currentTarget;
      elementRef.current = element;

      // Record start positions using the latest current position from ref
      startPointerRef.current = { x: e.clientX, y: e.clientY };
      startPositionRef.current = { ...currentPositionRef.current };

      // Capture pointer on the element for reliable tracking
      element.setPointerCapture(e.pointerId);

      // Set dragging state
      isDraggingRef.current = true;
      setIsDragging(true);

      // Bring card to front
      onBringToFront(itemId);

      // Attach listeners on the element (pointer capture routes events to it)
      element.addEventListener('pointermove', handlePointerMove);
      element.addEventListener('pointerup', handlePointerUp);
    },
    [itemId, onBringToFront, handlePointerMove, handlePointerUp]
  );

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      if (elementRef.current) {
        elementRef.current.removeEventListener('pointermove', handlePointerMove);
        elementRef.current.removeEventListener('pointerup', handlePointerUp);
      }
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    isDragging,
    currentPosition,
    handlePointerDown,
  };
}
