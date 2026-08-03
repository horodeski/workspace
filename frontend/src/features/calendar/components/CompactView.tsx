import { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCalendarStore } from '../hooks/useCalendarStore';
import { getCurrentTimePosition } from '../hooks/useCurrentTime';
import { calculateEventPosition } from '../services/eventPositioning';
import { CalendarEvent } from './CalendarEvent';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';

const HOUR_HEIGHT = 48; // px per hour
const GRID_HEIGHT = HOUR_HEIGHT * 24;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function CompactView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const getEventsForDate = useCalendarStore((state) => state.getEventsForDate);
  const openDrawer = useCalendarStore((state) => state.openDrawer);

  const events = getEventsForDate(selectedDate);
  const dateLabel = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (containerRef.current) {
      const position = getCurrentTimePosition() / 100;
      const scrollTarget = position * GRID_HEIGHT - containerRef.current.clientHeight / 2;
      containerRef.current.scrollTop = Math.max(0, scrollTarget);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3">
        <h2 className="text-lg font-semibold text-zinc-100 capitalize">
          {dateLabel}
        </h2>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto relative">
        <div className="relative" style={{ height: GRID_HEIGHT }}>
          {/* Hour lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-zinc-800"
              style={{ top: hour * HOUR_HEIGHT }}
            >
              <span className="absolute -top-3 left-2 text-xs text-zinc-500">
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>
          ))}

          {/* Events */}
          {events.map((event) => {
            const pos = calculateEventPosition(event, GRID_HEIGHT);
            return (
              <div
                key={event.id}
                className="absolute left-12 right-2"
                style={{ top: pos.top, height: pos.height }}
              >
                <CalendarEvent event={event} compact onClick={openDrawer} />
              </div>
            );
          })}

          {/* Current time indicator */}
          <CurrentTimeIndicator />
        </div>
      </div>
    </div>
  );
}
