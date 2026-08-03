import { z } from 'zod';

// --- Shared field schemas ---

const titleSchema = z
  .string()
  .min(1, 'O título é obrigatório')
  .max(200, 'O título deve ter no máximo 200 caracteres')
  .transform((t) => t.trim())
  .pipe(z.string().min(1, 'O título não pode ser apenas espaços em branco'));

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD');

const startTimeSchema = z
  .union([
    z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:mm'),
    z.literal('').transform(() => null),
    z.null(),
  ])
  .optional();

const durationSchema = z
  .number()
  .int('Duração deve ser um número inteiro')
  .positive('Duração deve ser um número positivo')
  .nullable()
  .optional();

const recurrenceSchema = z.enum(['none', 'weekday', 'daily', 'weekly', 'monthly'], {
  errorMap: () => ({ message: 'Recorrência inválida' }),
});

const prioritySchema = z
  .enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Prioridade inválida' }),
  })
  .nullable()
  .optional();

// --- Request schemas ---

export const createActivitySchema = z.object({
  title: titleSchema,
  date: dateSchema,
  description: z.string().max(5000).optional().default(''),
  startTime: startTimeSchema,
  duration: durationSchema,
  recurrence: recurrenceSchema.optional().default('none'),
  priority: prioritySchema,
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = z.object({
  title: titleSchema.optional(),
  date: dateSchema.optional(),
  description: z.string().max(5000).optional(),
  startTime: startTimeSchema,
  duration: durationSchema,
  recurrence: recurrenceSchema.optional(),
  priority: prioritySchema,
});

export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

export const toggleCompletionSchema = z.object({
  date: dateSchema,
});

export type ToggleCompletionInput = z.infer<typeof toggleCompletionSchema>;

export const activityQuerySchema = z
  .object({
    date: dateSchema.optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  })
  .refine(
    (data) => {
      // Must provide either `date` OR (`startDate` AND `endDate`), not both
      const hasDate = !!data.date;
      const hasRange = !!data.startDate && !!data.endDate;
      return hasDate || hasRange;
    },
    {
      message: 'Informe "date" ou "startDate" e "endDate"',
    }
  )
  .refine(
    (data) => {
      // Cannot mix single date with range
      if (data.date && (data.startDate || data.endDate)) {
        return false;
      }
      return true;
    },
    {
      message: 'Não é possível combinar "date" com "startDate"/"endDate"',
    }
  )
  .refine(
    (data) => {
      // If range provided, both must exist
      if ((data.startDate && !data.endDate) || (!data.startDate && data.endDate)) {
        return false;
      }
      return true;
    },
    {
      message: '"startDate" e "endDate" devem ser informados juntos',
    }
  );

export type ActivityQueryInput = z.infer<typeof activityQuerySchema>;
