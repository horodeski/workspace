import { z } from 'zod';

export type Frequency = 'daily' | 'weekly' | 'sprint';

export interface Routine {
  id: string;
  title: string;
  frequency: Frequency;
  completed: boolean;
  createdAt: string; // ISO 8601
}

export const routineSchema = z.object({
  title: z
    .string()
    .min(1, 'O título é obrigatório')
    .max(100, 'O título deve ter no máximo 100 caracteres')
    .refine((val) => val.trim().length > 0, 'O título não pode conter apenas espaços'),
  frequency: z.enum(['daily', 'weekly', 'sprint']),
});

export type RoutineFormData = z.infer<typeof routineSchema>;
