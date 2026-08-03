import { calculateEventPosition } from '../services/eventPositioning';
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

describe('calculateEventPosition', () => {
  it('positions a single event at 9:00-10:00 with gridHeight 960 (40px/hour)', () => {
    const event = makeEvent({
      startTime: '2024-01-15T09:00:00.000Z',
      endTime: '2024-01-15T10:00:00.000Z',
    });

    const result = calculateEventPosition(event, 960);

    expect(result.top).toBe(9 * 40); // 360
    expect(result.height).toBe(1 * 40); // 40
  });

  it('enforces minimum height of 20px for very short events', () => {
    // 5-minute event at 40px/hour = ~3.3px raw height, should become 20
    const event = makeEvent({
      startTime: '2024-01-15T09:00:00.000Z',
      endTime: '2024-01-15T09:05:00.000Z',
    });

    const result = calculateEventPosition(event, 960);

    expect(result.height).toBeGreaterThanOrEqual(20);
    expect(result.minHeight).toBe(20);
  });

  it('positions an event at midnight (00:00-01:00) with top 0', () => {
    const event = makeEvent({
      startTime: '2024-01-15T00:00:00.000Z',
      endTime: '2024-01-15T01:00:00.000Z',
    });

    const result = calculateEventPosition(event, 960);

    expect(result.top).toBe(0);
    expect(result.height).toBe(40); // 1 hour * 40px/hour
  });

  it('calculates proportional height for multi-hour events', () => {
    // 3-hour event: 9:00-12:00
    const event = makeEvent({
      startTime: '2024-01-15T09:00:00.000Z',
      endTime: '2024-01-15T12:00:00.000Z',
    });

    const result = calculateEventPosition(event, 960);

    expect(result.top).toBe(9 * 40); // 360
    expect(result.height).toBe(3 * 40); // 120
  });
});
