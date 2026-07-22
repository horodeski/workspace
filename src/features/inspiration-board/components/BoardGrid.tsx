import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BoardItemCard } from './BoardItemCard';
import { EmptyState } from './EmptyState';
import type { BoardItem } from '../types/board.types';

const PAGE_SIZE = 50;

export interface BoardGridProps {
  items: BoardItem[];
  emptyVariant: 'no-items' | 'no-filter-results';
  onEdit: (item: BoardItem) => void;
  onDelete: (id: string) => void;
  onAddItem?: () => void;
}

export const BoardGrid: React.FC<BoardGridProps> = ({
  items,
  emptyVariant,
  onEdit,
  onDelete,
  onAddItem,
}) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (items.length === 0) {
    return <EmptyState variant={emptyVariant} onAddItem={onAddItem} />;
  }

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleItems.map((item) => (
          <BoardItemCard
            key={item.id}
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={handleLoadMore}>
            Carregar mais
          </Button>
        </div>
      )}
    </div>
  );
};

BoardGrid.displayName = 'BoardGrid';
