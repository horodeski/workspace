import React, { useState, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { EmptyState } from './EmptyState';
import { PostItCard } from './PostItCard';
import type { BoardItem } from '../types/board.types';

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

  const handleBringToFront = useCallback(
    (id: string) => {
      const nextZ = highestZIndex + 1;
      setHighestZIndex(nextZ);
      setZIndexMap((prev) => ({ ...prev, [id]: nextZ }));
    },
    [highestZIndex]
  );

  if (items.length === 0) {
    return (
      <div
        className="relative flex-1 overflow-auto"
        data-testid="freeform-canvas"
      >
        <EmptyState variant={emptyVariant} onAddItem={onAddItem} />
      </div>
    );
  }

  return (
    <div
      className="relative flex-1 overflow-auto"
      data-testid="freeform-canvas"
    >
      <div
        className="relative"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          minWidth: CANVAS_WIDTH,
          minHeight: CANVAS_HEIGHT,
        }}
        data-testid="freeform-canvas-inner"
      >
        {items.map((item) => (
          <PostItCard
            key={item.id}
            item={item}
            zIndex={zIndexMap[item.id] ?? 0}
            onEdit={onEdit}
            onDelete={onDelete}
            onBringToFront={handleBringToFront}
            onUpdatePosition={onUpdatePosition}
            onUpdateSize={onUpdateSize}
          />
        ))}
      </div>
    </div>
  );
};

FreeformCanvas.displayName = 'FreeformCanvas';
