import { create } from 'zustand';

import { JournalEntry } from '../../journal/types/journal.types';
import { Report, ReportPeriod, ReportSection } from '../types/report.types';

interface ReportState {
  selectedPeriod: ReportPeriod;
  setSelectedPeriod: (period: ReportPeriod) => void;
  generateReport: (entries: JournalEntry[], period: ReportPeriod) => Report;
}

function getPeriodTitle(period: ReportPeriod): string {
  switch (period) {
    case 'today':
      return 'Hoje';
    case 'week':
      return 'Última Semana';
    case 'sprint':
      return 'Sprint';
  }
}

function isWithinPeriod(entryDate: string, period: ReportPeriod): boolean {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryTime = new Date(entryDate).getTime();

  switch (period) {
    case 'today': {
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      return entryTime >= todayStart.getTime() && entryTime < todayEnd.getTime();
    }
    case 'week': {
      const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      return entryTime >= weekStart.getTime() && entryTime < todayEnd.getTime();
    }
    case 'sprint': {
      const sprintStart = new Date(todayStart.getTime() - 13 * 24 * 60 * 60 * 1000);
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      return entryTime >= sprintStart.getTime() && entryTime < todayEnd.getTime();
    }
  }
}

function getDateKey(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useReportStore = create<ReportState>((set) => ({
  selectedPeriod: 'today',

  setSelectedPeriod: (period: ReportPeriod) => set({ selectedPeriod: period }),

  generateReport: (entries: JournalEntry[], period: ReportPeriod): Report => {
    const filteredEntries = entries.filter((entry) =>
      isWithinPeriod(entry.createdAt, period)
    );

    const groupedByDate = new Map<string, JournalEntry[]>();

    for (const entry of filteredEntries) {
      const dateKey = getDateKey(entry.createdAt);
      const existing = groupedByDate.get(dateKey) || [];
      existing.push(entry);
      groupedByDate.set(dateKey, existing);
    }

    const sections: ReportSection[] = Array.from(groupedByDate.entries())
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(([date, sectionEntries]) => ({
        date,
        entries: sectionEntries,
      }));

    return {
      period,
      title: getPeriodTitle(period),
      sections,
      generatedAt: new Date().toISOString(),
    };
  },
}));
