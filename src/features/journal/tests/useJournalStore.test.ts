import { useJournalStore } from '../hooks/useJournalStore';

describe('useJournalStore', () => {
  beforeEach(() => {
    useJournalStore.setState({ entries: [] });
  });

  describe('addEntry', () => {
    it('should add a new entry with rawText and formattedText preserved', () => {
      const { addEntry } = useJournalStore.getState();

      addEntry('fiz deploy hoje', '• Fiz deploy hoje');

      const { entries } = useJournalStore.getState();
      expect(entries).toHaveLength(1);
      expect(entries[0].rawText).toBe('fiz deploy hoje');
      expect(entries[0].formattedText).toBe('• Fiz deploy hoje');
      expect(entries[0].id).toBeDefined();
      expect(entries[0].createdAt).toBeDefined();
    });

    it('should insert new entries at the beginning (newest first)', () => {
      const { addEntry } = useJournalStore.getState();

      addEntry('primeira entrada', 'Primeira entrada formatada');
      addEntry('segunda entrada', 'Segunda entrada formatada');

      const { entries } = useJournalStore.getState();
      expect(entries).toHaveLength(2);
      expect(entries[0].rawText).toBe('segunda entrada');
      expect(entries[1].rawText).toBe('primeira entrada');
    });

    it('should preserve rawText exactly as provided regardless of formattedText', () => {
      const { addEntry } = useJournalStore.getState();
      const rawText = '  texto com espaços   e  formatação estranha  ';
      const formattedText = '• Texto com espaços e formatação estranha';

      addEntry(rawText, formattedText);

      const { entries } = useJournalStore.getState();
      expect(entries[0].rawText).toBe(rawText);
      expect(entries[0].formattedText).toBe(formattedText);
    });

    it('should generate unique IDs for each entry', () => {
      const { addEntry } = useJournalStore.getState();

      addEntry('entrada 1', 'Formatada 1');
      addEntry('entrada 2', 'Formatada 2');

      const { entries } = useJournalStore.getState();
      expect(entries[0].id).not.toBe(entries[1].id);
    });
  });

  describe('getEntriesByPeriod', () => {
    it('should return entries from today when period is "today"', () => {
      const { addEntry } = useJournalStore.getState();
      addEntry('entry today', 'Formatted today');

      const { getEntriesByPeriod } = useJournalStore.getState();
      const result = getEntriesByPeriod('today');

      expect(result).toHaveLength(1);
      expect(result[0].rawText).toBe('entry today');
    });

    it('should filter out entries older than today for period "today"', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);

      useJournalStore.setState({
        entries: [
          {
            id: '1',
            rawText: 'old entry',
            formattedText: 'Old entry formatted',
            createdAt: yesterday.toISOString(),
          },
        ],
      });

      const { getEntriesByPeriod } = useJournalStore.getState();
      const result = getEntriesByPeriod('today');

      expect(result).toHaveLength(0);
    });

    it('should return entries from last 7 days for period "week"', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const tenDaysAgo = new Date(now);
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      useJournalStore.setState({
        entries: [
          {
            id: '1',
            rawText: 'recent entry',
            formattedText: 'Recent formatted',
            createdAt: threeDaysAgo.toISOString(),
          },
          {
            id: '2',
            rawText: 'old entry',
            formattedText: 'Old formatted',
            createdAt: tenDaysAgo.toISOString(),
          },
        ],
      });

      const { getEntriesByPeriod } = useJournalStore.getState();
      const result = getEntriesByPeriod('week');

      expect(result).toHaveLength(1);
      expect(result[0].rawText).toBe('recent entry');
    });

    it('should return entries from last 14 days for period "sprint"', () => {
      const now = new Date();
      const tenDaysAgo = new Date(now);
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const twentyDaysAgo = new Date(now);
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

      useJournalStore.setState({
        entries: [
          {
            id: '1',
            rawText: 'within sprint',
            formattedText: 'Formatted within sprint',
            createdAt: tenDaysAgo.toISOString(),
          },
          {
            id: '2',
            rawText: 'outside sprint',
            formattedText: 'Formatted outside sprint',
            createdAt: twentyDaysAgo.toISOString(),
          },
        ],
      });

      const { getEntriesByPeriod } = useJournalStore.getState();
      const result = getEntriesByPeriod('sprint');

      expect(result).toHaveLength(1);
      expect(result[0].rawText).toBe('within sprint');
    });

    it('should return entries ordered from most recent to oldest', () => {
      const { addEntry } = useJournalStore.getState();

      addEntry('first', 'First formatted');
      addEntry('second', 'Second formatted');
      addEntry('third', 'Third formatted');

      const { getEntriesByPeriod } = useJournalStore.getState();
      const result = getEntriesByPeriod('today');

      expect(result[0].rawText).toBe('third');
      expect(result[1].rawText).toBe('second');
      expect(result[2].rawText).toBe('first');
    });
  });
});
