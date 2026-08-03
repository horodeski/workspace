import { useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Paperclip, Trash2, FileText, Image, File, Download } from 'lucide-react';
import { useCalendarStore } from '../hooks/useCalendarStore';
import { RichTextEditor } from './RichTextEditor';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RecurrenceType, ActivityAttachment, PriorityType } from '../types/calendar.types';

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'weekday', label: 'Dias úteis' },
  { value: 'daily', label: 'Diariamente' },
  { value: 'weekly', label: 'Semanalmente' },
  { value: 'monthly', label: 'Mensalmente' },
  { value: 'none', label: 'Não repete' },
];

const PRIORITY_OPTIONS: { value: PriorityType; label: string; color: string }[] = [
  { value: 'low', label: 'Baixa', color: 'text-blue-400' },
  { value: 'medium', label: 'Média', color: 'text-yellow-400' },
  { value: 'high', label: 'Alta', color: 'text-orange-400' },
  { value: 'urgent', label: 'Urgente', color: 'text-red-400' },
];

// Generate duration options: 5, 10, 15, ... up to 480 (8h)
const DURATION_OPTIONS = Array.from({ length: 96 }, (_, i) => (i + 1) * 5);

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <Image className="w-4 h-4 text-blue-400" />;
  if (type.includes('pdf') || type.includes('document')) return <FileText className="w-4 h-4 text-red-400" />;
  return <File className="w-4 h-4 text-zinc-400" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ActivityDetailDrawer() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = useCalendarStore((state) => state.isActivityDetailOpen);
  const activity = useCalendarStore((state) => state.selectedActivity);
  const closeDetail = useCalendarStore((state) => state.closeActivityDetail);
  const updateActivity = useCalendarStore((state) => state.updateActivity);
  const toggleActivity = useCalendarStore((state) => state.toggleActivity);
  const addAttachment = useCalendarStore((state) => state.addAttachment);
  const removeAttachment = useCalendarStore((state) => state.removeAttachment);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeDetail();
    }
  };

  if (!activity) return null;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateActivity(activity.id, { title: e.target.value });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateActivity(activity.id, { date: e.target.value });
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateActivity(activity.id, { startTime: e.target.value || null });
  };

  const handleDurationChange = (value: string) => {
    updateActivity(activity.id, { duration: value === '_none' ? null : Number(value) });
  };

  const handleRecurrenceChange = (value: string) => {
    updateActivity(activity.id, { recurrence: value as RecurrenceType });
  };

  const handlePriorityChange = (value: string) => {
    updateActivity(activity.id, { priority: value === '_none' ? null : value as PriorityType });
  };

  const handleDescriptionChange = (html: string) => {
    updateActivity(activity.id, { description: html });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const attachment: ActivityAttachment = {
        id: crypto.randomUUID(),
        name: file.name,
        url,
        type: file.type,
        size: file.size,
      };
      addAttachment(activity.id, attachment);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const dateLabel = format(new Date(activity.date + 'T00:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto" aria-label="Detalhes da atividade">
        <DialogHeader>
          <DialogTitle>Detalhes da Atividade</DialogTitle>
          <DialogDescription className="capitalize">{dateLabel}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Status + Title */}
          <div className="flex items-start gap-3">
            <Checkbox
              checked={activity.completed}
              onCheckedChange={() => toggleActivity(activity.id)}
              className="mt-2"
              aria-label={`Marcar como ${activity.completed ? 'pendente' : 'concluída'}`}
            />
            <div className="flex-1">
              <Input
                value={activity.title}
                onChange={handleTitleChange}
                placeholder="Título da atividade"
                className="text-lg font-medium"
                aria-label="Título"
              />
            </div>
          </div>

          {/* Date and time */}
          <div className="flex flex-col gap-3">
            <Input
              type="date"
              label="Data"
              value={activity.date}
              onChange={handleDateChange}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="time"
                label="Início"
                value={activity.startTime || ''}
                onChange={handleStartTimeChange}
              />
              <div>
                <Label>Duração</Label>
                <Select
                  value={activity.duration ? String(activity.duration) : '_none'}
                  onValueChange={handleDurationChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem duração" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="_none">Sem duração</SelectItem>
                    {DURATION_OPTIONS.map((min) => (
                      <SelectItem key={min} value={String(min)}>
                        {formatDuration(min)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <Label>Recorrência</Label>
            <Select value={activity.recurrence} onValueChange={handleRecurrenceChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div>
            <Label>Prioridade <span className="text-zinc-500 font-normal">(opcional)</span></Label>
            <Select value={activity.priority || '_none'} onValueChange={handlePriorityChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sem prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sem prioridade</SelectItem>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className={opt.color}>{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rich text notes */}
          <div>
            <Label className="mb-2 block">Notas / Detalhes</Label>
            <RichTextEditor
              content={activity.description}
              onChange={handleDescriptionChange}
              placeholder="Adicione notas, detalhes, links..."
            />
          </div>

          {/* Attachments */}
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
                onChange={handleFileSelect}
                aria-label="Selecionar arquivos para anexar"
              />
            </div>

            {activity.attachments.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3 text-center border border-dashed border-zinc-800 rounded-md">
                Nenhum anexo. Clique em "Anexar arquivo" para adicionar.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {activity.attachments.map((att) => (
                  <li
                    key={att.id}
                    className="flex items-center gap-2 p-2 rounded border border-zinc-800 group"
                  >
                    {getFileIcon(att.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{att.name}</p>
                      <p className="text-xs text-zinc-500">{formatFileSize(att.size)}</p>
                    </div>
                    <a
                      href={att.url}
                      download={att.name}
                      className="text-zinc-400 hover:text-zinc-100 p-1"
                      aria-label={`Baixar ${att.name}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => removeAttachment(activity.id, att.id)}
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={closeDetail}
            >
              Salvar e fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
