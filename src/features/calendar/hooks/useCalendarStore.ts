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
  format,
} from 'date-fns';
import {
  CalendarEventType,
  CalendarEventFormData,
  ViewMode,
  Activity,
  ActivityFormData,
  ActivityAttachment,
} from '../types/calendar.types';

interface CalendarState {
  selectedDate: Date;
  viewMode: ViewMode;
  isExpanded: boolean;
  selectedEvent: CalendarEventType | null;
  isDrawerOpen: boolean;
  selectedActivity: Activity | null;
  isActivityDetailOpen: boolean;
  events: CalendarEventType[];
  activities: Activity[];
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
  // Activity actions
  addActivity: (data: ActivityFormData) => void;
  updateActivity: (id: string, data: Partial<Activity>) => void;
  toggleActivity: (id: string) => void;
  removeActivity: (id: string) => void;
  getActivitiesForDate: (date: Date) => Activity[];
  openActivityDetail: (activity: Activity) => void;
  closeActivityDetail: () => void;
  addAttachment: (activityId: string, attachment: ActivityAttachment) => void;
  removeAttachment: (activityId: string, attachmentId: string) => void;
}

export const useCalendarStore = create<CalendarState & CalendarActions>(
  (set, get) => ({
    // State
    selectedDate: new Date(),
    viewMode: 'day',
    isExpanded: false,
    selectedEvent: null,
    isDrawerOpen: false,
    selectedActivity: null,
    isActivityDetailOpen: false,
    events: [],
    activities: [],

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
        default:
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
        default:
          set({ selectedDate: subMonths(selectedDate, 1) });
          break;
      }
    },

    // Activity actions
    addActivity: (data: ActivityFormData) => {
      const now = new Date().toISOString();
      const newActivity: Activity = {
        id: crypto.randomUUID(),
        title: data.title,
        description: data.description || '',
        completed: false,
        date: data.date,
        startTime: data.startTime || null,
        duration: data.duration || null,
        recurrence: data.recurrence || 'weekday',
        priority: data.priority || null,
        attachments: [],
        createdAt: now,
        updatedAt: now,
      };

      set((state) => ({
        activities: [...state.activities, newActivity],
      }));
    },

    updateActivity: (id: string, data: Partial<Activity>) => {
      set((state) => ({
        activities: state.activities.map((a) =>
          a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
        ),
        selectedActivity:
          state.selectedActivity?.id === id
            ? { ...state.selectedActivity, ...data, updatedAt: new Date().toISOString() }
            : state.selectedActivity,
      }));
    },

    toggleActivity: (id: string) => {
      set((state) => ({
        activities: state.activities.map((a) =>
          a.id === id ? { ...a, completed: !a.completed, updatedAt: new Date().toISOString() } : a
        ),
        selectedActivity:
          state.selectedActivity?.id === id
            ? { ...state.selectedActivity, completed: !state.selectedActivity.completed, updatedAt: new Date().toISOString() }
            : state.selectedActivity,
      }));
    },

    removeActivity: (id: string) => {
      set((state) => ({
        activities: state.activities.filter((a) => a.id !== id),
        selectedActivity: state.selectedActivity?.id === id ? null : state.selectedActivity,
        isActivityDetailOpen: state.selectedActivity?.id === id ? false : state.isActivityDetailOpen,
      }));
    },

    getActivitiesForDate: (date: Date) => {
      const { activities } = get();
      const dateStr = format(date, 'yyyy-MM-dd');

      return activities.filter((a) => {
        // Direct match
        if (a.date === dateStr) return true;

        // Recurrence logic: only show if activity date is on or before the target date
        const activityDate = new Date(a.date + 'T00:00:00');
        if (activityDate > date) return false;

        switch (a.recurrence) {
          case 'weekday': {
            // Monday (1) to Friday (5)
            const dayOfWeek = date.getDay();
            return dayOfWeek >= 1 && dayOfWeek <= 5;
          }
          case 'daily':
            return true;
          case 'weekly': {
            return activityDate.getDay() === date.getDay();
          }
          case 'monthly': {
            return activityDate.getDate() === date.getDate();
          }
          default:
            return false;
        }
      });
    },

    openActivityDetail: (activity: Activity) => {
      set({ selectedActivity: activity, isActivityDetailOpen: true });
    },

    closeActivityDetail: () => {
      set({ isActivityDetailOpen: false });
    },

    addAttachment: (activityId: string, attachment: ActivityAttachment) => {
      set((state) => ({
        activities: state.activities.map((a) =>
          a.id === activityId
            ? { ...a, attachments: [...a.attachments, attachment], updatedAt: new Date().toISOString() }
            : a
        ),
        selectedActivity:
          state.selectedActivity?.id === activityId
            ? { ...state.selectedActivity, attachments: [...state.selectedActivity.attachments, attachment], updatedAt: new Date().toISOString() }
            : state.selectedActivity,
      }));
    },

    removeAttachment: (activityId: string, attachmentId: string) => {
      set((state) => ({
        activities: state.activities.map((a) =>
          a.id === activityId
            ? { ...a, attachments: a.attachments.filter((att) => att.id !== attachmentId), updatedAt: new Date().toISOString() }
            : a
        ),
        selectedActivity:
          state.selectedActivity?.id === activityId
            ? { ...state.selectedActivity, attachments: state.selectedActivity.attachments.filter((att) => att.id !== attachmentId), updatedAt: new Date().toISOString() }
            : state.selectedActivity,
      }));
    },
  })
);
