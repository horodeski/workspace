import { useState, useRef, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useCalendarStore } from '../../hooks/useCalendarStore';
import { RichTextEditor } from '../RichTextEditor';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RecurrenceType, PriorityType, ActivityAttachment, Activity } from '../../types/calendar.types';
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

  // Local state for edit mode (mirrors activity, syncs via debounce)
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editDuration, setEditDuration] = useState<number | null>(null);
  const [editRecurrence, setEditRecurrence] = useState<RecurrenceType>('none');
  const [editPriority, setEditPriority] = useState<PriorityType | null>(null);
  const [editDescription, setEditDescription] = useState('');

  // Sync local edit state when activity changes (opening detail or external update)
  useEffect(() => {
    if (isEditMode && activity) {
      setEditTitle(activity.title);
      setEditDate(activity.date);
      setEditStartTime(activity.startTime || '');
      setEditDuration(activity.duration);
      setEditRecurrence(activity.recurrence);
      setEditPriority(activity.priority);
      setEditDescription(activity.description);
    }
  }, [isEditMode, activity?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper: update local edit state only (save happens on submit)
  const handleEditChange = useCallback(
    (field: keyof Activity, value: unknown) => {
      if (!activity) return;
      switch (field) {
        case 'title': setEditTitle(value as string); break;
        case 'date': setEditDate(value as string); break;
        case 'startTime': setEditStartTime((value as string) || ''); break;
        case 'duration': setEditDuration(value as number | null); break;
        case 'recurrence': setEditRecurrence(value as RecurrenceType); break;
        case 'priority': setEditPriority(value as PriorityType | null); break;
        case 'description': setEditDescription(value as string); break;
      }
    },
    [activity]
  );

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
    if (loading) return;

    if (isEditMode) {
      if (!open) closeDetail();
    } else {
      if (!open) resetForm();
      props.onOpenChange(open);
    }
  };

  const handleSubmit = async () => {
    if (isEditMode) {
      if (activity) {
        setLoading(true);
        try {
          await updateActivity(activity.id, {
            title: editTitle,
            date: editDate,
            startTime: editStartTime || null,
            duration: editDuration,
            recurrence: editRecurrence,
            priority: editPriority,
            description: editDescription,
          });
        } finally {
          setLoading(false);
        }
      }
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

    // Capture form data before resetting
    const formData = {
      title: trimmed,
      description,
      date,
      startTime: startTime || null,
      duration,
      recurrence,
      priority,
    };

    // Close dialog immediately to prevent reopen on sidebar remount
    resetForm();
    props.onOpenChange(false);

    await addActivity(formData);
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

  // Resolved values (edit reads from local edit state, create reads from local state)
  const currentTitle = isEditMode ? editTitle : title;
  const currentDate = isEditMode ? editDate : date;
  const currentStartTime = isEditMode ? editStartTime : startTime;
  const currentDuration = isEditMode ? editDuration : duration;
  const currentRecurrence = isEditMode ? editRecurrence : recurrence;
  const currentPriority = isEditMode ? editPriority : priority;
  const currentDescription = isEditMode ? editDescription : description;
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
          <Input
            placeholder="Título da atividade..."
            value={currentTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (isEditMode) {
                handleEditChange('title', e.target.value);
              } else {
                setTitle(e.target.value);
                if (error) setError('');
              }
            }}
            onKeyDown={!isEditMode ? handleKeyDown : undefined}
            error={!isEditMode ? error : undefined}
            label={!isEditMode ? 'Título' : undefined}
            className={isEditMode ? 'text-lg font-medium' : undefined}
            aria-label="Título da atividade"
          />

          <DateField
            date={currentDate}
            onChange={(d) => isEditMode ? handleEditChange('date', d) : setDate(d)}
          />

          <div className="grid grid-cols-2 gap-3 items-end">
            <Input
              type="time"
              label="Início"
              value={currentStartTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                isEditMode
                  ? handleEditChange('startTime', e.target.value || null)
                  : setStartTime(e.target.value)
              }
              onClick={!isEditMode ? () => setDurationOpen(true) : undefined}
            />
            <DurationField
              value={currentDuration}
              onChange={(v) => isEditMode ? handleEditChange('duration', v) : setDuration(v)}
              open={!isEditMode ? durationOpen : undefined}
              onOpenChange={!isEditMode ? setDurationOpen : undefined}
            />
          </div>

          <RecurrenceField
            value={currentRecurrence}
            onChange={(v) => isEditMode ? handleEditChange('recurrence', v) : setRecurrence(v)}
          />

          <PriorityField
            value={currentPriority}
            onChange={(v) => isEditMode ? handleEditChange('priority', v) : setPriority(v)}
          />

          <div>
            <Label className="mb-2 block">Notas / Detalhes</Label>
            <RichTextEditor
              content={currentDescription}
              onChange={(html: string) => isEditMode ? handleEditChange('description', html) : setDescription(html)}
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
