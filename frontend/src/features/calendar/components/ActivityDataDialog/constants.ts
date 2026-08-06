import { RecurrenceType, PriorityType } from '../../types/calendar.types';

export const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'weekday', label: 'Dias úteis' },
  { value: 'daily', label: 'Diariamente' },
  { value: 'weekly', label: 'Semanalmente' },
  { value: 'monthly', label: 'Mensalmente' },
  { value: 'none', label: 'Não repete' },
];

export const PRIORITY_OPTIONS: { value: PriorityType; label: string; color: string }[] = [
  { value: 'low', label: 'Baixa', color: 'text-blue-400' },
  { value: 'medium', label: 'Média', color: 'text-yellow-400' },
  { value: 'high', label: 'Alta', color: 'text-orange-400' },
  { value: 'urgent', label: 'Urgente', color: 'text-red-400' },
];

export const DURATION_OPTIONS = Array.from({ length: 96 }, (_, i) => (i + 1) * 5);

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
