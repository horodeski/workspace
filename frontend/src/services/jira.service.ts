import type { SupportEntry } from '../features/routine/types/routine.types';

export interface JiraTask {
  id: string;
  key: string;
  summary: string;
  status: string;
}

export interface JiraService {
  getMyTasks(): Promise<JiraTask[]>;
  syncRoutines(routines: SupportEntry[]): Promise<void>;
}
