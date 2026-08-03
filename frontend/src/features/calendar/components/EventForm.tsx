import { useForm, Controller, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarEventType,
  CalendarEventFormData,
  calendarEventSchema,
} from '../types/calendar.types';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Trash2, Check } from 'lucide-react';

interface EventFormProps {
  event: CalendarEventType;
  onSave: (data: CalendarEventFormData) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'work', label: 'Trabalho' },
  { value: 'personal', label: 'Pessoal' },
  { value: 'health', label: 'Saúde' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'other', label: 'Outro' },
] as const;

const STATUSES = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in-progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluído' },
] as const;

/** Convert ISO 8601 string to datetime-local input format (YYYY-MM-DDTHH:mm) */
function toDatetimeLocal(isoString: string): string {
  return isoString.slice(0, 16);
}

/** Convert datetime-local input value to ISO 8601 string */
function toISO(datetimeLocal: string): string {
  return new Date(datetimeLocal).toISOString();
}

export function EventForm({ event, onSave, onDelete, onClose }: EventFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm<CalendarEventFormData>({
    resolver: zodResolver(calendarEventSchema) as unknown as Resolver<CalendarEventFormData>,
    defaultValues: {
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      category: event.category,
      color: event.color,
      status: event.status,
    },
  });

  const onSubmit = (data: CalendarEventFormData) => {
    onSave(data);
  };

  const handleMarkCompleted = () => {
    setValue('status', 'completed');
    handleSubmit(onSubmit)();
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      setValue('startTime', toISO(value), { shouldValidate: true });
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      setValue('endTime', toISO(value), { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
      {/* Title */}
      <Input
        id="event-title"
        {...register('title')}
        label="Título"
        placeholder="Título do evento"
        error={errors.title?.message}
      />

      {/* Description */}
      <Textarea
        id="event-description"
        label="Descrição"
        {...register('description')}
        rows={3}
        placeholder="Descrição do evento"
        error={errors.description?.message}
      />

      {/* Start Time */}
      <Input
        id="event-start-time"
        type="datetime-local"
        label="Início"
        defaultValue={toDatetimeLocal(event.startTime)}
        onChange={handleStartTimeChange}
        error={errors.startTime?.message}
      />

      {/* End Time */}
      <Input
        id="event-end-time"
        type="datetime-local"
        label="Término"
        defaultValue={toDatetimeLocal(event.endTime)}
        onChange={handleEndTimeChange}
        error={errors.endTime?.message}
      />

      {/* Category */}
      <div>
        <Label htmlFor="event-category">
          Categoria
        </Label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="event-category">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.category && (
          <p className="text-xs text-destructive mt-1">{errors.category.message}</p>
        )}
      </div>

      {/* Color */}
      <div>
        <Label htmlFor="event-color">
          Cor
        </Label>
        <input
          id="event-color"
          type="color"
          {...register('color')}
          className="w-12 h-8 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
        />
        {errors.color && <p className="text-xs text-destructive mt-1">{errors.color.message}</p>}
      </div>

      {/* Status */}
      <div>
        <Label htmlFor="event-status">
          Status
        </Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="event-status">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.status && (
          <p className="text-xs text-destructive mt-1">{errors.status.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-zinc-800">
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
        >
          Salvar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleMarkCompleted}
          title="Marcar como concluído"
          aria-label="Marcar como concluído"
          className="p-2 bg-green-600/20 text-green-400 hover:bg-green-600/30"
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onDelete(event.id)}
          title="Excluir"
          aria-label="Excluir evento"
          className="p-2"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
