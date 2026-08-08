import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isLoading = false,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(value) => { if (!isLoading) onOpenChange(value); }}>
      <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => { if (isLoading) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (isLoading) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Confirmar exclusão
          </DialogTitle>
          <DialogDescription>
            {description ?? (
              <>Tem certeza que deseja excluir <strong className="text-zinc-200">"{title}"</strong>? Esta ação não pode ser desfeita.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={onConfirm} isLoading={isLoading}>
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
