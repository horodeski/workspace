import { z } from 'zod';

export interface JournalEntry {
  id: string;
  rawText: string;
  formattedText: string;
  createdAt: string; // ISO 8601
}

export const journalEntrySchema = z.object({
  rawText: z
    .string()
    .min(1, 'O texto é obrigatório')
    .refine((val) => val.trim().length > 0, 'O texto não pode conter apenas espaços'),
});

export type JournalEntryFormData = z.infer<typeof journalEntrySchema>;
