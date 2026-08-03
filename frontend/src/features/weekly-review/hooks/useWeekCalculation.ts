import { useMemo } from 'react';
import { getISOWeekData } from '../services/weekCalculation';
import type { WeekData } from '../types/review.types';

export function useWeekCalculation(date: Date = new Date()): WeekData {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getISOWeekData(date), [date.getTime()]);
}
