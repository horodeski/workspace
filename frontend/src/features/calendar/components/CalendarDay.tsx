import { useRef, useEffect } from 'react';
import { CalendarEventType } from '../types/calendar.types';
import { calculateEventPosition } from '../services/eventPositioning';
import { resolveOverlaps } from '../services/resolveOverlaps';
import { CalendarEvent } from './CalendarEvent';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { getCurrentTimePosition } from '../hooks/useCurrentTime';
import { useCalendarStore } from '../hooks/useCalendarStore';

interface CalendarDayProps {
  date: Date;
  events: CalendarEventType[];
}

const HOUR_HEIGHT = 48;
const GRID_HEIGHT = HOUR_HEIGHT * 24;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function CalendarDay({ date: _date, events }: CalendarDayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const openDrawer = useCalendarStore((state) => state.openDrawer);
  const positionedEvents = resolveOverlaps(events);

  useEffect(() => {
    if (containerRef.current) {
      const position = getCurrentTimePosition() / 100;
      const scrollTarget = position * GRID_HEIGHT - containerRef.current.clientHeight / 2;
      containerRef.current.scrollTop = Math.max(0, scrollTarget);
    }
  }, []);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto relative">
      <div className="relative" style={{ height: GRID_HEIGHT }}>
        {/* Hour lines with labels */}
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

        {/* Positioned events */}
        {positionedEvents.map(({ event, widthPercent, leftPercent }) => {
          const pos = calculateEventPosition(event, GRID_HEIGHT);
          return (
            <div
              key={event.id}
              className="absolute"
              style={{
                top: pos.top,
                height: pos.height,
                left: `calc(3rem + ${leftPercent}% * (100% - 3rem) / 100)`,
                width: `calc(${widthPercent}% * (100% - 3rem) / 100)`,
              }}
            >
              <CalendarEvent event={event} onClick={openDrawer} />
            </div>
          );
        })}

        {/* Current time indicator */}
        <CurrentTimeIndicator />
      </div>
    </div>
  );
}
