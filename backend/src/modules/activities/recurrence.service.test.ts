import { describe, it, expect } from 'vitest';
import { recurrenceService } from './recurrence.service.js';
import type { ActivityRecord, ActivityCompletionRecord } from './activities.repository.js';

function makeActivity(overrides: Partial<ActivityRecord> = {}): ActivityRecord {
  return {
    id: 'act-1',
    userId: 'user-1',
    title: 'Test Activity',
    description: '',
    date: '2024-03-11', // Monday
    startTime: null,
    duration: null,
    recurrence: 'none',
    priority: null,
    createdAt: new Date('2024-03-11'),
    updatedAt: new Date('2024-03-11'),
    deletedAt: null,
    ...overrides,
  };
}

describe('recurrenceService.matchesDate', () => {
  describe('recurrence: none', () => {
    it('returns true when targetDate equals activity date', () => {
      const activity = makeActivity({ recurrence: 'none', date: '2024-03-11' });
      expect(recurrenceService.matchesDate(activity, '2024-03-11')).toBe(true);
    });

    it('returns false when targetDate differs from activity date', () => {
      const activity = makeActivity({ recurrence: 'none', date: '2024-03-11' });
      expect(recurrenceService.matchesDate(activity, '2024-03-12')).toBe(false);
    });

    it('returns false when targetDate is before activity date', () => {
      const activity = makeActivity({ recurrence: 'none', date: '2024-03-11' });
      expect(recurrenceService.matchesDate(activity, '2024-03-10')).toBe(false);
    });
  });

  describe('recurrence: daily', () => {
    it('returns true on the activity date itself', () => {
      const activity = makeActivity({ recurrence: 'daily', date: '2024-03-11' });
      expect(recurrenceService.matchesDate(activity, '2024-03-11')).toBe(true);
    });

    it('returns true on any date after the activity date', () => {
      const activity = makeActivity({ recurrence: 'daily', date: '2024-03-11' });
      expect(recurrenceService.matchesDate(activity, '2024-03-15')).toBe(true);
      expect(recurrenceService.matchesDate(activity, '2024-12-31')).toBe(true);
    });

    it('returns false before the activity date', () => {
      const activity = makeActivity({ recurrence: 'daily', date: '2024-03-11' });
      expect(recurrenceService.matchesDate(activity, '2024-03-10')).toBe(false);
    });
  });

  describe('recurrence: weekday', () => {
    it('returns true on a weekday on or after activity date', () => {
      const activity = makeActivity({ recurrence: 'weekday', date: '2024-03-11' }); // Monday
      // 2024-03-12 is Tuesday
      expect(recurrenceService.matchesDate(activity, '2024-03-12')).toBe(true);
      // 2024-03-15 is Friday
      expect(recurrenceService.matchesDate(activity, '2024-03-15')).toBe(true);
    });

    it('returns false on weekends', () => {
      const activity = makeActivity({ recurrence: 'weekday', date: '2024-03-11' });
      // 2024-03-16 is Saturday, 2024-03-17 is Sunday
      expect(recurrenceService.matchesDate(activity, '2024-03-16')).toBe(false);
      expect(recurrenceService.matchesDate(activity, '2024-03-17')).toBe(false);
    });

    it('returns false before the activity date', () => {
      const activity = makeActivity({ recurrence: 'weekday', date: '2024-03-11' });
      // 2024-03-08 is Friday (before activity date)
      expect(recurrenceService.matchesDate(activity, '2024-03-08')).toBe(false);
    });
  });

  describe('recurrence: weekly', () => {
    it('returns true on the same day of week on or after activity date', () => {
      const activity = makeActivity({ recurrence: 'weekly', date: '2024-03-11' }); // Monday
      // 2024-03-18 is next Monday
      expect(recurrenceService.matchesDate(activity, '2024-03-18')).toBe(true);
      // 2024-03-25 is two Mondays later
      expect(recurrenceService.matchesDate(activity, '2024-03-25')).toBe(true);
    });

    it('returns false on different days of the week', () => {
      const activity = makeActivity({ recurrence: 'weekly', date: '2024-03-11' }); // Monday
      // 2024-03-12 is Tuesday
      expect(recurrenceService.matchesDate(activity, '2024-03-12')).toBe(false);
      // 2024-03-14 is Thursday
      expect(recurrenceService.matchesDate(activity, '2024-03-14')).toBe(false);
    });

    it('returns true on the activity date itself', () => {
      const activity = makeActivity({ recurrence: 'weekly', date: '2024-03-11' });
      expect(recurrenceService.matchesDate(activity, '2024-03-11')).toBe(true);
    });

    it('returns false before the activity date even on same day of week', () => {
      const activity = makeActivity({ recurrence: 'weekly', date: '2024-03-11' }); // Monday
      // 2024-03-04 is prior Monday
      expect(recurrenceService.matchesDate(activity, '2024-03-04')).toBe(false);
    });
  });

  describe('recurrence: monthly', () => {
    it('returns true on same day of month on or after activity date', () => {
      const activity = makeActivity({ recurrence: 'monthly', date: '2024-03-15' });
      // April 15
      expect(recurrenceService.matchesDate(activity, '2024-04-15')).toBe(true);
      // May 15
      expect(recurrenceService.matchesDate(activity, '2024-05-15')).toBe(true);
    });

    it('returns false on different days of the month', () => {
      const activity = makeActivity({ recurrence: 'monthly', date: '2024-03-15' });
      expect(recurrenceService.matchesDate(activity, '2024-04-14')).toBe(false);
      expect(recurrenceService.matchesDate(activity, '2024-04-16')).toBe(false);
    });

    it('returns true on the activity date itself', () => {
      const activity = makeActivity({ recurrence: 'monthly', date: '2024-03-15' });
      expect(recurrenceService.matchesDate(activity, '2024-03-15')).toBe(true);
    });

    it('returns false before the activity date even on same day of month', () => {
      const activity = makeActivity({ recurrence: 'monthly', date: '2024-03-15' });
      // February 15 is before activity date
      expect(recurrenceService.matchesDate(activity, '2024-02-15')).toBe(false);
    });
  });

  describe('unknown recurrence', () => {
    it('returns false for unknown recurrence type', () => {
      const activity = makeActivity({ recurrence: 'unknown' as string });
      expect(recurrenceService.matchesDate(activity, '2024-03-11')).toBe(false);
    });
  });
});

describe('recurrenceService.expandForDate', () => {
  it('returns ExpandedActivity when activity matches the target date', () => {
    const activity = makeActivity({ recurrence: 'daily', date: '2024-03-11' });
    const result = recurrenceService.expandForDate(activity, '2024-03-12');

    expect(result).not.toBeNull();
    expect(result!.isRecurrenceInstance).toBe(true);
    expect(result!.instanceDate).toBe('2024-03-12');
    expect(result!.completedOnDate).toBe(false);
  });

  it('returns null when activity does not match the target date', () => {
    const activity = makeActivity({ recurrence: 'none', date: '2024-03-11' });
    const result = recurrenceService.expandForDate(activity, '2024-03-12');

    expect(result).toBeNull();
  });

  it('sets isRecurrenceInstance to false on the original date', () => {
    const activity = makeActivity({ recurrence: 'daily', date: '2024-03-11' });
    const result = recurrenceService.expandForDate(activity, '2024-03-11');

    expect(result).not.toBeNull();
    expect(result!.isRecurrenceInstance).toBe(false);
    expect(result!.instanceDate).toBe('2024-03-11');
  });

  it('sets completedOnDate to true when completion exists for target date', () => {
    const activity = makeActivity({ recurrence: 'daily', date: '2024-03-11' });
    const completions: ActivityCompletionRecord[] = [
      { id: 'comp-1', activityId: 'act-1', date: '2024-03-12', completed: true, createdAt: new Date() },
    ];
    const result = recurrenceService.expandForDate(activity, '2024-03-12', completions);

    expect(result).not.toBeNull();
    expect(result!.completedOnDate).toBe(true);
  });

  it('sets completedOnDate to false when completion exists but completed is false', () => {
    const activity = makeActivity({ recurrence: 'daily', date: '2024-03-11' });
    const completions: ActivityCompletionRecord[] = [
      { id: 'comp-1', activityId: 'act-1', date: '2024-03-12', completed: false, createdAt: new Date() },
    ];
    const result = recurrenceService.expandForDate(activity, '2024-03-12', completions);

    expect(result).not.toBeNull();
    expect(result!.completedOnDate).toBe(false);
  });
});

describe('recurrenceService.expandForRange', () => {
  it('expands daily activity across a range', () => {
    const activity = makeActivity({ recurrence: 'daily', date: '2024-03-11' });
    const results = recurrenceService.expandForRange(activity, '2024-03-11', '2024-03-14');

    expect(results).toHaveLength(4); // 11, 12, 13, 14
    expect(results[0].instanceDate).toBe('2024-03-11');
    expect(results[0].isRecurrenceInstance).toBe(false);
    expect(results[1].instanceDate).toBe('2024-03-12');
    expect(results[1].isRecurrenceInstance).toBe(true);
    expect(results[3].instanceDate).toBe('2024-03-14');
  });

  it('expands weekday activity skipping weekends', () => {
    const activity = makeActivity({ recurrence: 'weekday', date: '2024-03-11' }); // Monday
    // Range: Mon 11 to Sun 17
    const results = recurrenceService.expandForRange(activity, '2024-03-11', '2024-03-17');

    expect(results).toHaveLength(5); // Mon-Fri only
    expect(results.map((r) => r.instanceDate)).toEqual([
      '2024-03-11',
      '2024-03-12',
      '2024-03-13',
      '2024-03-14',
      '2024-03-15',
    ]);
  });

  it('expands weekly activity picking correct day of week', () => {
    const activity = makeActivity({ recurrence: 'weekly', date: '2024-03-11' }); // Monday
    // Range: Mon 11 to Mon 25 (3 Mondays)
    const results = recurrenceService.expandForRange(activity, '2024-03-11', '2024-03-25');

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.instanceDate)).toEqual([
      '2024-03-11',
      '2024-03-18',
      '2024-03-25',
    ]);
  });

  it('expands monthly activity picking correct day of month', () => {
    const activity = makeActivity({ recurrence: 'monthly', date: '2024-01-15' });
    // Range: Jan 1 to May 31 (matches: Jan 15, Feb 15, Mar 15, Apr 15, May 15)
    const results = recurrenceService.expandForRange(activity, '2024-01-01', '2024-05-31');

    expect(results).toHaveLength(5);
    expect(results.map((r) => r.instanceDate)).toEqual([
      '2024-01-15',
      '2024-02-15',
      '2024-03-15',
      '2024-04-15',
      '2024-05-15',
    ]);
  });

  it('does not include dates before the activity date', () => {
    const activity = makeActivity({ recurrence: 'daily', date: '2024-03-13' });
    const results = recurrenceService.expandForRange(activity, '2024-03-11', '2024-03-15');

    expect(results).toHaveLength(3); // 13, 14, 15
    expect(results[0].instanceDate).toBe('2024-03-13');
  });

  it('uses completions for completedOnDate flag', () => {
    const activity = makeActivity({ recurrence: 'daily', date: '2024-03-11' });
    const completions: ActivityCompletionRecord[] = [
      { id: 'c1', activityId: 'act-1', date: '2024-03-12', completed: true, createdAt: new Date() },
      { id: 'c2', activityId: 'act-1', date: '2024-03-14', completed: true, createdAt: new Date() },
    ];
    const results = recurrenceService.expandForRange(activity, '2024-03-11', '2024-03-14', completions);

    expect(results[0].completedOnDate).toBe(false); // 11 - no completion
    expect(results[1].completedOnDate).toBe(true);  // 12 - completed
    expect(results[2].completedOnDate).toBe(false); // 13 - no completion
    expect(results[3].completedOnDate).toBe(true);  // 14 - completed
  });

  it('returns empty array for non-recurring activity outside its date', () => {
    const activity = makeActivity({ recurrence: 'none', date: '2024-03-11' });
    const results = recurrenceService.expandForRange(activity, '2024-03-12', '2024-03-15');

    expect(results).toHaveLength(0);
  });

  it('returns single element for non-recurring activity within range', () => {
    const activity = makeActivity({ recurrence: 'none', date: '2024-03-12' });
    const results = recurrenceService.expandForRange(activity, '2024-03-11', '2024-03-15');

    expect(results).toHaveLength(1);
    expect(results[0].instanceDate).toBe('2024-03-12');
    expect(results[0].isRecurrenceInstance).toBe(false);
  });
});
