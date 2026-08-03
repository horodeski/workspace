import { useSupportCardStore } from '../hooks/useRoutineStore';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    del: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('useSupportCardStore', () => {
  beforeEach(() => {
    useSupportCardStore.setState({ entries: [], formattedText: '', isLoading: false, error: null });
    jest.clearAllMocks();
  });

  describe('fetchEntries', () => {
    it('should fetch entries from API and update state', async () => {
      const mockEntries = [
        { id: '1', date: '03/02', description: 'Task 1', duration: '1h', observation: '', attachments: [], createdAt: '2024-01-01T00:00:00Z' },
      ];
      mockedApi.get.mockResolvedValueOnce(mockEntries);

      await useSupportCardStore.getState().fetchEntries();

      expect(mockedApi.get).toHaveBeenCalledWith('/support-entries');
      const { entries, isLoading } = useSupportCardStore.getState();
      expect(entries).toEqual(mockEntries);
      expect(isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Network error'));

      await useSupportCardStore.getState().fetchEntries();

      const { error, isLoading } = useSupportCardStore.getState();
      expect(error).toBe('Network error');
      expect(isLoading).toBe(false);
    });
  });

  describe('addEntry', () => {
    it('should POST to API and refetch entries', async () => {
      const newEntry = { date: '03/02', description: 'Ajudei o Heitor', duration: '2h', observation: '' };
      const mockEntries = [
        { id: '1', date: '03/02', description: 'Ajudei o Heitor', duration: '2h', observation: '', attachments: [], createdAt: '2024-01-01T00:00:00Z' },
      ];
      mockedApi.post.mockResolvedValueOnce({ id: '1', ...newEntry });
      mockedApi.get.mockResolvedValueOnce(mockEntries);

      await useSupportCardStore.getState().addEntry(newEntry);

      expect(mockedApi.post).toHaveBeenCalledWith('/support-entries', newEntry);
      expect(mockedApi.get).toHaveBeenCalledWith('/support-entries');
      const { entries } = useSupportCardStore.getState();
      expect(entries).toEqual(mockEntries);
    });

    it('should set error on failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Failed to add'));

      await useSupportCardStore.getState().addEntry({ date: '03/02', description: 'X', duration: '1h', observation: '' });

      const { error } = useSupportCardStore.getState();
      expect(error).toBe('Failed to add');
    });
  });

  describe('removeEntry', () => {
    it('should DELETE via API and refetch entries', async () => {
      mockedApi.del.mockResolvedValueOnce(undefined);
      mockedApi.get.mockResolvedValueOnce([]);

      await useSupportCardStore.getState().removeEntry('entry-1');

      expect(mockedApi.del).toHaveBeenCalledWith('/support-entries/entry-1');
      expect(mockedApi.get).toHaveBeenCalledWith('/support-entries');
      const { entries } = useSupportCardStore.getState();
      expect(entries).toEqual([]);
    });

    it('should set error on failure', async () => {
      mockedApi.del.mockRejectedValueOnce(new Error('Not found'));

      await useSupportCardStore.getState().removeEntry('entry-1');

      const { error } = useSupportCardStore.getState();
      expect(error).toBe('Not found');
    });
  });

  describe('clearEntries', () => {
    it('should POST to clear endpoint and refetch entries', async () => {
      mockedApi.post.mockResolvedValueOnce(undefined);
      mockedApi.get.mockResolvedValueOnce([]);

      await useSupportCardStore.getState().clearEntries();

      expect(mockedApi.post).toHaveBeenCalledWith('/support-entries/clear');
      expect(mockedApi.get).toHaveBeenCalledWith('/support-entries');
      const { entries } = useSupportCardStore.getState();
      expect(entries).toEqual([]);
    });

    it('should set error on failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Server error'));

      await useSupportCardStore.getState().clearEntries();

      const { error } = useSupportCardStore.getState();
      expect(error).toBe('Server error');
    });
  });

  describe('getFormattedText', () => {
    it('should fetch formatted text from API', async () => {
      mockedApi.get.mockResolvedValueOnce({ text: '03/02\nTask 1 por 1h.' });

      const result = await useSupportCardStore.getState().getFormattedText();

      expect(mockedApi.get).toHaveBeenCalledWith('/support-entries/formatted-text');
      expect(result).toBe('03/02\nTask 1 por 1h.');
      expect(useSupportCardStore.getState().formattedText).toBe('03/02\nTask 1 por 1h.');
    });

    it('should return empty string on failure', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Failed'));

      const result = await useSupportCardStore.getState().getFormattedText();

      expect(result).toBe('');
      expect(useSupportCardStore.getState().error).toBe('Failed');
    });
  });

  describe('getAllAttachments', () => {
    it('should return empty array when entries have no attachments', () => {
      useSupportCardStore.setState({
        entries: [
          { id: '1', date: '03/02', description: 'Task', duration: '1h', observation: '', attachments: [], createdAt: '2024-01-01T00:00:00Z' },
        ],
      });

      const result = useSupportCardStore.getState().getAllAttachments();
      expect(result).toEqual([]);
    });

    it('should collect all attachments across entries', () => {
      const attachment = { id: 'a1', name: 'file.pdf', type: 'application/pdf', size: 1024, dataUrl: 'data:...' };
      useSupportCardStore.setState({
        entries: [
          { id: '1', date: '03/02', description: 'Task', duration: '1h', observation: '', attachments: [attachment], createdAt: '2024-01-01T00:00:00Z' },
        ],
      });

      const result = useSupportCardStore.getState().getAllAttachments();
      expect(result).toHaveLength(1);
      expect(result[0].attachment).toEqual(attachment);
    });
  });
});
