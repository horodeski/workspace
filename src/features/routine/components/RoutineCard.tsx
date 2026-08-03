import React from 'react';
import { Trash2, Paperclip, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupportEntry } from '../types/routine.types';

export interface SupportEntryRowProps {
  entry: SupportEntry;
  onRemove: (id: string) => void;
  onEdit: (entry: SupportEntry) => void;
}

export const SupportEntryRow: React.FC<SupportEntryRowProps> = ({
  entry,
  onRemove,
  onEdit,
}) => {
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
            </div>
          ))}
        </div>
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(entry)}
            aria-label={`Editar entrada "${entry.description}"`}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(entry.id)}
            aria-label={`Remover entrada "${entry.description}"`}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

SupportEntryRow.displayName = 'SupportEntryRow';
