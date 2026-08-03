import { parseISO, getDay, getDate, addDays, format } from 'date-fns';
import type { ActivityRecord, ActivityCompletionRecord } from './activities.repository.js';

export interface ExpandedActivity extends ActivityRecord {
  isRecurrenceInstance: boolean;
  instanceDate: string;
  completedOnDate: boolean;
}

export interface IRecurrenceService {
  matchesDate(activity: ActivityRecord, targetDate: string): boolean;
  expandForDate(
    activity: ActivityRecord,
    targetDate: string,
    completions?: ActivityCompletionRecord[]
  ): ExpandedActivity | null;
  expandForRange(
    activity: ActivityRecord,
    startDate: string,
    endDate: string,
    completions?: ActivityCompletionRecord[]
  ): ExpandedActivity[];
}

/**
 * Determines whether a recurring activity should appear on a given target date.
 *
 * Algorithm:
 * - none: targetDate === activity.date
 * - daily: targetDate >= activity.date
 * - weekday: targetDate >= activity.date AND Mon-Fri (getDay 1-5)
 * - weekly: targetDate >= activity.date AND same day-of-week as activity.date
 * - monthly: targetDate >= activity.date AND same day-of-month as activity.date
 */
function matchesDate(activity: ActivityRecord, targetDate: string): boolean {
  const activityDate = parseISO(activity.date);
  const target = parseISO(targetDate);

  // Activity cannot appear before its creation date
  if (target < activityDate) return false;

  // Always show activity on its original creation date
  if (activity.date === targetDate) return true;

  switch (activity.recurrence) {
    case 'none':
      return false;

    case 'daily':
      return true; // Every day from creation onwards

    case 'weekday': {
      const dayOfWeek = getDay(target); // 0=Sun, 1=Mon...6=Sat
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    }

    case 'weekly':
      return getDay(activityDate) === getDay(target);

    case 'monthly':
      return getDate(activityDate) === getDate(target);

    default:
      return false;
  }
}

/**
 * Expands a single activity for a specific target date.
 * Returns an ExpandedActivity if the activity matches the date, or null otherwise.
 */
function expandForDate(
  activity: ActivityRecord,
  targetDate: string,
  completions?: ActivityCompletionRecord[]
): ExpandedActivity | null {
  if (!matchesDate(activity, targetDate)) {
    return null;
  }

  const completedOnDate = completions
    ? completions.some((c) => c.date === targetDate && c.completed)
    : false;

  return {
    ...activity,
    isRecurrenceInstance: activity.date !== targetDate,
    instanceDate: targetDate,
    completedOnDate,
  };
}

/**
 * Expands a single activity across a date range [startDate, endDate].
 * Iterates day by day and collects all matches.
 * Uses a Map<string, boolean> for completions lookup for O(1) access.
 */
function expandForRange(
  activity: ActivityRecord,
  startDate: string,
  endDate: string,
  completions?: ActivityCompletionRecord[]
): ExpandedActivity[] {
  const results: ExpandedActivity[] = [];

  // Build completions lookup map for O(1) access
  const completionsMap = new Map<string, boolean>();
  if (completions) {
    for (const c of completions) {
      completionsMap.set(c.date, c.completed);
    }
  }

  let current = parseISO(startDate);
  const end = parseISO(endDate);

  while (current <= end) {
    const dateStr = format(current, 'yyyy-MM-dd');

    if (matchesDate(activity, dateStr)) {
      results.push({
        ...activity,
        isRecurrenceInstance: activity.date !== dateStr,
        instanceDate: dateStr,
        completedOnDate: completionsMap.get(dateStr) ?? false,
      });
    }

    current = addDays(current, 1);
  }

  return results;
}

export const recurrenceService: IRecurrenceService = {
  matchesDate,
  expandForDate,
  expandForRange,
};
