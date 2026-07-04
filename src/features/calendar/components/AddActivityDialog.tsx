import { useState } from 'react';
import { format } from 'date-fns';
import { useCalendarStore } from '../hooks/useCalendarStore';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/label';
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
import { RecurrenceType, PriorityType } from '../types/calendar.types';

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

interface AddActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddActivityDialog({ open, onOpenChange }: AddActivityDialogProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('weekday');
  const [priority, setPriority] = useState<PriorityType | null>(null);
  const [error, setError] = useState('');

  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const addActivity = useCalendarStore((state) => state.addActivity);

  const resetForm = () => {
    setTitle('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setStartTime('');
    setDuration(null);
    setRecurrence('weekday');
    setPriority(null);
    setError('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setDate(format(selectedDate, 'yyyy-MM-dd'));
    } else {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('O título é obrigatório');
      return;
    }
    if (!date) {
      setError('A data é obrigatória');
      return;
    }

    addActivity({
      title: trimmed,
      description: '',
      date,
      startTime: startTime || null,
      duration,
      recurrence,
      priority,
    });
    resetForm();
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Atividade</DialogTitle>
          <DialogDescription>
            Adicione uma atividade ao dia selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <Input
            placeholder="Título da atividade..."
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setTitle(e.target.value); if (error) setError(''); }}
            onKeyDown={handleKeyDown}
            error={error}
            label="Título"
            aria-label="Título da atividade"
          />

          <Input
            type="date"
            label="Data"
            value={date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="time"
              label="Início"
              value={startTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
            />
            <div>
              <Label>Duração</Label>
              <Select
                value={duration ? String(duration) : '_none'}
                onValueChange={(v: string) => setDuration(v === '_none' ? null : Number(v))}
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

          <div>
            <Label>Recorrência</Label>
            <Select value={recurrence} onValueChange={(v: string) => setRecurrence(v as RecurrenceType)}>
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

          <div>
            <Label>Prioridade <span className="text-zinc-500 font-normal">(opcional)</span></Label>
            <Select value={priority || '_none'} onValueChange={(v: string) => setPriority(v === '_none' ? null : v as PriorityType)}>
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

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="primary" size="md" onClick={handleAdd} className="flex-1">
              Adicionar
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
