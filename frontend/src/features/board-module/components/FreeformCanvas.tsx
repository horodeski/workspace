import React, { useState, useCallback, useRef } from 'react';
import { EmptyState } from './EmptyState';
import { PostItCard } from './PostItCard';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import type { BoardItem } from '../types/board.types';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

export interface FreeformCanvasProps {
  items: BoardItem[];
  emptyVariant: 'no-items' | 'no-filter-results';
  onEdit: (item: BoardItem) => void;
  onDelete: (id: string) => void;
  onAddItem?: () => void;
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onUpdateSize: (id: string, size: { width: number; height: number }) => void;
}

export const FreeformCanvas: React.FC<FreeformCanvasProps> = ({
  items,
  emptyVariant,
  onEdit,
  onDelete,
  onAddItem,
  onUpdatePosition,
  onUpdateSize,
}) => {
  const [zIndexMap, setZIndexMap] = useState<Record<string, number>>({});
  const [highestZIndex, setHighestZIndex] = useState(0);

  // Pan/zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleBringToFront = useCallback(
    (id: string) => {
      const nextZ = highestZIndex + 1;
      setHighestZIndex(nextZ);
      setZIndexMap((prev) => ({ ...prev, [id]: nextZ }));
    },
    [highestZIndex]
  );

  // Wheel zoom - zoom toward cursor position
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      // Cursor position relative to container
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const direction = e.deltaY > 0 ? -1 : 1;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + direction * ZOOM_STEP));

      if (newZoom === zoom) return;

      // Zoom toward cursor: adjust pan so point under cursor stays fixed
      const scale = newZoom / zoom;
      const newPanX = cursorX - scale * (cursorX - pan.x);
      const newPanY = cursorY - scale * (cursorY - pan.y);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    },
    [zoom, pan]
  );

  // Pan via middle-click drag or Space+left-click
  const spaceHeld = useRef(false);

  // Track space key for pan mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        spaceHeld.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeld.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const isMiddleClick = e.button === 1;
      const isSpacePan = e.button === 0 && spaceHeld.current;

      if (!isMiddleClick && !isSpacePan) return;

      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      panOrigin.current = { x: pan.x, y: pan.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pan]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
    },
    [isPanning]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;
      setIsPanning(false);
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [isPanning]
  );

  // Reset view
  const handleResetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  if (items.length === 0) {
    return (
      <div
        className="relative flex-1 overflow-hidden"
        data-testid="freeform-canvas"
      >
        <EmptyState variant={emptyVariant} onAddItem={onAddItem} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      data-testid="freeform-canvas"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Transformed canvas layer */}
      <div
        className="absolute origin-top-left"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          willChange: 'transform',
        }}
        data-testid="freeform-canvas-inner"
      >
        {items.map((item) => (
          <PostItCard
            key={item.id}
            item={item}
            zIndex={zIndexMap[item.id] ?? 0}
            zoom={zoom}
            onEdit={onEdit}
            onDelete={onDelete}
            onBringToFront={handleBringToFront}
            onUpdatePosition={onUpdatePosition}
            onUpdateSize={onUpdateSize}
          />
        ))}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-background/80 backdrop-blur-sm border rounded-md px-1 py-0.5 shadow-sm z-50">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
          className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Diminuir zoom"
        >
          −
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors min-w-[3rem] text-center"
          aria-label="Resetar visualização"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
          className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Aumentar zoom"
        >
          +
        </button>
      </div>
    </div>
  );
};

FreeformCanvas.displayName = 'FreeformCanvas';
