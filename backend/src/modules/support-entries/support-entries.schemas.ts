import { z } from 'zod';

export const createSupportEntrySchema = z.object({
  date: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, 'Data deve estar no formato DD/MM'),
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(200, 'Descrição deve ter no máximo 200 caracteres'),
  duration: z
    .string()
    .min(1, 'Duração é obrigatória')
    .max(20, 'Duração deve ter no máximo 20 caracteres'),
  observation: z
    .string()
    .max(300, 'Observação deve ter no máximo 300 caracteres')
    .default(''),
});

export type CreateSupportEntryInput = z.infer<typeof createSupportEntrySchema>;

export const updateSupportEntrySchema = z.object({
  date: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, 'Data deve estar no formato DD/MM')
    .optional(),
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .optional(),
  duration: z
    .string()
    .min(1, 'Duração é obrigatória')
    .max(20, 'Duração deve ter no máximo 20 caracteres')
    .optional(),
  observation: z
    .string()
    .max(300, 'Observação deve ter no máximo 300 caracteres')
    .optional(),
});

export type UpdateSupportEntryInput = z.infer<typeof updateSupportEntrySchema>;
