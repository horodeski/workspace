import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { useBoardModuleStore } from '../hooks/useBoardModuleStore';
import { BoardBar } from '../components/BoardBar';
import { FilterBar } from '../components/FilterBar';
import { FreeformCanvas } from '../components/FreeformCanvas';
import { ItemForm } from '../components/ItemForm';
import type { BoardItem } from '../types/board.types';
import type { BoardItemFormData } from '../types/board.types';
import type { BoardFilter } from '../types/board.types';

export const BoardModulePage: React.FC = () => {
  const {
    boards,
    activeBoard,
    activeBoardId,
    isLoading,
    isSwitchingBoard,
    createBoard,
    renameBoard,
    deleteBoard,
    setActiveBoard,
    addItem,
    updateItem,
    removeItem,
    updatePosition,
    updateSize,
    getActiveFilter,
    setFilter,
    fetchBoards,
  } = useBoardModuleStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BoardItem | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [createBoardError, setCreateBoardError] = useState<string | null>(null);
  const [isRenameBoardOpen, setIsRenameBoardOpen] = useState(false);
  const [renameBoardId, setRenameBoardId] = useState<string | null>(null);
  const [renameBoardValue, setRenameBoardValue] = useState('');
  const [renameBoardError, setRenameBoardError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const fetched = useRef(false);

  // Fetch boards on mount
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchBoards().finally(() => setInitialLoad(false));
  }, [fetchBoards]);

  const activeFilter = getActiveFilter();

  const filteredItems = useMemo(() => {
    if (!activeBoard) return [];
    return activeFilter === 'all'
      ? activeBoard.items
      : activeBoard.items.filter((item) => item.type === activeFilter);
  }, [activeBoard, activeFilter]);

  const emptyVariant: 'no-items' | 'no-filter-results' = useMemo(() => {
    if (!activeBoard || activeBoard.items.length === 0) return 'no-items';
    return 'no-filter-results';
  }, [activeBoard]);

  const canDelete = boards.length > 1;

  const boardToDeleteName = useMemo(() => {
    if (!boardToDelete) return '';
    const board = boards.find((b) => b.id === boardToDelete);
    return board?.name ?? '';
  }, [boardToDelete, boards]);

  if (initialLoad && isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-zinc-500 gap-3">
        <div className="animate-spin h-6 w-6 border-2 border-zinc-400 border-t-transparent rounded-full" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  const handleCreateBoard = () => {
    setNewBoardName('');
    setCreateBoardError(null);
    setIsCreateBoardOpen(true);
  };

  const handleConfirmCreateBoard = async () => {
    const result = await createBoard(newBoardName);
    if (result.success) {
      setIsCreateBoardOpen(false);
      setNewBoardName('');
      setCreateBoardError(null);
    } else {
      setCreateBoardError(result.error ?? 'Nome inválido');
    }
  };

  const handleDeleteBoard = (id: string) => {
    setBoardToDelete(id);
  };

  const handleStartRename = (id: string) => {
    const board = boards.find((b) => b.id === id);
    if (!board) return;
    setRenameBoardId(id);
    setRenameBoardValue(board.name);
    setRenameBoardError(null);
    setIsRenameBoardOpen(true);
  };

  const handleConfirmRename = async () => {
    if (!renameBoardId) return;
    setIsRenaming(true);
    const result = await renameBoard(renameBoardId, renameBoardValue);
    setIsRenaming(false);
    if (result.success) {
      setIsRenameBoardOpen(false);
      setRenameBoardId(null);
      setRenameBoardValue('');
      setRenameBoardError(null);
    } else {
      setRenameBoardError(result.error ?? 'Nome inválido');
    }
  };

  const handleConfirmDelete = async () => {
    if (boardToDelete) {
      setIsDeletingBoard(true);
      await deleteBoard(boardToDelete);
      setIsDeletingBoard(false);
      setBoardToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setBoardToDelete(null);
  };

  const handleFilterChange = (filter: BoardFilter) => {
    if (activeBoardId) {
      setFilter(activeBoardId, filter);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEditItem = (item: BoardItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    setItemToDelete(id);
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

  return (
    <div className="flex flex-col h-full">
      <BoardBar
        boards={boards}
        activeBoardId={activeBoardId}
        onSelectBoard={setActiveBoard}
        onCreateBoard={handleCreateBoard}
        onRenameBoard={renameBoard}
        onDeleteBoard={handleDeleteBoard}
        onStartRename={handleStartRename}
        canDelete={canDelete}
      />

      <div className="flex items-center justify-between px-4 py-2 border-b">
        <FilterBar value={activeFilter} onChange={handleFilterChange} />
        <Button onClick={handleAddItem} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {!initialLoad && isSwitchingBoard ? (
        <div className="flex flex-1 items-center justify-center text-zinc-500 gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-zinc-400 border-t-transparent rounded-full" />
          <span className="text-sm">Carregando quadro...</span>
        </div>
      ) : (
        <FreeformCanvas
          items={filteredItems}
          emptyVariant={emptyVariant}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          onAddItem={handleAddItem}
          onUpdatePosition={updatePosition}
          onUpdateSize={updateSize}
        />
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar item' : 'Novo item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Edite o conteúdo do item.'
                : 'Adicione um novo item ao quadro.'}
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

      <ConfirmDeleteDialog
        open={boardToDelete !== null}
        onOpenChange={(open) => { if (!open) handleCancelDelete(); }}
        title={boardToDeleteName}
        description={`Tem certeza que deseja excluir o quadro "${boardToDeleteName}"? Esta ação é permanente e não pode ser desfeita.`}
        onConfirm={handleConfirmDelete}
        isLoading={isDeletingBoard}
      />

      <Dialog
        open={isCreateBoardOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsCreateBoardOpen(false);
            setNewBoardName('');
            setCreateBoardError(null);
          }
        }}
      >
        <DialogContent data-testid="create-board-dialog">
          <DialogHeader>
            <DialogTitle>Novo quadro</DialogTitle>
            <DialogDescription>
              Escolha um nome para o novo quadro.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="new-board-name">Nome</Label>
            <Input
              id="new-board-name"
              data-testid="create-board-input"
              value={newBoardName}
              onChange={(e) => {
                setNewBoardName(e.target.value);
                setCreateBoardError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmCreateBoard();
                }
              }}
              placeholder="Nome do quadro"
              autoFocus
            />
            {createBoardError && (
              <p className="text-sm text-destructive" data-testid="create-board-error">
                {createBoardError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="default"
              onClick={() => {
                setIsCreateBoardOpen(false);
                setNewBoardName('');
                setCreateBoardError(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmCreateBoard} data-testid="create-board-confirm">
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isRenameBoardOpen}
        onOpenChange={(open: boolean) => {
          if (isRenaming) return;
          if (!open) {
            setIsRenameBoardOpen(false);
            setRenameBoardId(null);
            setRenameBoardValue('');
            setRenameBoardError(null);
          }
        }}
      >
        <DialogContent data-testid="rename-board-dialog" onInteractOutside={(e: Event) => { if (isRenaming) e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>Renomear quadro</DialogTitle>
            <DialogDescription>
              Digite o novo nome para o quadro.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="rename-board-name">Nome</Label>
            <Input
              id="rename-board-name"
              data-testid="rename-board-input"
              value={renameBoardValue}
              disabled={isRenaming}
              onChange={(e) => {
                setRenameBoardValue(e.target.value);
                setRenameBoardError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmRename();
                }
              }}
              placeholder="Nome do quadro"
              autoFocus
            />
            {renameBoardError && (
              <p className="text-sm text-destructive" data-testid="rename-board-error">
                {renameBoardError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="default"
              disabled={isRenaming}
              onClick={() => {
                setIsRenameBoardOpen(false);
                setRenameBoardId(null);
                setRenameBoardValue('');
                setRenameBoardError(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmRename} disabled={isRenaming} data-testid="rename-board-confirm">
              {isRenaming && (
                <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Renomear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={itemToDelete !== null}
        onOpenChange={(open) => { if (!open) setItemToDelete(null); }}
        title="item"
        description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
        isLoading={isDeletingItem}
        onConfirm={async () => {
          if (itemToDelete) {
            setIsDeletingItem(true);
            await removeItem(itemToDelete);
            setIsDeletingItem(false);
            setItemToDelete(null);
          }
        }}
      />
    </div>
  );
};

BoardModulePage.displayName = 'BoardModulePage';
