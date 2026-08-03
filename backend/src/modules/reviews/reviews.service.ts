import { reviewsRepository, type ReviewRecord } from './reviews.repository.js';
import { sanitizeHtml, hasNonEmptyContent } from '../../shared/utils/sanitization.js';
import { getWeekHistory, type WeekHistoryItem } from '../../shared/utils/date.js';
import { NotFoundError, ConflictError } from '../../shared/errors/index.js';
import { eventBus } from '../../shared/event-bus/index.js';
import type { CreateReviewInput, UpdateReviewInput } from './reviews.schemas.js';
import type {
  PaginationOptions,
  PaginatedResult,
} from '../../shared/utils/pagination.js';
import { prisma } from '../../shared/database/prisma.js';
import { getISOWeek, getISOWeekYear, subWeeks, startOfDay } from 'date-fns';

const RICH_TEXT_FIELDS = [
  'learning',
  'decisions',
  'resolvedProblems',
  'timeWaste',
  'nextWeekFocus',
] as const;

function sanitizeReviewFields<
  T extends Partial<Record<(typeof RICH_TEXT_FIELDS)[number], string>>,
>(data: T): T {
  const sanitized = { ...data };
  for (const field of RICH_TEXT_FIELDS) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = sanitizeHtml(sanitized[field] as string);
    }
  }
  return sanitized;
}

function hasAtLeastOneNonEmptyField(
  data: Partial<Record<(typeof RICH_TEXT_FIELDS)[number], string>>
): boolean {
  return RICH_TEXT_FIELDS.some((field) => {
    const value = data[field];
    return value !== undefined && hasNonEmptyContent(value);
  });
}

export const reviewsService = {
  async create(
    userId: string,
    data: CreateReviewInput
  ): Promise<ReviewRecord> {
    // Check if a review already exists for this week/year
    const existing = await reviewsRepository.findByWeek(
      userId,
      data.year,
      data.weekNumber
    );

    if (existing) {
      throw new ConflictError(
        'Já existe uma revisão para esta semana/ano'
      );
    }

    // Sanitize HTML fields
    const sanitizedData = sanitizeReviewFields(data);

    // Create review (repository sets isLocked=true)
    const review = await reviewsRepository.create(userId, {
      weekNumber: sanitizedData.weekNumber,
      year: sanitizedData.year,
      startDate: sanitizedData.startDate,
      endDate: sanitizedData.endDate,
      learning: sanitizedData.learning,
      decisions: sanitizedData.decisions,
      resolvedProblems: sanitizedData.resolvedProblems,
      timeWaste: sanitizedData.timeWaste,
      nextWeekFocus: sanitizedData.nextWeekFocus,
    });

    eventBus.publish({ type: 'review.saved', payload: { reviewId: review.id, userId, week: review.weekNumber, year: review.year } });

    return review;
  },

  async update(
    userId: string,
    id: string,
    data: UpdateReviewInput
  ): Promise<ReviewRecord> {
    // Check review exists
    const existing = await reviewsRepository.findById(id, userId);

    if (!existing) {
      throw new NotFoundError('Revisão');
    }

    // Check if locked
    if (existing.isLocked) {
      throw new ConflictError(
        'Revisão bloqueada. Desbloqueie antes de editar'
      );
    }

    // Sanitize HTML fields
    const sanitizedData = sanitizeReviewFields(data);

    // Validate at least one non-empty field
    if (!hasAtLeastOneNonEmptyField(sanitizedData)) {
      throw new ConflictError(
        'Ao menos um campo de texto deve ter conteúdo não-vazio'
      );
    }

    // Update review fields
    const updated = await reviewsRepository.update(id, userId, {
      learning: sanitizedData.learning,
      decisions: sanitizedData.decisions,
      resolvedProblems: sanitizedData.resolvedProblems,
      timeWaste: sanitizedData.timeWaste,
      nextWeekFocus: sanitizedData.nextWeekFocus,
    });

    if (!updated) {
      throw new NotFoundError('Revisão');
    }

    // Re-lock the review after update
    const locked = await prisma.review.update({
      where: { id },
      data: { isLocked: true },
    });

    eventBus.publish({ type: 'review.saved', payload: { reviewId: id, userId, week: (locked as ReviewRecord).weekNumber, year: (locked as ReviewRecord).year } });

    return locked as ReviewRecord;
  },

  async getByWeek(
    userId: string,
    year: number,
    weekNumber: number
  ): Promise<ReviewRecord | null> {
    return reviewsRepository.findByWeek(userId, year, weekNumber);
  },

  async unlock(userId: string, id: string): Promise<ReviewRecord> {
    const existing = await reviewsRepository.findById(id, userId);

    if (!existing) {
      throw new NotFoundError('Revisão');
    }

    // Idempotent unlock
    const unlocked = await reviewsRepository.unlock(id, userId);

    if (!unlocked) {
      throw new NotFoundError('Revisão');
    }

    eventBus.publish({ type: 'review.unlocked', payload: { reviewId: id, userId } });

    return unlocked;
  },

  async getHistory(
    userId: string,
    count: number
  ): Promise<WeekHistoryItem[]> {
    // Calculate last N ISO weeks
    const now = startOfDay(new Date());
    const weeks: Array<{ year: number; weekNumber: number }> = [];

    for (let i = 0; i < count; i++) {
      const date = subWeeks(now, i);
      weeks.push({
        weekNumber: getISOWeek(date),
        year: getISOWeekYear(date),
      });
    }

    // Find reviews for those weeks
    const reviews = await reviewsRepository.findReviewsForWeeks(
      userId,
      weeks
    );

    // Build history using shared utility
    return getWeekHistory(count, reviews);
  },

  async list(
    userId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<ReviewRecord>> {
    return reviewsRepository.listPaginated(userId, options);
  },
};
