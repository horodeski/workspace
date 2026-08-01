import React, { useState, useCallback } from 'react';
import { Quote, Image, Link, StickyNote, Pencil, Trash2, ImageOff } from 'lucide-react';
import { ResizeHandles } from './ResizeHandles';
import { useDragInteraction } from '../hooks/useDragInteraction';
import { useResizeInteraction } from '../hooks/useResizeInteraction';
import { useKeyboardReposition } from '../hooks/useKeyboardReposition';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import type { BoardItem, BoardItemType } from '../types/board.types';

export interface PostItCardProps {
  item: BoardItem;
  zIndex: number;
  onEdit: (item: BoardItem) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onUpdateSize: (id: string, size: { width: number; height: number }) => void;
}

const TYPE_COLORS: Record<BoardItemType, string> = {
  note: '#fef9c3',
  quote: '#dbeafe',
  link: '#dcfce7',
  image: '#fce7f3',
};

const TYPE_ICONS: Record<BoardItemType, React.ElementType> = {
  quote: Quote,
  image: Image,
  link: Link,
  note: StickyNote,
};

export const PostItCard: React.FC<PostItCardProps> = ({
  item,
  zIndex,
  onEdit,
  onDelete,
  onBringToFront,
  onUpdatePosition,
  onUpdateSize,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { isDragging, currentPosition, handlePointerDown } = useDragInteraction({
    itemId: item.id,
    initialPosition: item.position,
    canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    cardSize: item.size,
    onDragEnd: (id, pos) => onUpdatePosition(id, pos),
    onBringToFront,
  });

  const { isResizing, currentSize, currentPosition: resizePosition, handleResizeStart } =
    useResizeInteraction({
      itemId: item.id,
      itemType: item.type,
      initialSize: item.size,
      initialPosition: item.position,
      canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      onResizeEnd: (id, size, pos) => {
        onUpdateSize(id, size);
        onUpdatePosition(id, pos);
      },
    });

  const { handleKeyDown, announcement } = useKeyboardReposition({
    itemId: item.id,
    position: item.position,
    size: item.size,
    canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    onPositionChange: onUpdatePosition,
    onSizeChange: onUpdateSize,
  });

  const TypeIcon = TYPE_ICONS[item.type];
  const backgroundColor = TYPE_COLORS[item.type];
  const showHandles = isHovered || isFocused;

  const ariaLabel = `${item.type} ${item.content.slice(0, 50)}`;

  // Use the position/size from hooks during interactions, otherwise from the item
  const renderedPosition = isDragging
    ? currentPosition
    : isResizing
      ? resizePosition
      : item.position;
  const renderedSize = isResizing ? currentSize : item.size;

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  return (
    <div
      role="application"
      aria-roledescription="draggable item"
      aria-label={ariaLabel}
      tabIndex={0}
      className="absolute select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-none"
      style={{
        left: renderedPosition.x,
        top: renderedPosition.y,
        width: renderedSize.width,
        height: renderedSize.height,
        zIndex,
        borderRadius: 12,
        backgroundColor,
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: isDragging ? 'scale(1.03)' : 'scale(1)',
        boxShadow: isDragging
          ? '0 8px 24px rgba(0,0,0,0.20)'
          : '0 2px 8px rgba(0,0,0,0.10)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onClick={() => onBringToFront(item.id)}
      data-testid={`postit-card-${item.id}`}
    >
      {/* Aria-live region for keyboard position announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Card content container */}
      <div className="relative flex flex-col h-full p-3 overflow-hidden">
        {/* Header: type icon + action buttons */}
        <div className="flex items-center justify-between mb-1 shrink-0">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
            <TypeIcon className="h-3.5 w-3.5" />
          </span>
          <div className="flex gap-0.5">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              aria-label={`Edit ${item.type}`}
              className="p-1 rounded text-gray-500 hover:text-gray-800 hover:bg-black/5 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              aria-label={`Delete ${item.type}`}
              className="p-1 rounded text-gray-500 hover:text-red-600 hover:bg-black/5 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {item.type === 'image' ? (
            imageError ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <ImageOff className="h-8 w-8" />
                <span className="text-xs text-center">Image could not be loaded</span>
              </div>
            ) : (
              <img
                src={item.content}
                alt={`Image card ${item.id}`}
                className="w-full h-full rounded"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
                onError={handleImageError}
              />
            )
          ) : (
            <p className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-6 overflow-hidden">
              {item.content}
            </p>
          )}
        </div>
      </div>

      {/* Resize handles */}
      <ResizeHandles onResizeStart={handleResizeStart} visible={showHandles} />
    </div>
  );
};

PostItCard.displayName = 'PostItCard';
