import {
  startOfMonth,
  startOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { CalendarEventType, PriorityType } from '../types/calendar.types';
import { useCalendarStore } from '../hooks/useCalendarStore';
import { Badge } from '@/components/ui/badge';

interface CalendarMonthProps {
  month: Date;
  events: CalendarEventType[];
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function getPriorityBadgeVariant(priority: PriorityType | null, completed: boolean): 'success' | 'secondary' | 'warning' | 'destructive' | 'default' {
  if (completed) return 'success';
  if (!priority) return 'secondary';
  switch (priority) {
    case 'urgent': return 'destructive';
    case 'high': return 'warning';
    case 'medium': return 'secondary';
    case 'low': return 'default';
  }
}

export function CalendarMonth({ month, events }: CalendarMonthProps) {
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate);
  // Subscribe to activities to re-render when they change
  useCalendarStore((state) => state.activities);
  const getActivitiesForDate = useCalendarStore((state) => state.getActivitiesForDate);

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
          const dayActivities = getActivitiesForDate(day);
          const inCurrentMonth = isSameMonth(day, month);
          const today = isToday(day);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={i}
              onClick={() => handleDayClick(day)}
              className={`p-1 min-h-[4rem] border rounded cursor-pointer hover:bg-zinc-800/50 transition-colors overflow-hidden ${
                !inCurrentMonth ? 'opacity-40' : ''
              } ${isSelected ? 'bg-blue-500/15 border-blue-500/70 ring-1 ring-blue-500/30' : 'border-zinc-800'} ${today && !isSelected ? 'bg-blue-500/10 border-blue-500/50' : ''}`}
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
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[10px] text-zinc-500">
                      +{dayEvents.length - 2}
                    </span>
                  )}
                </div>
              )}

              {/* Activity badges */}
              {dayActivities.length > 0 && (
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {dayActivities.slice(0, 2).map((activity) => (
                    <Badge
                      key={activity.id}
                      variant={getPriorityBadgeVariant(activity.priority, activity.completed)}
                      className={`text-[9px] px-1 py-0 truncate max-w-full block ${
                        activity.completed ? 'line-through opacity-60' : ''
                      }`}
                    >
                      {activity.title}
                    </Badge>
                  ))}
                  {dayActivities.length > 2 && (
                    <span className="text-[10px] text-zinc-500 pl-0.5">
                      +{dayActivities.length - 2}
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
