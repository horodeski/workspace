import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  endOfISOWeek,
  startOfDay,
  subWeeks,
} from 'date-fns';

export interface WeekHistoryItem {
  weekNumber: number;
  year: number;
  hasReview: boolean;
  isLocked: boolean;
}

export interface ISOWeekData {
  weekNumber: number;
  year: number;
  startDate: Date;
  endDate: Date;
}

export function getISOWeekData(date: Date): ISOWeekData {
  return {
    weekNumber: getISOWeek(date),
    year: getISOWeekYear(date),
    startDate: startOfISOWeek(date),
    endDate: endOfISOWeek(date),
  };
}

export function getWeekHistory(
  count: number,
  reviews: Array<{ weekNumber: number; year: number; isLocked: boolean }>
): WeekHistoryItem[] {
  const now = startOfDay(new Date());
  const items: WeekHistoryItem[] = [];

  for (let i = 0; i < count; i++) {
    const date = subWeeks(now, i);
    const weekNumber = getISOWeek(date);
    const year = getISOWeekYear(date);
    const review = reviews.find(
      (r) => r.year === year && r.weekNumber === weekNumber
    );

    items.push({
      weekNumber,
      year,
      hasReview: !!review,
      isLocked: review?.isLocked ?? false,
    });
  }

  return items;
}
