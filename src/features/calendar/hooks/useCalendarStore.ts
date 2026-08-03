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
import { api } from '@/lib/api';

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
  monthActivities: Activity[];
  isLoading: boolean;
  error: string | null;
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
  // Activity actions (async, API-backed)
  fetchActivitiesForDate: (date: Date) => Promise<void>;
  addActivity: (data: ActivityFormData) => Promise<void>;
  updateActivity: (id: string, data: Partial<Activity>) => Promise<void>;
  toggleActivity: (id: string) => Promise<void>;
  removeActivity: (id: string) => Promise<void>;
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
    monthActivities: [],
    isLoading: false,
    error: null,

    // Actions
    setSelectedDate: (date: Date) => {
      set({ selectedDate: date });
      get().fetchActivitiesForDate(date);
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
        return eventStart <= rangeEnd && eventEnd >= rangeStart;
      });
    },

    goToToday: () => {
      const today = new Date();
      set({ selectedDate: today });
      get().fetchActivitiesForDate(today);
    },

    navigateForward: () => {
      const { selectedDate, viewMode } = get();
      let newDate: Date;
      switch (viewMode) {
        case 'day':
          newDate = addDays(selectedDate, 1);
          break;
        case 'week':
          newDate = addDays(selectedDate, 7);
          break;
        case 'month':
        default:
          newDate = addMonths(selectedDate, 1);
          break;
      }
      set({ selectedDate: newDate });
      get().fetchActivitiesForDate(newDate);
    },

    navigateBack: () => {
      const { selectedDate, viewMode } = get();
      let newDate: Date;
      switch (viewMode) {
        case 'day':
          newDate = subDays(selectedDate, 1);
          break;
        case 'week':
          newDate = subDays(selectedDate, 7);
          break;
        case 'month':
        default:
          newDate = subMonths(selectedDate, 1);
          break;
      }
      set({ selectedDate: newDate });
      get().fetchActivitiesForDate(newDate);
    },

    // Activity actions (async, API-backed)
    fetchActivitiesForDate: async (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      set({ isLoading: true, error: null });
      try {
        const raw = await api.get<(Activity & { completedOnDate?: boolean })[]>(`/activities?date=${dateStr}`);
        // Map backend field `completedOnDate` to frontend field `completed`
        const activities = raw.map((a) => ({
          ...a,
          completed: a.completedOnDate ?? a.completed ?? false,
          attachments: a.attachments ?? [],
        }));
        set({ activities, isLoading: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch activities';
        set({ error: message, isLoading: false });
      }
    },

    fetchActivitiesForMonth: async (month: Date) => {
      const start = format(startOfMonth(month), 'yyyy-MM-dd');
      const end = format(endOfMonth(month), 'yyyy-MM-dd');
      try {
        const raw = await api.get<(Activity & { completedOnDate?: boolean })[]>(`/activities?startDate=${start}&endDate=${end}`);
        const monthActivities = raw.map((a) => ({
          ...a,
          completed: a.completedOnDate ?? a.completed ?? false,
          attachments: a.attachments ?? [],
        }));
        set({ monthActivities });
      } catch {
        // Silently fail — month view is supplementary
      }
    },

    addActivity: async (data: ActivityFormData) => {
      set({ isLoading: true, error: null });
      try {
        await api.post('/activities', data);
        const { selectedDate } = get();
        await get().fetchActivitiesForDate(selectedDate);
        await (get() as any).fetchActivitiesForMonth(selectedDate);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add activity';
        set({ error: message, isLoading: false });
      }
    },

    updateActivity: async (id: string, data: Partial<Activity>) => {
      set({ isLoading: true, error: null });
      try {
        await api.put(`/activities/${id}`, data);
        const { selectedDate } = get();
        await get().fetchActivitiesForDate(selectedDate);
        await (get() as any).fetchActivitiesForMonth(selectedDate);
        // Update selectedActivity if it's the one being edited
        const { selectedActivity, activities } = get();
        if (selectedActivity?.id === id) {
          const updated = activities.find((a) => a.id === id);
          if (updated) set({ selectedActivity: updated });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update activity';
        set({ error: message, isLoading: false });
      }
    },

    toggleActivity: async (id: string) => {
      const { selectedDate } = get();
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      set({ isLoading: true, error: null });
      try {
        await api.patch(`/activities/${id}/toggle`, { date: dateStr });
        await get().fetchActivitiesForDate(selectedDate);
        await (get() as any).fetchActivitiesForMonth(selectedDate);
        // Update selectedActivity if it's the one being toggled
        const { selectedActivity, activities } = get();
        if (selectedActivity?.id === id) {
          const updated = activities.find((a) => a.id === id);
          if (updated) set({ selectedActivity: updated });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to toggle activity';
        set({ error: message, isLoading: false });
      }
    },

    removeActivity: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await api.del(`/activities/${id}`);
        const { selectedDate, selectedActivity } = get();
        await get().fetchActivitiesForDate(selectedDate);
        await (get() as any).fetchActivitiesForMonth(selectedDate);
        if (selectedActivity?.id === id) {
          set({ selectedActivity: null, isActivityDetailOpen: false });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove activity';
        set({ error: message, isLoading: false });
      }
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
