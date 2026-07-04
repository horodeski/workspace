import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { CalendarEventType } from '../types/calendar.types';

interface CalendarEventProps {
  event: CalendarEventType;
  compact?: boolean;
  onClick: (event: CalendarEventType) => void;
}

export function CalendarEvent({ event, compact = false, onClick }: CalendarEventProps) {
  const startFormatted = format(parseISO(event.startTime), 'HH:mm');
  const endFormatted = format(parseISO(event.endTime), 'HH:mm');

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick(event)}
      className="rounded-md px-2 py-1 cursor-pointer overflow-hidden border-l-4"
      style={{
        backgroundColor: `${event.color}20`,
        borderLeftColor: event.color,
      }}
    >
      <p className="text-sm font-medium truncate text-zinc-100">{event.title}</p>
      {!compact && (
        <p className="text-xs text-zinc-400">
          {startFormatted} - {endFormatted}
        </p>
      )}
    </motion.div>
  );
}
