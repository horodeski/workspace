import { create } from 'zustand';
import { api } from '@/lib/api';
import { SupportEntry, Attachment } from '../types/routine.types';

interface SupportCardState {
  entries: SupportEntry[];
  formattedText: string;
  isLoading: boolean;
  error: string | null;
  fetchEntries: () => Promise<void>;
  addEntry: (data: { date: string; description: string; duration: string; observation: string }) => Promise<void>;
  updateEntry: (id: string, data: { date?: string; description?: string; duration?: string; observation?: string }) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  clearEntries: () => Promise<void>;
  getFormattedText: () => Promise<string>;
  getAllAttachments: () => { entry: SupportEntry; attachment: Attachment }[];
}

export const useSupportCardStore = create<SupportCardState>()((set, get) => ({
  entries: [],
  formattedText: '',
  isLoading: false,
  error: null,

  fetchEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const entries = await api.get<SupportEntry[]>('/support-entries');
      set({ entries, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch entries', isLoading: false });
    }
  },

  addEntry: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/support-entries', data);
      await get().fetchEntries();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to add entry', isLoading: false });
    }
  },

  updateEntry: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.patch(`/support-entries/${id}`, data);
      await get().fetchEntries();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update entry', isLoading: false });
    }
  },

  removeEntry: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.del(`/support-entries/${id}`);
      await get().fetchEntries();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to remove entry', isLoading: false });
    }
  },

  clearEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/support-entries/clear');
      await get().fetchEntries();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to clear entries', isLoading: false });
    }
  },

  getFormattedText: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.get<{ text: string }>('/support-entries/formatted-text');
      set({ formattedText: result.text, isLoading: false });
      return result.text;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to get formatted text', isLoading: false });
      return '';
    }
  },

  getAllAttachments: () => {
    const { entries } = get();
    const result: { entry: SupportEntry; attachment: Attachment }[] = [];
    for (const entry of entries) {
      for (const attachment of entry.attachments ?? []) {
        result.push({ entry, attachment });
      }
    }
    return result;
  },
}));
