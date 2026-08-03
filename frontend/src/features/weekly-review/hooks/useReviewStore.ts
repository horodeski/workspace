import { create } from 'zustand';
import type { Review, ReviewFormData, WeekHistoryItem } from '../types/review.types';
import { api, ApiError } from '@/lib/api';

interface ReviewState {
  reviews: Review[];
  recentWeeks: WeekHistoryItem[];
  isLoading: boolean;
  error: string | null;
  fetchRecentWeeks: (count?: number) => Promise<void>;
  getReviewByWeek: (year: number, weekNumber: number) => Promise<Review | null>;
  saveReview: (data: ReviewFormData & { weekNumber: number; year: number; startDate: string; endDate: string }) => Promise<Review>;
  unlockReview: (id: string) => Promise<void>;
  getRecentWeeks: () => WeekHistoryItem[];
}

export const useReviewStore = create<ReviewState>()((set, get) => ({
  reviews: [],
  recentWeeks: [],
  isLoading: false,
  error: null,

  fetchRecentWeeks: async (count = 12) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get<WeekHistoryItem[]>(`/reviews/history?count=${count}`);
      set({ recentWeeks: data, isLoading: false });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch recent weeks';
      set({ error: message, isLoading: false });
    }
  },

  getReviewByWeek: async (year: number, weekNumber: number) => {
    set({ isLoading: true, error: null });
    try {
      const review = await api.get<Review>(`/reviews/${year}/${weekNumber}`);
      // Cache in local state
      const { reviews } = get();
      const existing = reviews.find((r) => r.id === review.id);
      if (existing) {
        set({
          reviews: reviews.map((r) => (r.id === review.id ? review : r)),
          isLoading: false,
        });
      } else {
        set({ reviews: [...reviews, review], isLoading: false });
      }
      return review;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        set({ isLoading: false });
        return null;
      }
      const message = err instanceof ApiError ? err.message : 'Failed to fetch review';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  saveReview: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { reviews } = get();
      const existing = reviews.find(
        (r) => r.weekNumber === data.weekNumber && r.year === data.year
      );

      let saved: Review;
      if (existing) {
        saved = await api.put<Review>(`/reviews/${existing.id}`, {
          learning: data.learning,
          decisions: data.decisions,
          resolvedProblems: data.resolvedProblems,
          timeWaste: data.timeWaste,
          nextWeekFocus: data.nextWeekFocus,
          startDate: data.startDate,
          endDate: data.endDate,
        });
        set({
          reviews: reviews.map((r) => (r.id === existing.id ? saved : r)),
          isLoading: false,
        });
      } else {
        saved = await api.post<Review>('/reviews', {
          weekNumber: data.weekNumber,
          year: data.year,
          startDate: data.startDate,
          endDate: data.endDate,
          learning: data.learning,
          decisions: data.decisions,
          resolvedProblems: data.resolvedProblems,
          timeWaste: data.timeWaste,
          nextWeekFocus: data.nextWeekFocus,
        });
        set({ reviews: [...reviews, saved], isLoading: false });
      }
      return saved;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save review';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  unlockReview: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const unlocked = await api.post<Review>(`/reviews/${id}/unlock`);
      const { reviews } = get();
      set({
        reviews: reviews.map((r) => (r.id === id ? unlocked : r)),
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to unlock review';
      set({ error: message, isLoading: false });
    }
  },

  getRecentWeeks: () => {
    return get().recentWeeks;
  },
}));
