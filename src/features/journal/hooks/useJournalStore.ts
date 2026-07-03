import { create } from 'zustand';
import { JournalEntry } from '../types/journal.types';
import { ReportPeriod } from '../../reports/types/report.types';

interface JournalState {
  entries: JournalEntry[];
  addEntry: (rawText: string, formattedText: string) => void;
  getEntriesByPeriod: (period: ReportPeriod) => JournalEntry[];
}

function getStartOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getPeriodStartDate(period: ReportPeriod): Date {
  const now = new Date();
  const startOfToday = getStartOfDay(now);

  switch (period) {
    case 'today':
      return startOfToday;
    case 'week':
      return new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
    case 'sprint':
      return new Date(startOfToday.getTime() - 13 * 24 * 60 * 60 * 1000);
  }
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],

  addEntry: (rawText: string, formattedText: string) => {
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      rawText,
      formattedText,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      entries: [newEntry, ...state.entries],
    }));
  },

  getEntriesByPeriod: (period: ReportPeriod): JournalEntry[] => {
    const periodStart = getPeriodStartDate(period);
    const { entries } = get();

    return entries.filter((entry) => {
      const entryDate = new Date(entry.createdAt);
      return entryDate >= periodStart;
    });
  },
}));
