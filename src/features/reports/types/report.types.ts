import { JournalEntry } from '../../journal/types/journal.types';

export type ReportPeriod = 'today' | 'week' | 'sprint';

export interface ReportSection {
  date: string; // ISO 8601 date (YYYY-MM-DD)
  entries: JournalEntry[];
}

export interface Report {
  period: ReportPeriod;
  title: string;
  sections: ReportSection[];
  generatedAt: string; // ISO 8601
}
