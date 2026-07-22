import { z } from 'zod';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // base64 data URL para persistência
}

export interface SupportEntry {
  id: string;
  date: string; // formato DD/MM
  description: string;
  duration: string; // ex: "2h", "30min"
  observation: string;
  attachments: Attachment[];
  createdAt: string; // ISO 8601
}

export const supportEntrySchema = z.object({
  date: z
    .string()
    .min(1, 'A data é obrigatória')
    .regex(/^\d{2}\/\d{2}$/, 'Use o formato DD/MM'),
  description: z
    .string()
    .min(1, 'A descrição é obrigatória')
    .max(200, 'A descrição deve ter no máximo 200 caracteres'),
  duration: z
    .string()
    .min(1, 'A duração é obrigatória')
    .max(20, 'A duração deve ter no máximo 20 caracteres'),
  observation: z.string().max(300, 'A observação deve ter no máximo 300 caracteres').optional().default(''),
});

export type SupportEntryFormData = z.infer<typeof supportEntrySchema>;
