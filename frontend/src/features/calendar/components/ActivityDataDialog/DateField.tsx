import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface DateFieldProps {
  date: string;
  onChange: (date: string) => void;
}

export function DateField({ date, onChange }: DateFieldProps) {
  return (
    <div>
      <Label>Data</Label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-9 w-full items-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date
              ? format(parse(date, 'yyyy-MM-dd', new Date()), "dd 'de' MMMM, yyyy", { locale: ptBR })
              : "Selecione uma data"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={date ? parse(date, 'yyyy-MM-dd', new Date()) : undefined}
            onSelect={(day) => onChange(day ? format(day, 'yyyy-MM-dd') : '')}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
