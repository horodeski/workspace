import React from 'react';
import { Trash2, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupportEntry } from '../types/routine.types';
import { useSupportCardStore } from '../hooks/useRoutineStore';

export interface SupportEntryRowProps {
  entry: SupportEntry;
  onRemove: (id: string) => void;
}

export const SupportEntryRow: React.FC<SupportEntryRowProps> = ({
  entry,
  onRemove,
}) => {
  const { addAttachment, removeAttachment } = useSupportCardStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        addAttachment(entry.id, {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
      <td className="px-3 py-2 text-sm text-foreground whitespace-nowrap">
        {entry.date}
      </td>
      <td className="px-3 py-2 text-sm text-foreground">
        {entry.description}
      </td>
      <td className="px-3 py-2 text-sm text-foreground whitespace-nowrap">
        {entry.duration}
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground max-w-[200px]">
        {entry.observation || '—'}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col gap-1">
          {(entry.attachments ?? []).map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Paperclip className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[120px]">{att.name}</span>
              <button
                onClick={() => removeAttachment(entry.id, att.id)}
                className="ml-1 text-muted-foreground hover:text-destructive"
                aria-label={`Remover anexo ${att.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-6 px-2 text-xs gap-1 w-fit"
          >
            <Paperclip className="h-3 w-3" />
            Anexar
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            aria-label="Adicionar anexo"
          />
        </div>
      </td>
      <td className="px-3 py-2 text-right">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(entry.id)}
          aria-label={`Remover entrada "${entry.description}"`}
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};

SupportEntryRow.displayName = 'SupportEntryRow';
