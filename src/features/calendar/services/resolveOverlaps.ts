import { parseISO, compareAsc, differenceInMinutes } from 'date-fns';
import { CalendarEventType } from '../types/calendar.types';

export interface PositionedEvent {
  event: CalendarEventType;
  column: number;
  totalColumns: number;
  widthPercent: number;
  leftPercent: number;
}

export function resolveOverlaps(events: CalendarEventType[]): PositionedEvent[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) => {
    const startDiff = compareAsc(parseISO(a.startTime), parseISO(b.startTime));
    if (startDiff !== 0) return startDiff;
    return (
      differenceInMinutes(parseISO(b.endTime), parseISO(b.startTime)) -
      differenceInMinutes(parseISO(a.endTime), parseISO(a.startTime))
    );
  });

  const columns: CalendarEventType[][] = [];

  for (const event of sorted) {
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const lastInCol = columns[col][columns[col].length - 1];
      if (parseISO(lastInCol.endTime) <= parseISO(event.startTime)) {
        columns[col].push(event);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([event]);
    }
  }

  const totalColumns = columns.length;
  const result: PositionedEvent[] = [];

  for (let col = 0; col < columns.length; col++) {
    for (const event of columns[col]) {
      result.push({
        event,
        column: col,
        totalColumns,
        widthPercent: 100 / totalColumns,
        leftPercent: (col / totalColumns) * 100,
      });
    }
  }

  return result;
}
