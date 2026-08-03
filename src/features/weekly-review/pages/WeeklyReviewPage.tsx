import React, { useEffect, useState } from 'react';
import { useReviewStore } from '../hooks/useReviewStore';
import { useWeekCalculation } from '../hooks/useWeekCalculation';
import { EmptyState } from '../components/EmptyState';
import { CurrentWeekCard } from '../components/CurrentWeekCard';
import { HistoryList } from '../components/HistoryList';
import type { Review } from '../types/review.types';

export const WeeklyReviewPage: React.FC = () => {
  const { reviews, getReviewByWeek, getRecentWeeks, fetchRecentWeeks } = useReviewStore();
  const { weekNumber, year } = useWeekCalculation();
  const [currentWeekReview, setCurrentWeekReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchRecentWeeks();
  }, [fetchRecentWeeks]);

  useEffect(() => {
    let cancelled = false;
    getReviewByWeek(year, weekNumber).then((review) => {
      if (!cancelled) {
        setCurrentWeekReview(review);
      }
    });
    return () => { cancelled = true; };
  }, [year, weekNumber, getReviewByWeek]);

  const hasReviews = reviews.length > 0;
  const recentWeeks = getRecentWeeks();

  if (!hasReviews) {
    return (
      <div className="mx-auto w-full px-4 sm:max-w-[640px] lg:max-w-[720px]">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full px-4 sm:max-w-[640px] lg:max-w-[720px]">
      <h1 className="text-lg font-semibold text-foreground mb-6">
        Weekly Review
      </h1>

      {currentWeekReview && (
        <div className="mb-6">
          <CurrentWeekCard
            weekNumber={currentWeekReview.weekNumber}
            year={currentWeekReview.year}
            isLocked={currentWeekReview.isLocked}
            updatedAt={currentWeekReview.updatedAt}
          />
        </div>
      )}

      <HistoryList items={recentWeeks} currentWeek={weekNumber} currentYear={year} />
    </div>
  );
};

WeeklyReviewPage.displayName = 'WeeklyReviewPage';
