import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useCalendarStore } from '../../hooks/useCalendarStore';
import { RichTextEditor } from '../RichTextEditor';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RecurrenceType, PriorityType, ActivityAttachment } from '../../types/calendar.types';
import { DateField } from './DateField';
import { DurationField } from './DurationField';
import { RecurrenceField } from './RecurrenceField';
import { PriorityField } from './PriorityField';
import { AttachmentsField } from './AttachmentsField';

interface CreateModeProps {
  mode: 'create';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditModeProps {
  mode: 'edit';
}

type ActivityDataDialogProps = CreateModeProps | EditModeProps;

export function ActivityDataDialog(props: ActivityDataDialogProps) {
  const isEditMode = props.mode === 'edit';

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store state (edit mode)
  const isActivityDetailOpen = useCalendarStore((state) => state.isActivityDetailOpen);
  const activity = useCalendarStore((state) => state.selectedActivity);
  const closeDetail = useCalendarStore((state) => state.closeActivityDetail);
  const updateActivity = useCalendarStore((state) => state.updateActivity);
  const toggleActivity = useCalendarStore((state) => state.toggleActivity);
  const storeAddAttachment = useCalendarStore((state) => state.addAttachment);
  const storeRemoveAttachment = useCalendarStore((state) => state.removeAttachment);
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const addActivity = useCalendarStore((state) => state.addActivity);

  // Local state (create mode)
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [durationOpen, setDurationOpen] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('weekday');
  const [priority, setPriority] = useState<PriorityType | null>(null);
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<ActivityAttachment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine open state
  const dialogOpen = isEditMode ? isActivityDetailOpen : props.open;

  // Sync date when opening in create mode
  useEffect(() => {
    if (!isEditMode && dialogOpen) {
      setDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [dialogOpen, isEditMode, selectedDate]);

  const resetForm = () => {
    setTitle('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setStartTime('');
    setDuration(null);
    setDurationOpen(false);
    setRecurrence('weekday');
    setPriority(null);
    setDescription('');
    setAttachments([]);
    setError('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!isEditMode && loading) return;

    if (isEditMode) {
      if (!open) closeDetail();
    } else {
      if (!open) resetForm();
      props.onOpenChange(open);
    }
  };

  const handleSubmit = async () => {
    if (isEditMode) {
      closeDetail();
      return;
    }

    const trimmed = title.trim();
    if (!trimmed) {
      setError('O título é obrigatório');
      return;
    }
    if (!date) {
      setError('A data é obrigatória');
      return;
    }

    setLoading(true);
    try {
      await addActivity({
        title: trimmed,
        description,
        date,
        startTime: startTime || null,
        duration,
        recurrence,
        priority,
      });
      resetForm();
      props.onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (isEditMode && activity) {
      Array.from(files).forEach((file) => {
        const attachment: ActivityAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type,
          size: file.size,
        };
        storeAddAttachment(activity.id, attachment);
      });
    } else {
      const newAttachments = Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size,
      }));
      setAttachments((prev) => [...prev, ...newAttachments]);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    if (isEditMode && activity) {
      storeRemoveAttachment(activity.id, id);
    } else {
      setAttachments((prev) => prev.filter((att) => att.id !== id));
    }
  };

  // Edit mode with no activity selected
  if (isEditMode && !activity) return null;

  // Resolved values (edit reads from activity, create reads from local state)
  const currentTitle = isEditMode ? activity!.title : title;
  const currentDate = isEditMode ? activity!.date : date;
  const currentStartTime = isEditMode ? (activity!.startTime || '') : startTime;
  const currentDuration = isEditMode ? activity!.duration : duration;
  const currentRecurrence = isEditMode ? activity!.recurrence : recurrence;
  const currentPriority = isEditMode ? activity!.priority : priority;
  const currentDescription = isEditMode ? activity!.description : description;
  const currentAttachments = isEditMode ? activity!.attachments : attachments;

  const dateLabel = isEditMode
    ? format(new Date(activity!.date + 'T00:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })
    : undefined;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => { if (loading) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (loading) e.preventDefault(); }}
        aria-label={isEditMode ? 'Detalhes da atividade' : undefined}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Detalhes da Atividade' : 'Nova Atividade'}</DialogTitle>
          <DialogDescription className={isEditMode ? 'capitalize' : undefined}>
            {isEditMode ? dateLabel : 'Adicione uma atividade ao dia selecionado.'}
          </DialogDescription>
        </DialogHeader>

        <fieldset disabled={loading} className="flex flex-col gap-4 mt-2">
          {/* Title (with checkbox in edit mode) */}
          {isEditMode ? (
            <div className="flex items-start gap-3">
              <Checkbox
                checked={activity!.completed}
                onCheckedChange={() => toggleActivity(activity!.id)}
                className="mt-2"
                aria-label={`Marcar como ${activity!.completed ? 'pendente' : 'concluída'}`}
              />
              <div className="flex-1">
                <Input
                  value={currentTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateActivity(activity!.id, { title: e.target.value })}
                  placeholder="Título da atividade"
                  className="text-lg font-medium"
                  aria-label="Título"
                />
              </div>
            </div>
          ) : (
            <Input
              placeholder="Título da atividade..."
              value={currentTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setTitle(e.target.value); if (error) setError(''); }}
              onKeyDown={handleKeyDown}
              error={error}
              label="Título"
              aria-label="Título da atividade"
            />
          )}

          <DateField
            date={currentDate}
            onChange={(d) => isEditMode ? updateActivity(activity!.id, { date: d }) : setDate(d)}
          />

          <div className="grid grid-cols-2 gap-3 items-end">
            <Input
              type="time"
              label="Início"
              value={currentStartTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                isEditMode
                  ? updateActivity(activity!.id, { startTime: e.target.value || null })
                  : setStartTime(e.target.value)
              }
              onClick={!isEditMode ? () => setDurationOpen(true) : undefined}
            />
            <DurationField
              value={currentDuration}
              onChange={(v) => isEditMode ? updateActivity(activity!.id, { duration: v }) : setDuration(v)}
              open={!isEditMode ? durationOpen : undefined}
              onOpenChange={!isEditMode ? setDurationOpen : undefined}
            />
          </div>

          <RecurrenceField
            value={currentRecurrence}
            onChange={(v) => isEditMode ? updateActivity(activity!.id, { recurrence: v }) : setRecurrence(v)}
          />

          <PriorityField
            value={currentPriority}
            onChange={(v) => isEditMode ? updateActivity(activity!.id, { priority: v }) : setPriority(v)}
          />

          <div>
            <Label className="mb-2 block">Notas / Detalhes</Label>
            <RichTextEditor
              content={currentDescription}
              onChange={(html: string) => isEditMode ? updateActivity(activity!.id, { description: html }) : setDescription(html)}
              placeholder="Adicione notas, detalhes, links..."
              editable={!loading}
            />
          </div>

          <AttachmentsField
            attachments={currentAttachments}
            onAdd={handleFileSelect}
            onRemove={handleRemoveAttachment}
            fileInputRef={fileInputRef}
            showDownload={isEditMode}
          />

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="primary" size="md" onClick={handleSubmit} isLoading={loading} className="flex-1">
              {isEditMode ? 'Salvar e fechar' : 'Adicionar'}
            </Button>
            {!isEditMode && (
              <Button type="button" variant="ghost" size="md" onClick={() => handleOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
            )}
          </div>
        </fieldset>
      </DialogContent>
    </Dialog>
  );
}
