import { useRef, useEffect } from 'react';
import {
  addDays,
  format,
  isToday,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarEventType } from '../types/calendar.types';
import { calculateEventPosition } from '../services/eventPositioning';
import { resolveOverlaps } from '../services/resolveOverlaps';
import { CalendarEvent } from './CalendarEvent';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { getCurrentTimePosition } from '../hooks/useCurrentTime';
import { useCalendarStore } from '../hooks/useCalendarStore';

interface CalendarWeekProps {
  weekStart: Date;
  events: CalendarEventType[];
}

const HOUR_HEIGHT = 48;
const GRID_HEIGHT = HOUR_HEIGHT * 24;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function CalendarWeek({ weekStart, events }: CalendarWeekProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const openDrawer = useCalendarStore((state) => state.openDrawer);

  // Generate 7 days starting from weekStart (Monday)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group events by day
  const eventsByDay = days.map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    return events.filter((event) => {
      const eventStart = parseISO(event.startTime);
      const eventEnd = parseISO(event.endTime);
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });
  });

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (containerRef.current) {
      const position = getCurrentTimePosition() / 100;
      const scrollTarget =
        position * GRID_HEIGHT - containerRef.current.clientHeight / 2;
      containerRef.current.scrollTop = Math.max(0, scrollTarget);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="flex border-b border-zinc-800">
        <div className="w-12 shrink-0" /> {/* Spacer for hour labels */}
        {days.map((day, i) => (
          <div
            key={i}
            className={`flex-1 text-center py-2 text-sm ${
              isToday(day) ? 'text-blue-400 font-semibold' : 'text-zinc-400'
            }`}
          >
            <div>{format(day, 'EEE', { locale: ptBR })}</div>
            <div
              className={`text-lg ${isToday(day) ? 'text-blue-400' : 'text-zinc-100'}`}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div className="flex relative" style={{ height: GRID_HEIGHT }}>
          {/* Hour labels */}
          <div className="w-12 shrink-0 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0"
                style={{ top: hour * HOUR_HEIGHT }}
              >
                <span className="text-xs text-zinc-500 pl-2">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIndex) => {
            const dayEvents = eventsByDay[dayIndex];
            const positionedEvents = resolveOverlaps(dayEvents);

            return (
              <div
                key={dayIndex}
                className={`flex-1 relative border-l border-zinc-800 ${
                  isToday(day) ? 'bg-blue-500/5' : ''
                }`}
              >
                {/* Hour lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-zinc-800"
                    style={{ top: hour * HOUR_HEIGHT }}
                  />
                ))}

                {/* Events */}
                {positionedEvents.map(({ event, widthPercent, leftPercent }) => {
                  const pos = calculateEventPosition(event, GRID_HEIGHT);
                  return (
                    <div
                      key={event.id}
                      className="absolute px-0.5"
                      style={{
                        top: pos.top,
                        height: pos.height,
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    >
                      <CalendarEvent event={event} compact onClick={openDrawer} />
                    </div>
                  );
                })}

                {/* Current time indicator in today's column */}
                {isToday(day) && <CurrentTimeIndicator />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
