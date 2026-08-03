import * as fc from 'fast-check';
import {
  getISOWeekData,
  formatWeekRange,
  formatRelativeTimestamp,
} from '../services/weekCalculation';

/**
 * Property 7: ISO Week Calculation Invariants
 *
 * For any valid date, `getISOWeekData` SHALL return a `weekNumber` between 1 and 53
 * (inclusive), the `startDate` SHALL be a Monday, the `endDate` SHALL be a Sunday, and the
 * difference between `endDate` and `startDate` SHALL be exactly 6 days.
 *
 * **Validates: Requirements 9.1, 9.2**
 */
describe('Feature: weekly-review, Property 7: ISO week calculation invariants', () => {
  it('weekNumber is between 1 and 53, startDate is Monday, endDate is Sunday, 6-day difference', () => {
    fc.assert(
      fc.property(
        fc.date({
          min: new Date('2000-01-01T00:00:00.000Z'),
          max: new Date('2099-12-31T23:59:59.999Z'),
          noInvalidDate: true,
        }),
        (date) => {
          const result = getISOWeekData(date);

          // weekNumber is between 1 and 53
          expect(result.weekNumber).toBeGreaterThanOrEqual(1);
          expect(result.weekNumber).toBeLessThanOrEqual(53);

          // startDate is a Monday (getDay() === 1)
          expect(result.startDate.getDay()).toBe(1);

          // endDate is a Sunday (getDay() === 0)
          expect(result.endDate.getDay()).toBe(0);

          // Difference between endDate and startDate is exactly 6 calendar days
          // We compare calendar dates to avoid DST offset issues
          const startDay = new Date(
            result.startDate.getFullYear(),
            result.startDate.getMonth(),
            result.startDate.getDate()
          );
          const endDay = new Date(
            result.endDate.getFullYear(),
            result.endDate.getMonth(),
            result.endDate.getDate()
          );
          const diffDays = Math.round(
            (endDay.getTime() - startDay.getTime()) / (24 * 60 * 60 * 1000)
          );
          expect(diffDays).toBe(6);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 8: Date Range Formatting
 *
 * For any valid Monday/Sunday date pair within the same calendar year, `formatWeekRange`
 * SHALL produce a string matching the pattern "DD Mon → DD Mon" where DD is a zero-padded
 * two-digit day (01–31) and Mon is a valid Portuguese abbreviated month name.
 *
 * **Validates: Requirements 9.3**
 */
describe('Feature: weekly-review, Property 8: Date range formatting', () => {
  it('produces "DD Mon → DD Mon" pattern with Portuguese month names for same-year pairs', () => {
    // Generate a random Monday within a year, then derive the Sunday (6 days later)
    // ensuring both fall within the same calendar year
    const mondayArb = fc
      .date({
        min: new Date('2000-01-01T00:00:00.000Z'),
        max: new Date('2099-12-25T23:59:59.999Z'),
      })
      .map((d) => {
        // Adjust to the nearest Monday (start of ISO week)
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(d);
        monday.setDate(d.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        return monday;
      })
      .filter((monday) => {
        // Ensure the Sunday (6 days later) is in the same calendar year
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return monday.getFullYear() === sunday.getFullYear();
      });

    const portugueseMonths =
      '(Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)';
    const pattern = new RegExp(
      `^\\d{2} ${portugueseMonths} → \\d{2} ${portugueseMonths}$`
    );

    fc.assert(
      fc.property(mondayArb, (monday) => {
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const result = formatWeekRange(monday, sunday);
        expect(result).toMatch(pattern);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 1: Relative Timestamp Formatting
 *
 * For any ISO 8601 datetime string, `formatRelativeTimestamp` SHALL produce a string that:
 * - Contains "Hoje às HH:mm" if the datetime is on the current calendar day
 * - Contains "Ontem às HH:mm" if the datetime is on the previous calendar day
 * - Contains "DD/MM às HH:mm" for any earlier date
 *
 * where HH:mm is a valid 24-hour time format (00:00–23:59) and DD/MM is a valid day/month.
 *
 * **Validates: Requirements 2.4**
 */
describe('Feature: weekly-review, Property 1: Relative timestamp formatting', () => {
  it('output contains "Hoje às", "Ontem às", or "DD/MM às" with valid HH:mm', () => {
    // Generate random date components to build ISO datetime strings
    const isoDatetimeArb = fc
      .record({
        year: fc.integer({ min: 2000, max: 2099 }),
        month: fc.integer({ min: 1, max: 12 }),
        day: fc.integer({ min: 1, max: 28 }), // Use 28 to avoid invalid dates
        hour: fc.integer({ min: 0, max: 23 }),
        minute: fc.integer({ min: 0, max: 59 }),
        second: fc.integer({ min: 0, max: 59 }),
      })
      .map(({ year, month, day, hour, minute, second }) => {
        const m = String(month).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const h = String(hour).padStart(2, '0');
        const min = String(minute).padStart(2, '0');
        const s = String(second).padStart(2, '0');
        return `${year}-${m}-${d}T${h}:${min}:${s}`;
      });

    fc.assert(
      fc.property(isoDatetimeArb, (isoDatetime) => {
        const result = formatRelativeTimestamp(isoDatetime);

        // Verify it matches one of the three expected patterns
        const hojePattern = /^Hoje às (\d{2}):(\d{2})$/;
        const ontemPattern = /^Ontem às (\d{2}):(\d{2})$/;
        const datePattern = /^(\d{2})\/(\d{2}) às (\d{2}):(\d{2})$/;

        const isHoje = hojePattern.test(result);
        const isOntem = ontemPattern.test(result);
        const isDate = datePattern.test(result);

        expect(isHoje || isOntem || isDate).toBe(true);

        // Extract and validate HH:mm time component
        const timeMatch = result.match(/(\d{2}):(\d{2})$/);
        expect(timeMatch).not.toBeNull();
        if (timeMatch) {
          const hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          expect(hours).toBeGreaterThanOrEqual(0);
          expect(hours).toBeLessThanOrEqual(23);
          expect(minutes).toBeGreaterThanOrEqual(0);
          expect(minutes).toBeLessThanOrEqual(59);
        }
      }),
      { numRuns: 100 }
    );
  });
});
