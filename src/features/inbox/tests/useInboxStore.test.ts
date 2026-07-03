import { useInboxStore } from '../hooks/useInboxStore';

describe('useInboxStore', () => {
  beforeEach(() => {
    useInboxStore.setState({ tasks: [] });
  });

  describe('addTask', () => {
    it('should add a new task at the beginning of the list', () => {
      const { addTask } = useInboxStore.getState();

      addTask('First task');
      addTask('Second task');

      const { tasks } = useInboxStore.getState();
      expect(tasks).toHaveLength(2);
      expect(tasks[0].text).toBe('Second task');
      expect(tasks[1].text).toBe('First task');
    });

    it('should create a task with correct default values', () => {
      const { addTask } = useInboxStore.getState();

      addTask('My task');

      const { tasks } = useInboxStore.getState();
      expect(tasks[0].text).toBe('My task');
      expect(tasks[0].completed).toBe(false);
      expect(tasks[0].id).toBeDefined();
      expect(tasks[0].createdAt).toBeDefined();
      expect(tasks[0].updatedAt).toBeDefined();
    });

    it('should generate unique IDs for each task', () => {
      const { addTask } = useInboxStore.getState();

      addTask('Task A');
      addTask('Task B');

      const { tasks } = useInboxStore.getState();
      expect(tasks[0].id).not.toBe(tasks[1].id);
    });
  });

  describe('toggleTask', () => {
    it('should toggle a task from incomplete to complete', () => {
      const { addTask } = useInboxStore.getState();
      addTask('Toggle me');

      const taskId = useInboxStore.getState().tasks[0].id;
      useInboxStore.getState().toggleTask(taskId);

      const { tasks } = useInboxStore.getState();
      expect(tasks[0].completed).toBe(true);
    });

    it('should toggle a task back to incomplete', () => {
      const { addTask } = useInboxStore.getState();
      addTask('Toggle me twice');

      const taskId = useInboxStore.getState().tasks[0].id;
      useInboxStore.getState().toggleTask(taskId);
      useInboxStore.getState().toggleTask(taskId);

      const { tasks } = useInboxStore.getState();
      expect(tasks[0].completed).toBe(false);
    });

    it('should update updatedAt when toggling', () => {
      const { addTask } = useInboxStore.getState();
      addTask('Check timestamp');

      const taskId = useInboxStore.getState().tasks[0].id;
      const originalUpdatedAt = useInboxStore.getState().tasks[0].updatedAt;

      // Small delay to ensure different timestamp
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);
      useInboxStore.getState().toggleTask(taskId);
      jest.useRealTimers();

      const { tasks } = useInboxStore.getState();
      expect(tasks[0].updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('editTask', () => {
    it('should update the text of an existing task', () => {
      const { addTask } = useInboxStore.getState();
      addTask('Original text');

      const taskId = useInboxStore.getState().tasks[0].id;
      useInboxStore.getState().editTask(taskId, 'Updated text');

      const { tasks } = useInboxStore.getState();
      expect(tasks[0].text).toBe('Updated text');
    });

    it('should update updatedAt when editing', () => {
      const { addTask } = useInboxStore.getState();
      addTask('Edit me');

      const taskId = useInboxStore.getState().tasks[0].id;
      const originalUpdatedAt = useInboxStore.getState().tasks[0].updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);
      useInboxStore.getState().editTask(taskId, 'Edited');
      jest.useRealTimers();

      const { tasks } = useInboxStore.getState();
      expect(tasks[0].updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should not affect other tasks when editing', () => {
      const { addTask } = useInboxStore.getState();
      addTask('Task A');
      addTask('Task B');

      const tasks = useInboxStore.getState().tasks;
      const taskBId = tasks[1].id;
      useInboxStore.getState().editTask(taskBId, 'Task B edited');

      const updatedTasks = useInboxStore.getState().tasks;
      expect(updatedTasks[0].text).toBe('Task B');
      expect(updatedTasks[1].text).toBe('Task B edited');
    });
  });

  describe('removeTask', () => {
    it('should remove a task from the list', () => {
      const { addTask } = useInboxStore.getState();
      addTask('Remove me');

      const taskId = useInboxStore.getState().tasks[0].id;
      useInboxStore.getState().removeTask(taskId);

      const { tasks } = useInboxStore.getState();
      expect(tasks).toHaveLength(0);
    });

    it('should only remove the specified task', () => {
      const { addTask } = useInboxStore.getState();
      addTask('Keep me');
      addTask('Remove me');

      const tasks = useInboxStore.getState().tasks;
      const removeId = tasks[0].id; // "Remove me" is first (newest)
      useInboxStore.getState().removeTask(removeId);

      const updatedTasks = useInboxStore.getState().tasks;
      expect(updatedTasks).toHaveLength(1);
      expect(updatedTasks[0].text).toBe('Keep me');
    });
  });
});
