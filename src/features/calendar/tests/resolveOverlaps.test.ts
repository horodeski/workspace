import { resolveOverlaps } from '../services/resolveOverlaps';
import { CalendarEventType } from '../types/calendar.types';

function makeEvent(overrides: Partial<CalendarEventType> = {}): CalendarEventType {
  return {
    id: crypto.randomUUID(),
    title: 'Test Event',
    description: '',
    startTime: '2024-01-15T09:00:00.000Z',
    endTime: '2024-01-15T10:00:00.000Z',
    category: 'work',
    color: '#3b82f6',
    status: 'pending',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('resolveOverlaps', () => {
  it('returns empty array for empty input', () => {
    const result = resolveOverlaps([]);
    expect(result).toEqual([]);
  });

  it('assigns single event to column 0 with full width', () => {
    const event = makeEvent();
    const result = resolveOverlaps([event]);

    expect(result).toHaveLength(1);
    expect(result[0].column).toBe(0);
    expect(result[0].totalColumns).toBe(1);
    expect(result[0].widthPercent).toBe(100);
    expect(result[0].leftPercent).toBe(0);
  });

  it('places two overlapping events in separate columns with 50% width', () => {
    const event1 = makeEvent({
      startTime: '2024-01-15T09:00:00.000Z',
      endTime: '2024-01-15T10:00:00.000Z',
    });
    const event2 = makeEvent({
      startTime: '2024-01-15T09:30:00.000Z',
      endTime: '2024-01-15T10:30:00.000Z',
    });

    const result = resolveOverlaps([event1, event2]);

    expect(result).toHaveLength(2);
    expect(result[0].totalColumns).toBe(2);
    expect(result[1].totalColumns).toBe(2);
    expect(result[0].widthPercent).toBe(50);
    expect(result[1].widthPercent).toBe(50);
    // They should be in different columns
    const columns = result.map((r) => r.column);
    expect(new Set(columns).size).toBe(2);
  });

  it('places two non-overlapping events in the same column', () => {
    const event1 = makeEvent({
      startTime: '2024-01-15T09:00:00.000Z',
      endTime: '2024-01-15T10:00:00.000Z',
    });
    const event2 = makeEvent({
      startTime: '2024-01-15T11:00:00.000Z',
      endTime: '2024-01-15T12:00:00.000Z',
    });

    const result = resolveOverlaps([event1, event2]);

    expect(result).toHaveLength(2);
    expect(result[0].column).toBe(0);
    expect(result[1].column).toBe(0);
    expect(result[0].totalColumns).toBe(1);
    expect(result[1].totalColumns).toBe(1);
    expect(result[0].widthPercent).toBe(100);
    expect(result[1].widthPercent).toBe(100);
  });

  it('handles three events with partial overlap correctly', () => {
    // Event A: 9:00-10:30
    // Event B: 9:30-10:00 (overlaps A)
    // Event C: 10:00-11:00 (overlaps A but not B)
    const eventA = makeEvent({
      startTime: '2024-01-15T09:00:00.000Z',
      endTime: '2024-01-15T10:30:00.000Z',
    });
    const eventB = makeEvent({
      startTime: '2024-01-15T09:30:00.000Z',
      endTime: '2024-01-15T10:00:00.000Z',
    });
    const eventC = makeEvent({
      startTime: '2024-01-15T10:00:00.000Z',
      endTime: '2024-01-15T11:00:00.000Z',
    });

    const result = resolveOverlaps([eventA, eventB, eventC]);

    expect(result).toHaveLength(3);

    const posA = result.find((r) => r.event.id === eventA.id)!;
    const posB = result.find((r) => r.event.id === eventB.id)!;
    const posC = result.find((r) => r.event.id === eventC.id)!;

    // A is longest starting first, so gets column 0
    expect(posA.column).toBe(0);
    // B overlaps with A, so gets column 1
    expect(posB.column).toBe(1);
    // C starts at 10:00, B ends at 10:00 so C can fit in column 1
    expect(posC.column).toBe(1);
    // Total columns should be 2 (A in col 0, B and C share col 1)
    expect(posA.totalColumns).toBe(2);
    expect(posB.totalColumns).toBe(2);
    expect(posC.totalColumns).toBe(2);
  });
});
