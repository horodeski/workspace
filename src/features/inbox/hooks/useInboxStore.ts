import { create } from 'zustand';
import { InboxTask } from '../types/inbox.types';

interface InboxState {
  tasks: InboxTask[];
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  editTask: (id: string, text: string) => void;
  removeTask: (id: string) => void;
}

export const useInboxStore = create<InboxState>((set) => ({
  tasks: [],

  addTask: (text: string) => {
    const now = new Date().toISOString();
    const newTask: InboxTask = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      tasks: [newTask, ...state.tasks],
    }));
  },

  toggleTask: (id: string) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() }
          : task
      ),
    }));
  },

  editTask: (id: string, text: string) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? { ...task, text, updatedAt: new Date().toISOString() }
          : task
      ),
    }));
  },

  removeTask: (id: string) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));
  },
}));
