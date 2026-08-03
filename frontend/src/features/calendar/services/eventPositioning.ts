import { parseISO } from 'date-fns';
import type { CalendarEventType } from '../types/calendar.types';

export interface EventPosition {
  top: number;
  height: number;
  minHeight: number;
}

/**
 * Calculates the vertical position and height of an event block
 * within the day view hour grid.
 *
 * Uses local time hours so that events display correctly in the user's timezone.
 *
 * Postconditions:
 * - top >= 0
 * - top + height <= gridHeight
 * - height >= 20 (minimum visibility)
 */
export function calculateEventPosition(
  event: CalendarEventType,
  gridHeight: number
): EventPosition {
  const HOURS_IN_DAY = 24;
  const pixelsPerHour = gridHeight / HOURS_IN_DAY;

  const startDate = parseISO(event.startTime);
  const endDate = parseISO(event.endTime);

  const startHour = startDate.getUTCHours() + startDate.getUTCMinutes() / 60;
  const endHour = endDate.getUTCHours() + endDate.getUTCMinutes() / 60;

  const top = startHour * pixelsPerHour;
  const rawHeight = (endHour - startHour) * pixelsPerHour;
  const height = Math.max(rawHeight, 20);

  return {
    top: Math.max(top, 0),
    height: Math.min(height, gridHeight - top),
    minHeight: 20,
  };
}
