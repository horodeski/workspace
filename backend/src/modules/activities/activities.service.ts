import { activitiesRepository, type ActivityRecord } from './activities.repository.js';
import { recurrenceService, type ExpandedActivity } from './recurrence.service.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { eventBus } from '../../shared/event-bus/index.js';
import { sanitizeHtml } from '../../shared/utils/sanitization.js';
import type { CreateActivityInput, UpdateActivityInput } from './activities.schemas.js';

export interface IActivitiesService {
  create(userId: string, data: CreateActivityInput): Promise<ActivityRecord>;
  getByDate(userId: string, date: string): Promise<ExpandedActivity[]>;
  getByRange(userId: string, startDate: string, endDate: string): Promise<ExpandedActivity[]>;
  update(userId: string, id: string, data: UpdateActivityInput): Promise<ActivityRecord>;
  delete(userId: string, id: string): Promise<void>;
  toggleCompletion(userId: string, id: string, date: string): Promise<void>;
}

async function create(userId: string, data: CreateActivityInput): Promise<ActivityRecord> {
  const activity = await activitiesRepository.create(userId, {
    title: data.title,
    description: data.description ? sanitizeHtml(data.description) : data.description,
    date: data.date,
    startTime: data.startTime ?? null,
    duration: data.duration ?? null,
    recurrence: data.recurrence,
    priority: data.priority ?? null,
  });

  eventBus.publish({ type: 'activity.created', payload: { activityId: activity.id, userId } });

  return activity;
}

async function getByDate(userId: string, date: string): Promise<ExpandedActivity[]> {
  // Fetch all activities that could potentially appear on this date
  const activities = await activitiesRepository.findByDateRange(userId, date, date);

  const results: ExpandedActivity[] = [];

  for (const activity of activities) {
    const completions = activity.completions ?? [];
    const expanded = recurrenceService.expandForDate(activity, date, completions);
    if (expanded) {
      results.push(expanded);
    }
  }

  return results;
}

async function getByRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ExpandedActivity[]> {
  const activities = await activitiesRepository.findByDateRange(userId, startDate, endDate);

  const results: ExpandedActivity[] = [];

  for (const activity of activities) {
    const completions = activity.completions ?? [];
    const expanded = recurrenceService.expandForRange(activity, startDate, endDate, completions);
    results.push(...expanded);
  }

  return results;
}

async function update(
  userId: string,
  id: string,
  data: UpdateActivityInput
): Promise<ActivityRecord> {
  // Sanitize HTML in description if provided
  const sanitizedData = data.description !== undefined
    ? { ...data, description: sanitizeHtml(data.description) }
    : data;

  const updated = await activitiesRepository.update(id, userId, sanitizedData);

  if (!updated) {
    throw new NotFoundError('Atividade');
  }

  return updated;
}

async function deleteActivity(userId: string, id: string): Promise<void> {
  const deleted = await activitiesRepository.softDelete(id, userId);

  if (!deleted) {
    throw new NotFoundError('Atividade');
  }
}

async function toggleCompletion(userId: string, id: string, date: string): Promise<void> {
  // Verify ownership
  const activity = await activitiesRepository.findById(id, userId);

  if (!activity) {
    throw new NotFoundError('Atividade');
  }

  // Check current completion status for this specific date
  const completions = await activitiesRepository.findCompletions(id, [date]);
  const existing = completions.find((c) => c.date === date);

  // Toggle: if exists and completed, set to false; if not exists or !completed, set to true
  const newStatus = existing && existing.completed ? false : true;

  await activitiesRepository.upsertCompletion(id, date, newStatus);
}

export const activitiesService: IActivitiesService = {
  create,
  getByDate,
  getByRange,
  update,
  delete: deleteActivity,
  toggleCompletion,
};
