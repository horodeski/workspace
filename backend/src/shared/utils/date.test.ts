import { describe, it, expect } from 'vitest';
import { getISOWeekData, getWeekHistory } from './date.js';
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek } from 'date-fns';

describe('getISOWeekData', () => {
  it('returns correct week number and year for a known date', () => {
    // 2024-01-01 is in ISO week 1 of 2024
    const date = new Date(2024, 0, 1);
    const result = getISOWeekData(date);
    expect(result.weekNumber).toBe(getISOWeek(date));
    expect(result.year).toBe(getISOWeekYear(date));
  });

  it('returns start and end of ISO week', () => {
    const date = new Date(2024, 5, 12); // June 12, 2024 (Wednesday)
    const result = getISOWeekData(date);
    expect(result.startDate).toEqual(startOfISOWeek(date));
    expect(result.endDate).toEqual(endOfISOWeek(date));
  });

  it('start date is a Monday', () => {
    const date = new Date(2024, 5, 12);
    const result = getISOWeekData(date);
    expect(result.startDate.getDay()).toBe(1); // Monday
  });

  it('end date is a Sunday', () => {
    const date = new Date(2024, 5, 12);
    const result = getISOWeekData(date);
    expect(result.endDate.getDay()).toBe(0); // Sunday
  });
});

describe('getWeekHistory', () => {
  it('returns requested number of weeks', () => {
    const result = getWeekHistory(5, []);
    expect(result).toHaveLength(5);
  });

  it('returns hasReview=false when no reviews exist', () => {
    const result = getWeekHistory(3, []);
    result.forEach((item) => {
      expect(item.hasReview).toBe(false);
      expect(item.isLocked).toBe(false);
    });
  });

  it('marks weeks with matching reviews', () => {
    const now = new Date();
    const currentWeek = getISOWeek(now);
    const currentYear = getISOWeekYear(now);

    const reviews = [
      { weekNumber: currentWeek, year: currentYear, isLocked: true },
    ];

    const result = getWeekHistory(3, reviews);
    expect(result[0].hasReview).toBe(true);
    expect(result[0].isLocked).toBe(true);
  });

  it('returns weeks in reverse chronological order (current week first)', () => {
    const result = getWeekHistory(4, []);
    const now = new Date();
    expect(result[0].weekNumber).toBe(getISOWeek(now));
    expect(result[0].year).toBe(getISOWeekYear(now));
  });

  it('returns empty array for count of 0', () => {
    const result = getWeekHistory(0, []);
    expect(result).toHaveLength(0);
  });
});
