import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import type { BoardSummary } from '../hooks/useBoardModuleStore';

export interface BoardBarProps {
  boards: BoardSummary[];
  activeBoardId: string | null;
  onSelectBoard: (id: string) => void;
  onCreateBoard: () => void;
  onRenameBoard: (id: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteBoard: (id: string) => void;
  onStartRename?: (id: string) => void;
  canDelete: boolean;
}

export const BoardBar: React.FC<BoardBarProps> = ({
  boards,
  activeBoardId,
  onSelectBoard,
  onCreateBoard,
  onDeleteBoard,
  onStartRename,
  canDelete,
}) => {
  const sortedBoards = [...boards].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div
      data-testid="board-bar"
      className="flex items-center gap-2 overflow-x-auto px-2 py-3 border-b"
    >
      <div className="flex items-center gap-1" role="tablist" aria-label="Quadros">
        {sortedBoards.map((board) => {
          const isActive = board.id === activeBoardId;
          return (
          <ContextMenu key={board.id}>
            <ContextMenuTrigger asChild>
              <button
                role="tab"
                aria-selected={isActive}
                data-testid={`board-tab-${board.id}`}
                aria-label={`Quadro ${board.name}`}
                onClick={() => onSelectBoard(board.id)}
                className={cn(
                  'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {board.name}
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                data-testid={`rename-board-${board.id}`}
                onSelect={() => onStartRename?.(board.id)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Renomear
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                data-testid={`delete-board-${board.id}`}
                disabled={!canDelete}
                onSelect={() => onDeleteBoard(board.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="icon"
        data-testid="create-board-button"
        onClick={onCreateBoard}
        aria-label="Criar novo quadro"
        className="shrink-0"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

BoardBar.displayName = 'BoardBar';
