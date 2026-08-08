import React, { useEffect, useRef, useState } from 'react';
import { useReviewStore } from '../hooks/useReviewStore';
import { useWeekCalculation } from '../hooks/useWeekCalculation';
import { EmptyState } from '../components/EmptyState';
import { CurrentWeekCard } from '../components/CurrentWeekCard';
import { HistoryList } from '../components/HistoryList';

export const WeeklyReviewPage: React.FC = () => {
  const { isLoading, getRecentWeeks, fetchRecentWeeks } = useReviewStore();
  const { weekNumber, year } = useWeekCalculation();
  const [initialLoad, setInitialLoad] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchRecentWeeks().finally(() => setInitialLoad(false));
  }, [fetchRecentWeeks]);

  const recentWeeks = getRecentWeeks();
  const currentWeekData = recentWeeks.find(
    (w) => w.weekNumber === weekNumber && w.year === year
  );

  if (initialLoad && isLoading) {
    return (
      <div className="mx-auto w-full px-4 sm:max-w-[640px] lg:max-w-[720px] flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
        <div className="animate-spin h-6 w-6 border-2 border-zinc-400 border-t-transparent rounded-full" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  if (recentWeeks.length === 0) {
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

      {currentWeekData?.hasReview && (
        <div className="mb-6">
          <CurrentWeekCard
            weekNumber={currentWeekData.weekNumber}
            year={currentWeekData.year}
            isLocked={currentWeekData.isLocked}
          />
        </div>
      )}

      <HistoryList items={recentWeeks} currentWeek={weekNumber} currentYear={year} />
    </div>
  );
};

WeeklyReviewPage.displayName = 'WeeklyReviewPage';
