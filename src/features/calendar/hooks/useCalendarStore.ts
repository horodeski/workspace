import { create } from 'zustand';
import {
  addDays,
  subDays,
  addMonths,
  subMonths,
  parseISO,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import {
  CalendarEventType,
  CalendarEventFormData,
  ViewMode,
} from '../types/calendar.types';

interface CalendarState {
  selectedDate: Date;
  viewMode: ViewMode;
  isExpanded: boolean;
  selectedEvent: CalendarEventType | null;
  isDrawerOpen: boolean;
  events: CalendarEventType[];
}

interface CalendarActions {
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleExpanded: () => void;
  setSelectedEvent: (event: CalendarEventType | null) => void;
  openDrawer: (event: CalendarEventType) => void;
  closeDrawer: () => void;
  addEvent: (data: CalendarEventFormData) => void;
  updateEvent: (id: string, data: Partial<CalendarEventFormData>) => void;
  removeEvent: (id: string) => void;
  getEventsForDate: (date: Date) => CalendarEventType[];
  getEventsForWeek: (weekStart: Date) => CalendarEventType[];
  getEventsForMonth: (month: Date) => CalendarEventType[];
  goToToday: () => void;
  navigateForward: () => void;
  navigateBack: () => void;
}

export const useCalendarStore = create<CalendarState & CalendarActions>(
  (set, get) => ({
    // State
    selectedDate: new Date(),
    viewMode: 'day',
    isExpanded: false,
    selectedEvent: null,
    isDrawerOpen: false,
    events: [],

    // Actions
    setSelectedDate: (date: Date) => {
      set({ selectedDate: date });
    },

    setViewMode: (mode: ViewMode) => {
      set({ viewMode: mode });
    },

    toggleExpanded: () => {
      set((state) => ({ isExpanded: !state.isExpanded }));
    },

    setSelectedEvent: (event: CalendarEventType | null) => {
      set({ selectedEvent: event });
    },

    openDrawer: (event: CalendarEventType) => {
      set({ selectedEvent: event, isDrawerOpen: true });
    },

    closeDrawer: () => {
      set({ selectedEvent: null, isDrawerOpen: false });
    },

    addEvent: (data: CalendarEventFormData) => {
      const now = new Date().toISOString();
      const newEvent: CalendarEventType = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => ({
        events: [...state.events, newEvent],
      }));
    },

    updateEvent: (id: string, data: Partial<CalendarEventFormData>) => {
      const { events } = get();
      const eventIndex = events.findIndex((e) => e.id === id);

      if (eventIndex === -1) {
        // Event not found — no-op, close drawer
        set({ selectedEvent: null, isDrawerOpen: false });
        return;
      }

      const updatedEvent: CalendarEventType = {
        ...events[eventIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        events: state.events.map((e) => (e.id === id ? updatedEvent : e)),
        selectedEvent: null,
        isDrawerOpen: false,
      }));
    },

    removeEvent: (id: string) => {
      const { selectedEvent } = get();

      set((state) => {
        const newState: Partial<CalendarState> = {
          events: state.events.filter((e) => e.id !== id),
        };

        // If the removed event is the selected event, close drawer
        if (selectedEvent && selectedEvent.id === id) {
          newState.selectedEvent = null;
          newState.isDrawerOpen = false;
        }

        return newState;
      });
    },

    getEventsForDate: (date: Date) => {
      const { events } = get();
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      return events.filter((event) => {
        const eventStart = parseISO(event.startTime);
        const eventEnd = parseISO(event.endTime);
        // Event intersects with the day if it starts before day ends AND ends after day starts
        return eventStart <= dayEnd && eventEnd >= dayStart;
      });
    },

    getEventsForWeek: (weekStart: Date) => {
      const { events } = get();
      const rangeStart = startOfDay(weekStart);
      const rangeEnd = endOfDay(addDays(weekStart, 6));

      return events.filter((event) => {
        const eventStart = parseISO(event.startTime);
        const eventEnd = parseISO(event.endTime);
        // Event intersects with the week range
        return eventStart <= rangeEnd && eventEnd >= rangeStart;
      });
    },

    getEventsForMonth: (month: Date) => {
      const { events } = get();
      const rangeStart = startOfMonth(month);
      const rangeEnd = endOfMonth(month);

      return events.filter((event) => {
        const eventStart = parseISO(event.startTime);
        const eventEnd = parseISO(event.endTime);
        // Event intersects with the month range
        return eventStart <= rangeEnd && eventEnd >= rangeStart;
      });
    },

    goToToday: () => {
      set({ selectedDate: new Date() });
    },

    navigateForward: () => {
      const { selectedDate, viewMode } = get();

      switch (viewMode) {
        case 'day':
          set({ selectedDate: addDays(selectedDate, 1) });
          break;
        case 'week':
          set({ selectedDate: addDays(selectedDate, 7) });
          break;
        case 'month':
          set({ selectedDate: addMonths(selectedDate, 1) });
          break;
      }
    },

    navigateBack: () => {
      const { selectedDate, viewMode } = get();

      switch (viewMode) {
        case 'day':
          set({ selectedDate: subDays(selectedDate, 1) });
          break;
        case 'week':
          set({ selectedDate: subDays(selectedDate, 7) });
          break;
        case 'month':
          set({ selectedDate: subMonths(selectedDate, 1) });
          break;
      }
    },
  })
);
