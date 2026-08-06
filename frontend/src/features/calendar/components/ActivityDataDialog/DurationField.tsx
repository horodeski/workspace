import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { DURATION_OPTIONS, formatDuration } from './constants';

interface DurationFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DurationField({ value, onChange, open, onOpenChange }: DurationFieldProps) {
  return (
    <div>
      <Label>Duração</Label>
      <Select
        open={open}
        onOpenChange={onOpenChange}
        value={value ? String(value) : '_none'}
        onValueChange={(v: string) => onChange(v === '_none' ? null : Number(v))}
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
  );
}
