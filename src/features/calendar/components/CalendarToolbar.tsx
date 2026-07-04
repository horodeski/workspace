import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalendarStore } from '../hooks/useCalendarStore';

export function CalendarToolbar() {
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const navigateForward = useCalendarStore((state) => state.navigateForward);
  const navigateBack = useCalendarStore((state) => state.navigateBack);
  const goToToday = useCalendarStore((state) => state.goToToday);

  const dateLabel = format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={navigateBack}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={navigateForward}
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        <span className="text-sm font-medium text-zinc-200 capitalize ml-2">
          {dateLabel}
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={goToToday}
        className="text-xs"
      >
        Hoje
      </Button>
    </div>
  );
}
