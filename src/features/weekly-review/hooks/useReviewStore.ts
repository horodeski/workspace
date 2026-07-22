import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subWeeks } from 'date-fns';
import type { Review, ReviewFormData, WeekHistoryItem } from '../types/review.types';
import { getISOWeekData } from '../services/weekCalculation';

interface ReviewState {
  reviews: Review[];
  saveReview: (data: ReviewFormData & { weekNumber: number; year: number; startDate: string; endDate: string }) => void;
  getReviewByWeek: (year: number, weekNumber: number) => Review | undefined;
  unlockReview: (id: string) => void;
  getRecentWeeks: (count?: number) => WeekHistoryItem[];
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: [],

      saveReview: (data) => {
        const now = new Date().toISOString();
        const { reviews } = get();
        const existing = reviews.find(
          (r) => r.weekNumber === data.weekNumber && r.year === data.year
        );

        if (existing) {
          set({
            reviews: reviews.map((r) =>
              r.id === existing.id
                ? {
                    ...r,
                    learning: data.learning,
                    decisions: data.decisions,
                    resolvedProblems: data.resolvedProblems,
                    timeWaste: data.timeWaste,
                    nextWeekFocus: data.nextWeekFocus,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    updatedAt: now,
                    isLocked: true,
                  }
                : r
            ),
          });
        } else {
          const newReview: Review = {
            id: crypto.randomUUID(),
            weekNumber: data.weekNumber,
            year: data.year,
            startDate: data.startDate,
            endDate: data.endDate,
            learning: data.learning,
            decisions: data.decisions,
            resolvedProblems: data.resolvedProblems,
            timeWaste: data.timeWaste,
            nextWeekFocus: data.nextWeekFocus,
            createdAt: now,
            updatedAt: now,
            isLocked: true,
          };

          set({ reviews: [...reviews, newReview] });
        }
      },

      getReviewByWeek: (year: number, weekNumber: number) => {
        const { reviews } = get();
        return reviews.find((r) => r.year === year && r.weekNumber === weekNumber);
      },

      unlockReview: (id: string) => {
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === id ? { ...r, isLocked: false } : r
          ),
        }));
      },

      getRecentWeeks: (count = 12): WeekHistoryItem[] => {
        const { reviews } = get();
        const now = new Date();
        const items: WeekHistoryItem[] = [];

        for (let i = 0; i < count; i++) {
          const date = subWeeks(now, i);
          const weekData = getISOWeekData(date);
          const review = reviews.find(
            (r) => r.year === weekData.year && r.weekNumber === weekData.weekNumber
          );

          items.push({
            weekNumber: weekData.weekNumber,
            year: weekData.year,
            hasReview: !!review,
            isLocked: review?.isLocked ?? false,
          });
        }

        return items;
      },
    }),
    {
      name: 'weekly-review-storage',
      version: 1,
      migrate: (persistedState, version) => {
        return persistedState as ReviewState;
      },
    }
  )
);
