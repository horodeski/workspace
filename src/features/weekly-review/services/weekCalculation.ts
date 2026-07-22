import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  endOfISOWeek,
  startOfDay,
  isToday,
  isYesterday,
  parseISO,
  format,
  getYear,
} from 'date-fns';
import type { WeekData } from '../types/review.types';

const PORTUGUESE_MONTHS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

/**
 * Returns ISO week data for a given date: week number, week-year, start (Monday 00:00), and end (Sunday 00:00).
 * The endDate is the start-of-day of Sunday so that endDate - startDate = exactly 6 days.
 */
export function getISOWeekData(date: Date): WeekData {
  return {
    weekNumber: getISOWeek(date),
    year: getISOWeekYear(date),
    startDate: startOfISOWeek(date),
    endDate: startOfDay(endOfISOWeek(date)),
  };
}

/**
 * Formats a date range as "DD Mon → DD Mon" in Portuguese locale.
 * If start and end dates are in different calendar years, appends the four-digit year to each date.
 */
export function formatWeekRange(startDate: Date, endDate: Date): string {
  const startDay = String(startDate.getDate()).padStart(2, '0');
  const startMonth = PORTUGUESE_MONTHS[startDate.getMonth()];
  const endDay = String(endDate.getDate()).padStart(2, '0');
  const endMonth = PORTUGUESE_MONTHS[endDate.getMonth()];

  const startYear = getYear(startDate);
  const endYear = getYear(endDate);

  if (startYear !== endYear) {
    return `${startDay} ${startMonth} ${startYear} → ${endDay} ${endMonth} ${endYear}`;
  }

  return `${startDay} ${startMonth} → ${endDay} ${endMonth}`;
}

/**
 * Formats an ISO datetime string as a relative timestamp in Portuguese:
 * - "Hoje às HH:mm" for today
 * - "Ontem às HH:mm" for yesterday
 * - "DD/MM às HH:mm" for earlier dates
 */
export function formatRelativeTimestamp(isoDatetime: string): string {
  const date = parseISO(isoDatetime);
  const time = format(date, 'HH:mm');

  if (isToday(date)) {
    return `Hoje às ${time}`;
  }

  if (isYesterday(date)) {
    return `Ontem às ${time}`;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${day}/${month} às ${time}`;
}
