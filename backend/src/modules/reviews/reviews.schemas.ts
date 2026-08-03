import { z } from 'zod';

// --- Utility ---

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '').trim();

// --- Shared field schemas ---

const weekNumberSchema = z
  .number()
  .int('weekNumber deve ser um número inteiro')
  .min(1, 'weekNumber deve ser no mínimo 1')
  .max(53, 'weekNumber deve ser no máximo 53');

const yearSchema = z
  .number()
  .int('year deve ser um número inteiro')
  .min(1000, 'year deve ter 4 dígitos')
  .max(9999, 'year deve ter 4 dígitos');

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD');

const richTextSchema = z.string().optional().default('');

// --- Rich text fields list ---

const RICH_TEXT_FIELDS = ['learning', 'decisions', 'resolvedProblems', 'timeWaste', 'nextWeekFocus'] as const;

// --- Request schemas ---

export const createReviewSchema = z
  .object({
    weekNumber: weekNumberSchema,
    year: yearSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    learning: richTextSchema,
    decisions: richTextSchema,
    resolvedProblems: richTextSchema,
    timeWaste: richTextSchema,
    nextWeekFocus: richTextSchema,
  })
  .refine(
    (data) =>
      RICH_TEXT_FIELDS.some((field) => stripHtml(data[field]).length > 0),
    {
      message: 'Ao menos um campo de texto deve ter conteúdo não-vazio',
    }
  );

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = z
  .object({
    learning: richTextSchema,
    decisions: richTextSchema,
    resolvedProblems: richTextSchema,
    timeWaste: richTextSchema,
    nextWeekFocus: richTextSchema,
  })
  .refine(
    (data) =>
      RICH_TEXT_FIELDS.some((field) => stripHtml(data[field]).length > 0),
    {
      message: 'Ao menos um campo de texto deve ter conteúdo não-vazio',
    }
  );

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

export const reviewWeekParamsSchema = z.object({
  year: z.coerce
    .number()
    .int('year deve ser um número inteiro')
    .min(1000, 'year deve ter 4 dígitos')
    .max(9999, 'year deve ter 4 dígitos'),
  week: z.coerce
    .number()
    .int('week deve ser um número inteiro')
    .min(1, 'week deve ser no mínimo 1')
    .max(53, 'week deve ser no máximo 53'),
});

export type ReviewWeekParamsInput = z.infer<typeof reviewWeekParamsSchema>;

export const reviewHistoryQuerySchema = z.object({
  count: z.coerce
    .number()
    .int('count deve ser um número inteiro')
    .min(1, 'count deve ser no mínimo 1')
    .max(52, 'count deve ser no máximo 52')
    .optional()
    .default(12),
});

export type ReviewHistoryQueryInput = z.infer<typeof reviewHistoryQuerySchema>;
