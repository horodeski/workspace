import { useCalendarStore } from '../hooks/useCalendarStore';

const validEventData = {
  title: 'Test Meeting',
  description: 'Test description',
  startTime: '2024-01-15T09:00:00.000Z',
  endTime: '2024-01-15T10:00:00.000Z',
  category: 'meeting' as const,
  color: '#3b82f6',
  status: 'pending' as const,
};

beforeEach(() => {
  useCalendarStore.setState({
    selectedDate: new Date('2024-01-15'),
    viewMode: 'day',
    isExpanded: false,
    selectedEvent: null,
    isDrawerOpen: false,
    selectedActivity: null,
    isActivityDetailOpen: false,
    events: [],
    activities: [],
  });
});

describe('useCalendarStore', () => {
  describe('addEvent', () => {
    it('creates event with valid data, increases events.length by 1, event has id/createdAt/updatedAt', () => {
      const { addEvent } = useCalendarStore.getState();

      addEvent(validEventData);

      const { events } = useCalendarStore.getState();
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Test Meeting');
      expect(events[0].description).toBe('Test description');
      expect(events[0].startTime).toBe('2024-01-15T09:00:00.000Z');
      expect(events[0].endTime).toBe('2024-01-15T10:00:00.000Z');
      expect(events[0].category).toBe('meeting');
      expect(events[0].color).toBe('#3b82f6');
      expect(events[0].status).toBe('pending');
      expect(events[0].id).toBeDefined();
      expect(events[0].createdAt).toBeDefined();
      expect(events[0].updatedAt).toBeDefined();
    });
  });

  describe('updateEvent', () => {
    it('updates an existing event title, refreshes updatedAt, leaves other events unchanged', () => {
      const { addEvent } = useCalendarStore.getState();
      addEvent(validEventData);
      addEvent({ ...validEventData, title: 'Other Event' });

      const { events } = useCalendarStore.getState();
      const targetId = events[0].id;
      const otherEvent = events[1];
      const originalUpdatedAt = events[0].updatedAt;

      // Small delay to ensure updatedAt changes
      jest.useFakeTimers();
      jest.advanceTimersByTime(10);

      useCalendarStore.getState().updateEvent(targetId, { title: 'Updated Title' });

      const updated = useCalendarStore.getState().events;
      expect(updated).toHaveLength(2);
      expect(updated.find((e) => e.id === targetId)!.title).toBe('Updated Title');
      expect(updated.find((e) => e.id === targetId)!.updatedAt).not.toBe(originalUpdatedAt);
      // Other event unchanged
      expect(updated.find((e) => e.id === otherEvent.id)).toEqual(otherEvent);

      jest.useRealTimers();
    });

    it('with non-existent id: no-op, closes drawer', () => {
      const { addEvent } = useCalendarStore.getState();
      addEvent(validEventData);

      const { events } = useCalendarStore.getState();
      const originalEvents = [...events];

      // Open drawer to verify it closes
      useCalendarStore.setState({ isDrawerOpen: true, selectedEvent: events[0] });

      useCalendarStore.getState().updateEvent('non-existent-id', { title: 'Nope' });

      const state = useCalendarStore.getState();
      expect(state.events).toHaveLength(originalEvents.length);
      expect(state.isDrawerOpen).toBe(false);
      expect(state.selectedEvent).toBeNull();
    });
  });

  describe('removeEvent', () => {
    it('removes event by id, decreases events.length by 1', () => {
      const { addEvent } = useCalendarStore.getState();
      addEvent(validEventData);
      addEvent({ ...validEventData, title: 'Second Event' });

      const { events } = useCalendarStore.getState();
      expect(events).toHaveLength(2);

      useCalendarStore.getState().removeEvent(events[0].id);

      const updated = useCalendarStore.getState().events;
      expect(updated).toHaveLength(1);
      expect(updated[0].title).toBe('Second Event');
    });

    it('closes drawer if selected event is removed', () => {
      const { addEvent } = useCalendarStore.getState();
      addEvent(validEventData);

      const { events } = useCalendarStore.getState();
      const event = events[0];

      // Open drawer with that event
      useCalendarStore.getState().openDrawer(event);
      expect(useCalendarStore.getState().isDrawerOpen).toBe(true);
      expect(useCalendarStore.getState().selectedEvent).toEqual(event);

      // Remove the selected event
      useCalendarStore.getState().removeEvent(event.id);

      const state = useCalendarStore.getState();
      expect(state.events).toHaveLength(0);
      expect(state.isDrawerOpen).toBe(false);
      expect(state.selectedEvent).toBeNull();
    });
  });

  describe('navigateForward', () => {
    it('in day mode: adds 1 day', () => {
      useCalendarStore.setState({ viewMode: 'day', selectedDate: new Date('2024-01-15') });

      useCalendarStore.getState().navigateForward();

      const { selectedDate } = useCalendarStore.getState();
      expect(selectedDate.toISOString().slice(0, 10)).toBe('2024-01-16');
    });

    it('in week mode: adds 7 days', () => {
      useCalendarStore.setState({ viewMode: 'week', selectedDate: new Date('2024-01-15') });

      useCalendarStore.getState().navigateForward();

      const { selectedDate } = useCalendarStore.getState();
      expect(selectedDate.toISOString().slice(0, 10)).toBe('2024-01-22');
    });

    it('in month mode: adds 1 month', () => {
      useCalendarStore.setState({ viewMode: 'month', selectedDate: new Date('2024-01-15') });

      useCalendarStore.getState().navigateForward();

      const { selectedDate } = useCalendarStore.getState();
      expect(selectedDate.getMonth()).toBe(1); // February
      expect(selectedDate.getFullYear()).toBe(2024);
    });
  });

  describe('navigateBack', () => {
    it('in day mode: subtracts 1 day', () => {
      useCalendarStore.setState({ viewMode: 'day', selectedDate: new Date('2024-01-15') });

      useCalendarStore.getState().navigateBack();

      const { selectedDate } = useCalendarStore.getState();
      expect(selectedDate.toISOString().slice(0, 10)).toBe('2024-01-14');
    });
  });

  describe('goToToday', () => {
    it('resets selectedDate to today', () => {
      useCalendarStore.setState({ selectedDate: new Date('2020-05-01') });

      useCalendarStore.getState().goToToday();

      const { selectedDate } = useCalendarStore.getState();
      const today = new Date();
      expect(selectedDate.toISOString().slice(0, 10)).toBe(today.toISOString().slice(0, 10));
    });
  });

  describe('getEventsForDate', () => {
    it('returns correct events for a specific date', () => {
      const { addEvent } = useCalendarStore.getState();

      // Event on Jan 15 at noon local time (avoids timezone edge cases)
      const jan15Noon = new Date(2024, 0, 15, 12, 0, 0);
      const jan15NoonEnd = new Date(2024, 0, 15, 13, 0, 0);
      const jan16Noon = new Date(2024, 0, 16, 12, 0, 0);
      const jan16NoonEnd = new Date(2024, 0, 16, 13, 0, 0);

      addEvent({
        ...validEventData,
        startTime: jan15Noon.toISOString(),
        endTime: jan15NoonEnd.toISOString(),
      });
      addEvent({
        ...validEventData,
        title: 'Tomorrow Event',
        startTime: jan16Noon.toISOString(),
        endTime: jan16NoonEnd.toISOString(),
      });

      const result = useCalendarStore.getState().getEventsForDate(new Date(2024, 0, 15));
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Meeting');
    });
  });

  describe('openDrawer / closeDrawer', () => {
    it('openDrawer sets isDrawerOpen to true and selectedEvent', () => {
      const { addEvent } = useCalendarStore.getState();
      addEvent(validEventData);

      const { events } = useCalendarStore.getState();
      const event = events[0];

      useCalendarStore.getState().openDrawer(event);

      const state = useCalendarStore.getState();
      expect(state.isDrawerOpen).toBe(true);
      expect(state.selectedEvent).toEqual(event);
    });

    it('closeDrawer sets isDrawerOpen to false and selectedEvent to null', () => {
      const { addEvent } = useCalendarStore.getState();
      addEvent(validEventData);

      const { events } = useCalendarStore.getState();
      useCalendarStore.getState().openDrawer(events[0]);

      useCalendarStore.getState().closeDrawer();

      const state = useCalendarStore.getState();
      expect(state.isDrawerOpen).toBe(false);
      expect(state.selectedEvent).toBeNull();
    });
  });

  describe('toggleExpanded', () => {
    it('toggles isExpanded without changing viewMode', () => {
      useCalendarStore.setState({ isExpanded: false, viewMode: 'week' });

      useCalendarStore.getState().toggleExpanded();

      const state = useCalendarStore.getState();
      expect(state.isExpanded).toBe(true);
      expect(state.viewMode).toBe('week');

      useCalendarStore.getState().toggleExpanded();

      const state2 = useCalendarStore.getState();
      expect(state2.isExpanded).toBe(false);
      expect(state2.viewMode).toBe('week');
    });
  });

  describe('setViewMode', () => {
    it('changes viewMode without changing isExpanded', () => {
      useCalendarStore.setState({ viewMode: 'day', isExpanded: true });

      useCalendarStore.getState().setViewMode('month');

      const state = useCalendarStore.getState();
      expect(state.viewMode).toBe('month');
      expect(state.isExpanded).toBe(true);
    });
  });
});
