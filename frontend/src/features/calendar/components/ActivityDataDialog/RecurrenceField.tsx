import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { RECURRENCE_OPTIONS } from './constants';
import { RecurrenceType } from '../../types/calendar.types';

interface RecurrenceFieldProps {
  value: RecurrenceType;
  onChange: (value: RecurrenceType) => void;
}

export function RecurrenceField({ value, onChange }: RecurrenceFieldProps) {
  return (
    <div>
      <Label>Recorrência</Label>
      <Select value={value} onValueChange={(v: string) => onChange(v as RecurrenceType)}>
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
  );
}
