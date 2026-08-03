import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface ConfirmDeleteDialogProps {
  boardName: string;
  disabled: boolean;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  boardName,
  disabled,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          data-testid="delete-board-trigger"
          aria-label={`Excluir quadro ${boardName}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="confirm-delete-dialog">
        <DialogHeader>
          <DialogTitle>Excluir quadro</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o quadro &quot;{boardName}&quot;? Esta
            ação é permanente e não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="default"
            onClick={handleCancel}
            data-testid="cancel-delete-button"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            data-testid="confirm-delete-button"
          >
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
