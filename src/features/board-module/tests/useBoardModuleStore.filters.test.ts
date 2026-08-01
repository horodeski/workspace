import { useBoardModuleStore } from '../hooks/useBoardModuleStore';

// Reset store state before each test
beforeEach(() => {
  useBoardModuleStore.setState(useBoardModuleStore.getInitialState());
});

describe('useBoardModuleStore - Filters', () => {
  describe('getActiveFilter', () => {
    it('returns "all" as default filter for any board', () => {
      const { getActiveFilter } = useBoardModuleStore.getState();
      expect(getActiveFilter()).toBe('all');
    });

    it('returns "all" when activeBoardId is null', () => {
      useBoardModuleStore.setState({ activeBoardId: null });
      const { getActiveFilter } = useBoardModuleStore.getState();
      expect(getActiveFilter()).toBe('all');
    });

    it('returns the filter for the active board after setFilter', () => {
      const { boards, setFilter } = useBoardModuleStore.getState();
      const boardId = boards[0].id;

      setFilter(boardId, 'quote');

      const { getActiveFilter } = useBoardModuleStore.getState();
      expect(getActiveFilter()).toBe('quote');
    });
  });

  describe('setFilter', () => {
    it('updates the filter for a specific board', () => {
      const { boards, setFilter } = useBoardModuleStore.getState();
      const boardId = boards[0].id;

      setFilter(boardId, 'image');

      const { filters } = useBoardModuleStore.getState();
      expect(filters[boardId]).toBe('image');
    });

    it('can set different filter values', () => {
      const { boards, setFilter } = useBoardModuleStore.getState();
      const boardId = boards[0].id;

      setFilter(boardId, 'link');
      expect(useBoardModuleStore.getState().filters[boardId]).toBe('link');

      useBoardModuleStore.getState().setFilter(boardId, 'note');
      expect(useBoardModuleStore.getState().filters[boardId]).toBe('note');
    });
  });

  describe('filter independence per board', () => {
    it('preserves filters independently for each board', () => {
      const { createBoard } = useBoardModuleStore.getState();
      createBoard('Second Board');

      const { boards, setFilter } = useBoardModuleStore.getState();
      const firstBoardId = boards[0].id;
      const secondBoardId = boards[1].id;

      // Set different filters for each board
      setFilter(firstBoardId, 'quote');
      useBoardModuleStore.getState().setFilter(secondBoardId, 'image');

      // Switch to first board and verify its filter
      useBoardModuleStore.getState().setActiveBoard(firstBoardId);
      expect(useBoardModuleStore.getState().getActiveFilter()).toBe('quote');

      // Switch to second board and verify its filter
      useBoardModuleStore.getState().setActiveBoard(secondBoardId);
      expect(useBoardModuleStore.getState().getActiveFilter()).toBe('image');

      // Switch back to first board - filter should still be preserved
      useBoardModuleStore.getState().setActiveBoard(firstBoardId);
      expect(useBoardModuleStore.getState().getActiveFilter()).toBe('quote');
    });

    it('returns "all" for a board that has no filter set', () => {
      const { createBoard } = useBoardModuleStore.getState();
      createBoard('Second Board');

      const { boards, setFilter } = useBoardModuleStore.getState();
      const firstBoardId = boards[0].id;
      const secondBoardId = boards[1].id;

      // Set filter only for first board
      setFilter(firstBoardId, 'note');

      // Second board should still return 'all'
      useBoardModuleStore.getState().setActiveBoard(secondBoardId);
      expect(useBoardModuleStore.getState().getActiveFilter()).toBe('all');
    });
  });
});
