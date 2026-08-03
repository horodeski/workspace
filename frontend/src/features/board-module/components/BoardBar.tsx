import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
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
      <ToggleGroup
        type="single"
        value={activeBoardId ?? undefined}
        onValueChange={(val) => {
          if (val) {
            onSelectBoard(val);
          }
        }}
        className="flex items-center gap-1"
        aria-label="Quadros"
      >
        {sortedBoards.map((board) => (
          <ContextMenu key={board.id}>
            <ContextMenuTrigger asChild>
              <ToggleGroupItem
                value={board.id}
                data-testid={`board-tab-${board.id}`}
                aria-label={`Quadro ${board.name}`}
                className="shrink-0"
              >
                {board.name}
              </ToggleGroupItem>
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
        ))}
      </ToggleGroup>

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
