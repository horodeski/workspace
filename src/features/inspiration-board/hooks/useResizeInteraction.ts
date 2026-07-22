import { useState, useCallback, useRef, useEffect } from 'react';
import { HandlePosition } from '../components/ResizeHandles';
import { BoardItemType } from '../types/board.types';
import {
  MIN_CARD_WIDTH,
  MIN_CARD_HEIGHT,
  MAX_CARD_WIDTH,
  MAX_CARD_HEIGHT,
} from '../constants';

interface UseResizeInteractionOptions {
  itemId: string;
  itemType: BoardItemType;
  initialSize: { width: number; height: number };
  initialPosition: { x: number; y: number };
  canvasSize: { width: number; height: number };
  onResizeEnd: (
    id: string,
    size: { width: number; height: number },
    position: { x: number; y: number }
  ) => void;
}

interface UseResizeInteractionReturn {
  isResizing: boolean;
  currentSize: { width: number; height: number };
  currentPosition: { x: number; y: number };
  handleResizeStart: (handle: HandlePosition, e: React.PointerEvent) => void;
}

function isCornerHandle(handle: HandlePosition): boolean {
  return (
    handle === 'ne' || handle === 'nw' || handle === 'se' || handle === 'sw'
  );
}

function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

interface ResizeResult {
  size: { width: number; height: number };
  position: { x: number; y: number };
}

export function computeResizeFromDelta(
  handle: HandlePosition,
  deltaX: number,
  deltaY: number,
  startSize: { width: number; height: number },
  startPosition: { x: number; y: number },
  itemType: BoardItemType,
  shiftHeld: boolean
): ResizeResult {
  let newWidth = startSize.width;
  let newHeight = startSize.height;
  let newX = startPosition.x;
  let newY = startPosition.y;

  // Apply delta based on handle direction
  switch (handle) {
    case 'se':
      newWidth = startSize.width + deltaX;
      newHeight = startSize.height + deltaY;
      break;
    case 'sw':
      newWidth = startSize.width - deltaX;
      newX = startPosition.x + deltaX;
      newHeight = startSize.height + deltaY;
      break;
    case 'ne':
      newWidth = startSize.width + deltaX;
      newHeight = startSize.height - deltaY;
      newY = startPosition.y + deltaY;
      break;
    case 'nw':
      newWidth = startSize.width - deltaX;
      newHeight = startSize.height - deltaY;
      newX = startPosition.x + deltaX;
      newY = startPosition.y + deltaY;
      break;
    case 'e':
      newWidth = startSize.width + deltaX;
      break;
    case 'w':
      newWidth = startSize.width - deltaX;
      newX = startPosition.x + deltaX;
      break;
    case 's':
      newHeight = startSize.height + deltaY;
      break;
    case 'n':
      newHeight = startSize.height - deltaY;
      newY = startPosition.y + deltaY;
      break;
  }

  // Aspect ratio lock for image-type cards on corner resize (without Shift)
  if (itemType === 'image' && isCornerHandle(handle) && !shiftHeld) {
    const aspectRatio = startSize.width / startSize.height;
    const widthDelta = Math.abs(newWidth - startSize.width);
    const heightDelta = Math.abs(newHeight - startSize.height);

    if (widthDelta >= heightDelta) {
      newHeight = newWidth / aspectRatio;
    } else {
      newWidth = newHeight * aspectRatio;
    }

    // Recalculate position for handles that adjust position
    if (handle === 'nw') {
      newX = startPosition.x + (startSize.width - newWidth);
      newY = startPosition.y + (startSize.height - newHeight);
    } else if (handle === 'ne') {
      newY = startPosition.y + (startSize.height - newHeight);
    } else if (handle === 'sw') {
      newX = startPosition.x + (startSize.width - newWidth);
    }
  }

  // Clamp size
  const clampedWidth = clampValue(newWidth, MIN_CARD_WIDTH, MAX_CARD_WIDTH);
  const clampedHeight = clampValue(newHeight, MIN_CARD_HEIGHT, MAX_CARD_HEIGHT);

  // Adjust position when clamping changed size for top/left handles
  if (
    (handle === 'w' || handle === 'nw' || handle === 'sw') &&
    clampedWidth !== newWidth
  ) {
    newX = startPosition.x + (startSize.width - clampedWidth);
  }
  if (
    (handle === 'n' || handle === 'nw' || handle === 'ne') &&
    clampedHeight !== newHeight
  ) {
    newY = startPosition.y + (startSize.height - clampedHeight);
  }

  // Clamp position (must be >= 0)
  const finalX = Math.max(0, newX);
  const finalY = Math.max(0, newY);

  return {
    size: { width: clampedWidth, height: clampedHeight },
    position: { x: finalX, y: finalY },
  };
}

export function useResizeInteraction(
  options: UseResizeInteractionOptions
): UseResizeInteractionReturn {
  const { itemId, itemType, initialSize, initialPosition, onResizeEnd } =
    options;

  const [isResizing, setIsResizing] = useState(false);
  const [currentSize, setCurrentSize] = useState(initialSize);
  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  // Keep state in sync with prop changes when not resizing
  const isResizingRef = useRef(false);

  useEffect(() => {
    if (!isResizingRef.current) {
      setCurrentSize(initialSize);
    }
  }, [initialSize.width, initialSize.height]);

  useEffect(() => {
    if (!isResizingRef.current) {
      setCurrentPosition(initialPosition);
    }
  }, [initialPosition.x, initialPosition.y]);

  // Keep latest callback/value refs to avoid stale closures
  const onResizeEndRef = useRef(onResizeEnd);
  onResizeEndRef.current = onResizeEnd;

  const itemIdRef = useRef(itemId);
  itemIdRef.current = itemId;

  const itemTypeRef = useRef(itemType);
  itemTypeRef.current = itemType;

  // Refs to track resize state across pointer events
  const startPointerRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });
  const startPositionRef = useRef({ x: 0, y: 0 });
  const activeHandleRef = useRef<HandlePosition | null>(null);
  const targetElementRef = useRef<Element | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  // Stable event handlers using refs — never recreated
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isResizingRef.current || !activeHandleRef.current) return;

      const deltaX = e.clientX - startPointerRef.current.x;
      const deltaY = e.clientY - startPointerRef.current.y;

      const result = computeResizeFromDelta(
        activeHandleRef.current,
        deltaX,
        deltaY,
        startSizeRef.current,
        startPositionRef.current,
        itemTypeRef.current,
        e.shiftKey
      );

      setCurrentSize(result.size);
      setCurrentPosition(result.position);
    },
    []
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (!isResizingRef.current || !activeHandleRef.current) return;

      // Release pointer capture
      if (targetElementRef.current && pointerIdRef.current !== null) {
        try {
          targetElementRef.current.releasePointerCapture(
            pointerIdRef.current
          );
        } catch {
          // Pointer capture may already be released
        }
      }

      // Clean up listeners
      const element = targetElementRef.current;
      if (element) {
        element.removeEventListener('pointermove', handlePointerMove);
        element.removeEventListener('pointerup', handlePointerUp);
      }

      // Compute final result
      const deltaX = e.clientX - startPointerRef.current.x;
      const deltaY = e.clientY - startPointerRef.current.y;

      const result = computeResizeFromDelta(
        activeHandleRef.current,
        deltaX,
        deltaY,
        startSizeRef.current,
        startPositionRef.current,
        itemTypeRef.current,
        e.shiftKey
      );

      setCurrentSize(result.size);
      setCurrentPosition(result.position);
      isResizingRef.current = false;
      setIsResizing(false);

      onResizeEndRef.current(itemIdRef.current, result.size, result.position);

      // Reset refs
      activeHandleRef.current = null;
      targetElementRef.current = null;
      pointerIdRef.current = null;
    },
    [handlePointerMove]
  );

  const handleResizeStart = useCallback(
    (handle: HandlePosition, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Set pointer capture on the target element
      const target = e.currentTarget as Element;
      target.setPointerCapture(e.pointerId);

      // Store initial state from the current DOM element's parent card
      startPointerRef.current = { x: e.clientX, y: e.clientY };
      startSizeRef.current = { ...currentSize };
      startPositionRef.current = { ...currentPosition };
      activeHandleRef.current = handle;
      targetElementRef.current = target;
      pointerIdRef.current = e.pointerId;

      isResizingRef.current = true;
      setIsResizing(true);

      // Attach move/up listeners to the element with pointer capture
      target.addEventListener('pointermove', handlePointerMove);
      target.addEventListener('pointerup', handlePointerUp);
    },
    [currentSize, currentPosition, handlePointerMove, handlePointerUp]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (targetElementRef.current && pointerIdRef.current !== null) {
        try {
          targetElementRef.current.releasePointerCapture(
            pointerIdRef.current
          );
        } catch {
          // Already released
        }
        targetElementRef.current.removeEventListener('pointermove', handlePointerMove);
        targetElementRef.current.removeEventListener('pointerup', handlePointerUp);
      }
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    isResizing,
    currentSize,
    currentPosition,
    handleResizeStart,
  };
}
