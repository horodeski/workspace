import React, { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { InboxTask } from '../types/inbox.types';

export interface InboxItemProps {
  task: InboxTask;
  onToggleComplete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

export const InboxItem: React.FC<InboxItemProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  const handleStartEdit = () => {
    setEditText(task.text);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditText(task.text);
    setIsEditing(false);
  };

  const handleConfirmEdit = () => {
    const trimmed = editText.trim();
    if (trimmed.length > 0 && trimmed.length <= 200) {
      onEdit(task.id, editText);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <Card
      className={cn(
        'group flex items-center gap-3 px-3 py-2 transition-colors',
        'hover:bg-accent/50',
        task.completed && 'opacity-50'
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggleComplete(task.id)}
        aria-label={`Marcar "${task.text}" como ${task.completed ? 'pendente' : 'concluída'}`}
        className="cursor-pointer"
      />

      {isEditing ? (
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={200}
            autoFocus
            className={cn(
              'flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label="Editar tarefa"
          />
          <button
            onClick={handleConfirmEdit}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-green-400 transition-colors"
            aria-label="Confirmar edição"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancelEdit}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
            aria-label="Cancelar edição"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <span
            className={cn(
              'flex-1 text-sm text-foreground',
              task.completed && 'line-through'
            )}
          >
            {task.text}
          </span>

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleStartEdit}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Editar tarefa"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
              aria-label="Excluir tarefa"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </Card>
  );
};

InboxItem.displayName = 'InboxItem';
