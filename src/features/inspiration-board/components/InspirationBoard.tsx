import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FreeformCanvas } from './FreeformCanvas';
import { FilterBar } from './FilterBar';
import { ItemForm } from './ItemForm';
import { PageHeader } from '../../../components/PageHeader';
import { useBoardStore } from '../hooks/useBoardStore';
import type {
  BoardFilter,
  BoardItem,
  BoardItemFormData,
} from '../types/board.types';

export const InspirationBoard: React.FC = () => {
  const { items, addItem, updateItem, removeItem, updatePosition, updateSize } =
    useBoardStore();

  const [filter, setFilter] = useState<BoardFilter>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BoardItem | null>(null);

  const filteredItems = useMemo(() => {
    return filter === 'all'
      ? items
      : items.filter((item) => item.type === filter);
  }, [items, filter]);

  const handleAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: BoardItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    removeItem(id);
  };

  const handleFormSubmit = (data: BoardItemFormData) => {
    if (editingItem) {
      updateItem(editingItem.id, data.content);
    } else {
      addItem(data.content, data.type);
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const emptyVariant = filter === 'all' ? 'no-items' : 'no-filter-results';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quadro de Inspiração"
        actions={
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        }
      />

      <FilterBar value={filter} onChange={setFilter} />

      <FreeformCanvas
        items={filteredItems}
        emptyVariant={emptyVariant}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddItem={handleAdd}
        onUpdatePosition={updatePosition}
        onUpdateSize={updateSize}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar inspiração' : 'Nova inspiração'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Edite o conteúdo da sua inspiração.'
                : 'Adicione uma nova inspiração ao seu quadro.'}
            </DialogDescription>
          </DialogHeader>
          <ItemForm
            key={editingItem?.id ?? 'new'}
            defaultValues={
              editingItem
                ? { content: editingItem.content, type: editingItem.type }
                : undefined
            }
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

InspirationBoard.displayName = 'InspirationBoard';
