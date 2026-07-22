import { useMemo } from 'react';
import { getISOWeekData } from '../services/weekCalculation';
import type { WeekData } from '../types/review.types';

export function useWeekCalculation(date: Date = new Date()): WeekData {
  return useMemo(() => getISOWeekData(date), [date.getTime()]);
}
