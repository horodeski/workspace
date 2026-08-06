import { Paperclip, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/label';
import { ActivityAttachment } from '../../types/calendar.types';
import { getFileIcon, formatFileSize } from './constants';

interface AttachmentsFieldProps {
  attachments: ActivityAttachment[];
  onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  showDownload?: boolean;
}

export function AttachmentsField({
  attachments,
  onAdd,
  onRemove,
  fileInputRef,
  showDownload = false,
}: AttachmentsFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>Anexos</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-xs"
        >
          <Paperclip className="w-3.5 h-3.5" />
          Anexar arquivo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onAdd}
          aria-label="Selecionar arquivos para anexar"
        />
      </div>

      {attachments.length === 0 ? (
        <p className="text-xs text-zinc-500 py-3 text-center border border-dashed border-zinc-800 rounded-md">
          Nenhum anexo. Clique em "Anexar arquivo" para adicionar.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {attachments.map((att) => (
            <li key={att.id} className="flex items-center gap-2 p-2 rounded border border-zinc-800 group">
              {getFileIcon(att.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{att.name}</p>
                <p className="text-xs text-zinc-500">{formatFileSize(att.size)}</p>
              </div>
              {showDownload && (
                <a
                  href={att.url}
                  download={att.name}
                  className="text-zinc-400 hover:text-zinc-100 p-1"
                  aria-label={`Baixar ${att.name}`}
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => onRemove(att.id)}
                className="text-zinc-500 hover:text-red-400 p-1"
                aria-label={`Remover ${att.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
