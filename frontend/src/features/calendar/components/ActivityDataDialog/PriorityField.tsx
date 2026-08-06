import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { PRIORITY_OPTIONS } from './constants';
import { PriorityType } from '../../types/calendar.types';

interface PriorityFieldProps {
  value: PriorityType | null;
  onChange: (value: PriorityType | null) => void;
}

export function PriorityField({ value, onChange }: PriorityFieldProps) {
  return (
    <div>
      <Label>Prioridade <span className="text-zinc-500 font-normal">(opcional)</span></Label>
      <Select value={value || '_none'} onValueChange={(v: string) => onChange(v === '_none' ? null : v as PriorityType)}>
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
  );
}
