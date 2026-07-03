import { useRoutineStore } from '../hooks/useRoutineStore';

describe('useRoutineStore', () => {
  beforeEach(() => {
    useRoutineStore.setState({ routines: [] });
  });

  describe('addRoutine', () => {
    it('should add a new routine with correct fields', () => {
      const { addRoutine } = useRoutineStore.getState();

      addRoutine('Daily standup', 'daily');

      const { routines } = useRoutineStore.getState();
      expect(routines).toHaveLength(1);
      expect(routines[0].title).toBe('Daily standup');
      expect(routines[0].frequency).toBe('daily');
      expect(routines[0].completed).toBe(false);
      expect(routines[0].id).toBeDefined();
      expect(routines[0].createdAt).toBeDefined();
    });

    it('should generate unique IDs for each routine', () => {
      const { addRoutine } = useRoutineStore.getState();

      addRoutine('Task 1', 'daily');
      addRoutine('Task 2', 'weekly');

      const { routines } = useRoutineStore.getState();
      expect(routines[0].id).not.toBe(routines[1].id);
    });
  });

  describe('toggleRoutine', () => {
    it('should toggle a routine from pending to completed', () => {
      const { addRoutine } = useRoutineStore.getState();
      addRoutine('Code review', 'daily');

      const { routines } = useRoutineStore.getState();
      const id = routines[0].id;

      useRoutineStore.getState().toggleRoutine(id);

      const updated = useRoutineStore.getState().routines[0];
      expect(updated.completed).toBe(true);
    });

    it('should toggle a routine from completed back to pending', () => {
      const { addRoutine } = useRoutineStore.getState();
      addRoutine('Code review', 'daily');

      const { routines } = useRoutineStore.getState();
      const id = routines[0].id;

      useRoutineStore.getState().toggleRoutine(id);
      useRoutineStore.getState().toggleRoutine(id);

      const updated = useRoutineStore.getState().routines[0];
      expect(updated.completed).toBe(false);
    });
  });

  describe('removeRoutine', () => {
    it('should remove a routine by id', () => {
      const { addRoutine } = useRoutineStore.getState();
      addRoutine('Task 1', 'daily');
      addRoutine('Task 2', 'weekly');

      const { routines } = useRoutineStore.getState();
      const idToRemove = routines[0].id;

      useRoutineStore.getState().removeRoutine(idToRemove);

      const updated = useRoutineStore.getState().routines;
      expect(updated).toHaveLength(1);
      expect(updated[0].title).toBe('Task 2');
    });

    it('should not affect other routines when removing one', () => {
      const { addRoutine } = useRoutineStore.getState();
      addRoutine('Task 1', 'daily');
      addRoutine('Task 2', 'weekly');
      addRoutine('Task 3', 'sprint');

      const { routines } = useRoutineStore.getState();
      const idToRemove = routines[1].id;

      useRoutineStore.getState().removeRoutine(idToRemove);

      const updated = useRoutineStore.getState().routines;
      expect(updated).toHaveLength(2);
      expect(updated[0].title).toBe('Task 1');
      expect(updated[1].title).toBe('Task 3');
    });
  });
});
