import { z } from 'zod';

export interface Review {
  id: string; // UUID v4
  weekNumber: number; // 1–53 (ISO 8601)
  year: number; // Four-digit year (ISO week-year)
  startDate: string; // ISO 8601 date (Monday)
  endDate: string; // ISO 8601 date (Sunday)
  learning: string; // HTML rich text content
  decisions: string; // HTML rich text content
  resolvedProblems: string; // HTML rich text content
  timeWaste: string; // HTML rich text content
  nextWeekFocus: string; // HTML rich text content
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
  isLocked: boolean;
}

export interface WeekData {
  weekNumber: number;
  year: number;
  startDate: Date;
  endDate: Date;
}

export interface WeekHistoryItem {
  weekNumber: number;
  year: number;
  hasReview: boolean;
  isLocked: boolean;
}

/**
 * Strips HTML tags and returns plain text content.
 * Works in both browser and Node (test) environments.
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  // Remove HTML tags
  return html.replace(/<[^>]*>/g, '').trim();
}

export const reviewFieldSchema = z
  .string()
  .optional()
  .default('');

export const reviewFormSchema = z
  .object({
    learning: reviewFieldSchema,
    decisions: reviewFieldSchema,
    resolvedProblems: reviewFieldSchema,
    timeWaste: reviewFieldSchema,
    nextWeekFocus: reviewFieldSchema,
  })
  .refine(
    (data) => Object.values(data).some((v) => stripHtml(v).length > 0),
    { message: 'Preencha pelo menos um campo para salvar a revisão.' }
  );

export type ReviewFormData = z.infer<typeof reviewFormSchema>;
