import { useReportStore } from '../hooks/useReportStore';
import { JournalEntry } from '../../journal/types/journal.types';

describe('useReportStore', () => {
  beforeEach(() => {
    useReportStore.setState({ selectedPeriod: 'today' });
  });

  describe('selectedPeriod', () => {
    it('should default to "today"', () => {
      const state = useReportStore.getState();
      expect(state.selectedPeriod).toBe('today');
    });

    it('should update selectedPeriod via setSelectedPeriod', () => {
      const { setSelectedPeriod } = useReportStore.getState();
      setSelectedPeriod('week');
      expect(useReportStore.getState().selectedPeriod).toBe('week');

      setSelectedPeriod('sprint');
      expect(useReportStore.getState().selectedPeriod).toBe('sprint');
    });
  });

  describe('generateReport', () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
    const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);

    const entries: JournalEntry[] = [
      {
        id: '1',
        rawText: 'Worked on feature A',
        formattedText: 'Implemented feature A',
        createdAt: today.toISOString(),
      },
      {
        id: '2',
        rawText: 'Fixed bug B',
        formattedText: 'Resolved bug B',
        createdAt: yesterday.toISOString(),
      },
      {
        id: '3',
        rawText: 'Code review',
        formattedText: 'Conducted code review',
        createdAt: threeDaysAgo.toISOString(),
      },
      {
        id: '4',
        rawText: 'Old task',
        formattedText: 'Completed old task',
        createdAt: eightDaysAgo.toISOString(),
      },
      {
        id: '5',
        rawText: 'Very old task',
        formattedText: 'Completed very old task',
        createdAt: fifteenDaysAgo.toISOString(),
      },
    ];

    it('should filter entries for "today" period (only current day)', () => {
      const { generateReport } = useReportStore.getState();
      const report = generateReport(entries, 'today');

      expect(report.period).toBe('today');
      expect(report.title).toBe('Hoje');
      expect(report.sections).toHaveLength(1);
      expect(report.sections[0].entries).toHaveLength(1);
      expect(report.sections[0].entries[0].id).toBe('1');
    });

    it('should filter entries for "week" period (last 7 days)', () => {
      const { generateReport } = useReportStore.getState();
      const report = generateReport(entries, 'week');

      expect(report.period).toBe('week');
      expect(report.title).toBe('Última Semana');
      // today, yesterday, threeDaysAgo are within 7 days
      const allEntries = report.sections.flatMap((s) => s.entries);
      expect(allEntries).toHaveLength(3);
      expect(allEntries.map((e) => e.id)).toContain('1');
      expect(allEntries.map((e) => e.id)).toContain('2');
      expect(allEntries.map((e) => e.id)).toContain('3');
    });

    it('should filter entries for "sprint" period (last 14 days)', () => {
      const { generateReport } = useReportStore.getState();
      const report = generateReport(entries, 'sprint');

      expect(report.period).toBe('sprint');
      expect(report.title).toBe('Sprint');
      // today, yesterday, threeDaysAgo, eightDaysAgo are within 14 days
      const allEntries = report.sections.flatMap((s) => s.entries);
      expect(allEntries).toHaveLength(4);
      expect(allEntries.map((e) => e.id)).not.toContain('5');
    });

    it('should group entries by date', () => {
      const { generateReport } = useReportStore.getState();
      const report = generateReport(entries, 'week');

      // Each entry on a different day -> 3 sections
      expect(report.sections).toHaveLength(3);
      for (const section of report.sections) {
        expect(section.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('should sort sections by date descending (most recent first)', () => {
      const { generateReport } = useReportStore.getState();
      const report = generateReport(entries, 'week');

      for (let i = 0; i < report.sections.length - 1; i++) {
        expect(report.sections[i].date >= report.sections[i + 1].date).toBe(true);
      }
    });

    it('should return empty sections when no entries match', () => {
      const { generateReport } = useReportStore.getState();
      const report = generateReport([], 'today');

      expect(report.sections).toHaveLength(0);
      expect(report.period).toBe('today');
      expect(report.title).toBe('Hoje');
    });

    it('should include generatedAt in the report', () => {
      const { generateReport } = useReportStore.getState();
      const report = generateReport(entries, 'today');

      expect(report.generatedAt).toBeDefined();
      expect(new Date(report.generatedAt).toISOString()).toBe(report.generatedAt);
    });

    it('should group multiple entries on the same day together', () => {
      const sameDayEntries: JournalEntry[] = [
        {
          id: 'a',
          rawText: 'Morning task',
          formattedText: 'Completed morning task',
          createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0).toISOString(),
        },
        {
          id: 'b',
          rawText: 'Afternoon task',
          formattedText: 'Completed afternoon task',
          createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0).toISOString(),
        },
      ];

      const { generateReport } = useReportStore.getState();
      const report = generateReport(sameDayEntries, 'today');

      expect(report.sections).toHaveLength(1);
      expect(report.sections[0].entries).toHaveLength(2);
    });
  });
});
