import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalendarStore } from '../hooks/useCalendarStore';
import { ViewMode } from '../types/calendar.types';

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  day: 'Dia',
  week: 'Semana',
  month: 'Mês',
};

export function CalendarToolbar() {
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const viewMode = useCalendarStore((state) => state.viewMode);
  const isExpanded = useCalendarStore((state) => state.isExpanded);
  const goToToday = useCalendarStore((state) => state.goToToday);
  const navigateForward = useCalendarStore((state) => state.navigateForward);
  const navigateBack = useCalendarStore((state) => state.navigateBack);
  const setViewMode = useCalendarStore((state) => state.setViewMode);
  const toggleExpanded = useCalendarStore((state) => state.toggleExpanded);

  const getDateLabel = (): string => {
    switch (viewMode) {
      case 'day':
        return format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR });
      case 'week':
        return format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR });
      case 'month':
        return format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={goToToday}>
          Hoje
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={navigateBack}
          aria-label="Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={navigateForward}
          aria-label="Próximo"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        <span className="text-sm font-medium text-zinc-200 capitalize ml-2">
          {getDateLabel()}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isExpanded && (
          <div className="flex rounded-md p-0.5">
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(mode)}
              >
                {VIEW_MODE_LABELS[mode]}
              </Button>
            ))}
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleExpanded}
          aria-label={isExpanded ? 'Recolher' : 'Expandir'}
        >
          {isExpanded ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
