import { z } from 'zod';

export interface InboxTask {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export const inboxTaskSchema = z.object({
  text: z
    .string()
    .min(1, 'O texto é obrigatório')
    .max(200, 'O texto deve ter no máximo 200 caracteres')
    .refine(
      (val) => val.trim().length > 0,
      'O texto não pode conter apenas espaços'
    ),
});

export type InboxTaskFormData = z.infer<typeof inboxTaskSchema>;
