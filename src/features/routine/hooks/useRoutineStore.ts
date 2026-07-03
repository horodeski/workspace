import { create } from 'zustand';
import { Routine, Frequency } from '../types/routine.types';

interface RoutineState {
  routines: Routine[];
  addRoutine: (title: string, frequency: Frequency) => void;
  toggleRoutine: (id: string) => void;
  removeRoutine: (id: string) => void;
}

export const useRoutineStore = create<RoutineState>((set) => ({
  routines: [],

  addRoutine: (title: string, frequency: Frequency) => {
    const newRoutine: Routine = {
      id: crypto.randomUUID(),
      title,
      frequency,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      routines: [...state.routines, newRoutine],
    }));
  },

  toggleRoutine: (id: string) => {
    set((state) => ({
      routines: state.routines.map((routine) =>
        routine.id === id
          ? { ...routine, completed: !routine.completed }
          : routine
      ),
    }));
  },

  removeRoutine: (id: string) => {
    set((state) => ({
      routines: state.routines.filter((routine) => routine.id !== id),
    }));
  },
}));
