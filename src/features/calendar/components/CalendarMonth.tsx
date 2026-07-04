import {
  startOfMonth,
  startOfWeek,
  addDays,
  isSameMonth,
  isToday,
  format,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { CalendarEventType } from '../types/calendar.types';
import { useCalendarStore } from '../hooks/useCalendarStore';

interface CalendarMonthProps {
  month: Date;
  events: CalendarEventType[];
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function CalendarMonth({ month, events }: CalendarMonthProps) {
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate);
  const setViewMode = useCalendarStore((state) => state.setViewMode);

  // Generate 42 cells (6 weeks × 7 days)
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const getEventsForDay = (day: Date): CalendarEventType[] => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    return events.filter((event) => {
      const eventStart = parseISO(event.startTime);
      const eventEnd = parseISO(event.endTime);
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setViewMode('day');
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-zinc-500 font-medium py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 flex-1 gap-px">
        {cells.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const inCurrentMonth = isSameMonth(day, month);
          const today = isToday(day);

          return (
            <div
              key={i}
              onClick={() => handleDayClick(day)}
              className={`p-1 min-h-[4rem] border border-zinc-800 rounded cursor-pointer hover:bg-zinc-800/50 transition-colors ${
                !inCurrentMonth ? 'opacity-40' : ''
              } ${today ? 'bg-blue-500/10 border-blue-500/50' : ''}`}
            >
              <span
                className={`text-sm ${
                  today ? 'text-blue-400 font-bold' : 'text-zinc-300'
                }`}
              >
                {format(day, 'd')}
              </span>

              {/* Event indicators */}
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-xs text-zinc-500">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
