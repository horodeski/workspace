import {
  getISOWeekData,
  formatWeekRange,
  formatRelativeTimestamp,
} from './weekCalculation';

describe('getISOWeekData', () => {
  it('returns correct week data for a mid-year date', () => {
    // 2025-07-28 is a Monday in ISO week 31
    const date = new Date(2025, 6, 28);
    const result = getISOWeekData(date);

    expect(result.weekNumber).toBe(31);
    expect(result.year).toBe(2025);
    expect(result.startDate.getDay()).toBe(1); // Monday
    expect(result.endDate.getDay()).toBe(0); // Sunday
  });

  it('handles year-boundary week (ISO Week 1 of 2025 starts in Dec 2024)', () => {
    // 2024-12-30 is Monday of ISO Week 1, 2025
    const date = new Date(2024, 11, 30);
    const result = getISOWeekData(date);

    expect(result.weekNumber).toBe(1);
    expect(result.year).toBe(2025);
    expect(result.startDate).toEqual(new Date(2024, 11, 30));
    expect(result.endDate).toEqual(new Date(2025, 0, 5));
  });

  it('startDate is always Monday and endDate is always Sunday', () => {
    const date = new Date(2025, 2, 15); // a Saturday
    const result = getISOWeekData(date);

    expect(result.startDate.getDay()).toBe(1);
    expect(result.endDate.getDay()).toBe(0);
  });

  it('endDate and startDate span exactly 6 calendar days', () => {
    const date = new Date(2025, 5, 12);
    const result = getISOWeekData(date);

    expect(result.startDate.getDay()).toBe(1); // Monday
    expect(result.endDate.getDay()).toBe(0); // Sunday

    const diffMs = result.endDate.getTime() - result.startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(6);
  });
});

describe('formatWeekRange', () => {
  it('formats same-year range without year', () => {
    const start = new Date(2025, 6, 28); // 28 Jul
    const end = new Date(2025, 7, 3); // 03 Ago

    expect(formatWeekRange(start, end)).toBe('28 Jul → 03 Ago');
  });

  it('formats cross-year range with year appended', () => {
    const start = new Date(2024, 11, 30); // 30 Dez 2024
    const end = new Date(2025, 0, 5); // 05 Jan 2025

    expect(formatWeekRange(start, end)).toBe('30 Dez 2024 → 05 Jan 2025');
  });

  it('zero-pads single digit days', () => {
    const start = new Date(2025, 0, 6); // 06 Jan
    const end = new Date(2025, 0, 12); // 12 Jan

    expect(formatWeekRange(start, end)).toBe('06 Jan → 12 Jan');
  });

  it('uses correct Portuguese month abbreviations', () => {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ];

    months.forEach((expected, index) => {
      const start = new Date(2025, index, 1);
      const end = new Date(2025, index, 7);
      const result = formatWeekRange(start, end);
      expect(result).toContain(expected);
    });
  });
});

describe('formatRelativeTimestamp', () => {
  it('returns "Hoje às HH:mm" for today', () => {
    const now = new Date();
    now.setHours(14, 30, 0, 0);
    const iso = now.toISOString();

    expect(formatRelativeTimestamp(iso)).toBe('Hoje às 14:30');
  });

  it('returns "Ontem às HH:mm" for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(9, 5, 0, 0);
    const iso = yesterday.toISOString();

    expect(formatRelativeTimestamp(iso)).toBe('Ontem às 09:05');
  });

  it('returns "DD/MM às HH:mm" for earlier dates', () => {
    const older = new Date();
    older.setDate(older.getDate() - 5);
    older.setHours(22, 15, 0, 0);
    const iso = older.toISOString();

    const day = String(older.getDate()).padStart(2, '0');
    const month = String(older.getMonth() + 1).padStart(2, '0');

    expect(formatRelativeTimestamp(iso)).toBe(`${day}/${month} às 22:15`);
  });

  it('uses 24-hour time format', () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const iso = now.toISOString();

    expect(formatRelativeTimestamp(iso)).toBe('Hoje às 00:00');
  });
});
