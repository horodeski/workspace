import { useSupportCardStore } from '../hooks/useRoutineStore';

describe('useSupportCardStore', () => {
  beforeEach(() => {
    useSupportCardStore.setState({ entries: [] });
  });

  describe('addEntry', () => {
    it('should add a new entry with correct fields', () => {
      const { addEntry } = useSupportCardStore.getState();

      addEntry({
        date: '03/02',
        description: 'Ajudei o Heitor a subir o ambiente',
        duration: '2h',
        observation: 'foto da ligação',
      });

      const { entries } = useSupportCardStore.getState();
      expect(entries).toHaveLength(1);
      expect(entries[0].date).toBe('03/02');
      expect(entries[0].description).toBe('Ajudei o Heitor a subir o ambiente');
      expect(entries[0].duration).toBe('2h');
      expect(entries[0].observation).toBe('foto da ligação');
      expect(entries[0].id).toBeDefined();
      expect(entries[0].createdAt).toBeDefined();
    });

    it('should generate unique IDs for each entry', () => {
      const { addEntry } = useSupportCardStore.getState();

      addEntry({ date: '03/02', description: 'Task 1', duration: '1h', observation: '' });
      addEntry({ date: '04/02', description: 'Task 2', duration: '30min', observation: '' });

      const { entries } = useSupportCardStore.getState();
      expect(entries[0].id).not.toBe(entries[1].id);
    });
  });

  describe('removeEntry', () => {
    it('should remove an entry by id', () => {
      const { addEntry } = useSupportCardStore.getState();
      addEntry({ date: '03/02', description: 'Task 1', duration: '1h', observation: '' });
      addEntry({ date: '04/02', description: 'Task 2', duration: '2h', observation: '' });

      const { entries } = useSupportCardStore.getState();
      const idToRemove = entries[0].id;

      useSupportCardStore.getState().removeEntry(idToRemove);

      const updated = useSupportCardStore.getState().entries;
      expect(updated).toHaveLength(1);
      expect(updated[0].description).toBe('Task 2');
    });
  });

  describe('clearEntries', () => {
    it('should remove all entries', () => {
      const { addEntry } = useSupportCardStore.getState();
      addEntry({ date: '03/02', description: 'Task 1', duration: '1h', observation: '' });
      addEntry({ date: '04/02', description: 'Task 2', duration: '2h', observation: '' });

      useSupportCardStore.getState().clearEntries();

      const { entries } = useSupportCardStore.getState();
      expect(entries).toHaveLength(0);
    });
  });

  describe('getFormattedText', () => {
    it('should return empty string when no entries', () => {
      const text = useSupportCardStore.getState().getFormattedText();
      expect(text).toBe('');
    });

    it('should format a single entry without observation', () => {
      const { addEntry } = useSupportCardStore.getState();
      addEntry({ date: '03/02', description: 'Ajudei o Heitor', duration: '2h', observation: '' });

      const text = useSupportCardStore.getState().getFormattedText();
      expect(text).toBe('03/02\nAjudei o Heitor por 2h.');
    });

    it('should format a single entry with observation', () => {
      const { addEntry } = useSupportCardStore.getState();
      addEntry({
        date: '03/02',
        description: 'Ajudei o Heitor a subir o ambiente',
        duration: '2h',
        observation: 'foto da ligação',
      });

      const text = useSupportCardStore.getState().getFormattedText();
      expect(text).toBe('03/02\nAjudei o Heitor a subir o ambiente por 2h.\nfoto da ligação');
    });

    it('should separate multiple entries with double newlines', () => {
      const { addEntry } = useSupportCardStore.getState();
      addEntry({ date: '03/02', description: 'Task 1', duration: '1h', observation: '' });
      addEntry({ date: '04/02', description: 'Task 2', duration: '30min', observation: 'nota' });

      const text = useSupportCardStore.getState().getFormattedText();
      expect(text).toBe('03/02\nTask 1 por 1h.\n\n04/02\nTask 2 por 30min.\nnota');
    });
  });
});
