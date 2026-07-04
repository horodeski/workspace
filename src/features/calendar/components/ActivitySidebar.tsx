import { useState } from 'react';
import { format, isBefore, isToday, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, Clock, Repeat, ChevronRight, CalendarDays, Sun, Sunset, Moon, Paperclip, FileText, AlertTriangle } from 'lucide-react';
import { useCalendarStore } from '../hooks/useCalendarStore';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/Button';
import { Activity, RecurrenceType, PriorityType } from '../types/calendar.types';
import { AddActivityDialog } from './AddActivityDialog';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: 'Não repete',
  weekday: 'Dias úteis',
  daily: 'Diariamente',
  weekly: 'Semanalmente',
  monthly: 'Mensalmente',
};

const PRIORITY_COLORS: Record<PriorityType, string> = {
  low: 'bg-blue-400',
  medium: 'bg-yellow-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-500',
};

type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'no-time';

function getTimePeriod(startTime: string | null): TimePeriod {
  if (!startTime) return 'no-time';
  const hour = parseInt(startTime.split(':')[0], 10);
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

const PERIOD_CONFIG: Record<TimePeriod, { label: string; icon: typeof Sun }> = {
  morning: { label: 'Manhã', icon: Sun },
  afternoon: { label: 'Tarde', icon: Sunset },
  evening: { label: 'Noite', icon: Moon },
  'no-time': { label: 'Sem horário', icon: CalendarDays },
};

function isActivityOverdue(activity: Activity): boolean {
  if (activity.completed) return false;

  const now = new Date();
  const activityDate = parse(activity.date, 'yyyy-MM-dd', new Date());

  // If the activity date is before today, it's overdue
  if (isBefore(activityDate, now) && !isToday(activityDate)) return true;

  // If it's today, has a startTime and duration, check if it should have ended
  if (isToday(activityDate) && activity.startTime && activity.duration) {
    const [hours, minutes] = activity.startTime.split(':').map(Number);
    const endDateTime = new Date();
    endDateTime.setHours(hours, minutes + activity.duration, 0, 0);
    if (isBefore(endDateTime, now)) return true;
  }

  return false;
}

function groupActivitiesByPeriod(activities: Activity[]) {
  const groups: Record<TimePeriod, Activity[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    'no-time': [],
  };

  for (const activity of activities) {
    const period = getTimePeriod(activity.startTime);
    groups[period].push(activity);
  }

  // Sort within each group by startTime
  for (const key of Object.keys(groups) as TimePeriod[]) {
    groups[key].sort((a, b) => {
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      return a.createdAt.localeCompare(b.createdAt);
    });
  }

  return groups;
}

interface ActivitySidebarProps {
  hasSelectedDate: boolean;
}

export function ActivitySidebar({ hasSelectedDate }: ActivitySidebarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);

  const selectedDate = useCalendarStore((state) => state.selectedDate);
  // Subscribe to activities array to trigger re-renders on changes
  useCalendarStore((state) => state.activities);
  const toggleActivity = useCalendarStore((state) => state.toggleActivity);
  const removeActivity = useCalendarStore((state) => state.removeActivity);
  const openActivityDetail = useCalendarStore((state) => state.openActivityDetail);
  const getActivitiesForDate = useCalendarStore((state) => state.getActivitiesForDate);

  if (!hasSelectedDate) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
        <CalendarDays className="w-10 h-10 text-zinc-600" />
        <p className="text-sm">Selecione um dia</p>
      </div>
    );
  }

  const dayActivities = getActivitiesForDate(selectedDate);
  const groups = groupActivitiesByPeriod(dayActivities);
  const dateLabel = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });
  const completedCount = dayActivities.filter((a) => a.completed).length;

  const periodsToShow: TimePeriod[] = (['morning', 'afternoon', 'evening', 'no-time'] as TimePeriod[]).filter(
    (p) => groups[p].length > 0
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 capitalize">{dateLabel}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {dayActivities.length === 0
              ? 'Nenhuma atividade'
              : `${completedCount}/${dayActivities.length} concluídas`}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          aria-label="Nova atividade"
          className="flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova</span>
        </Button>
      </div>

      {/* Activities list */}
      <div className="flex-1 overflow-y-auto p-4">
        {dayActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-2">
            <CalendarDays className="w-8 h-8 text-zinc-600" />
            <p className="text-sm">Nenhuma atividade para este dia.</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="mt-2 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Criar atividade
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {periodsToShow.map((period) => {
              const PeriodIcon = PERIOD_CONFIG[period].icon;
              const periodActivities = groups[period];

              return (
                <section key={period}>
                  {/* Period divider */}
                  <div className="flex items-center gap-2 mb-2">
                    <PeriodIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-500 uppercase">
                      {PERIOD_CONFIG[period].label}
                    </span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>

                  {/* Activities in this period */}
                  <ul className="flex flex-col gap-2" role="list">
                    {periodActivities.map((activity) => {
                      const overdue = isActivityOverdue(activity);

                      return (
                        <li
                          key={activity.id}
                          className={`flex items-start gap-3 rounded-md border p-3 group transition-colors relative overflow-hidden ${
                            activity.completed
                              ? 'border-zinc-800/50 bg-zinc-900/30 opacity-60'
                              : overdue
                                ? 'border-red-500/40 bg-red-500/5 hover:border-red-500/60'
                                : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {/* Priority indicator bar */}
                          {activity.priority && !activity.completed && (
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${PRIORITY_COLORS[activity.priority]}`} />
                          )}
                          <Checkbox
                            checked={activity.completed}
                            onCheckedChange={() => toggleActivity(activity.id)}
                            className="mt-0.5"
                            aria-label={`Marcar "${activity.title}" como ${activity.completed ? 'pendente' : 'concluída'}`}
                          />
                          <button
                            type="button"
                            className="flex-1 text-left min-w-0"
                            onClick={() => openActivityDetail(activity)}
                            aria-label={`Abrir detalhes de "${activity.title}"`}
                          >
                            <div className="flex items-center gap-1.5">
                              {overdue && (
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              )}
                              <span
                                className={`block text-sm truncate ${
                                  activity.completed
                                    ? 'line-through text-zinc-600'
                                    : overdue
                                      ? 'text-red-300'
                                      : 'text-zinc-100'
                                }`}
                              >
                                {activity.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {activity.startTime && (
                                <span className={`flex items-center gap-1 text-xs ${overdue && !activity.completed ? 'text-red-400/70' : 'text-zinc-500'}`}>
                                  <Clock className="w-3 h-3" />
                                  {activity.startTime}
                                  {activity.duration && ` (${activity.duration >= 60 ? `${Math.floor(activity.duration / 60)}h${activity.duration % 60 > 0 ? `${activity.duration % 60}min` : ''}` : `${activity.duration}min`})`}
                                </span>
                              )}
                              {overdue && !activity.completed && (
                                <span className="text-xs text-red-400 font-medium">Atrasado</span>
                              )}
                              {activity.recurrence !== 'none' && (
                                <span className="flex items-center gap-1 text-xs text-zinc-500">
                                  <Repeat className="w-3 h-3" />
                                  {RECURRENCE_LABELS[activity.recurrence]}
                                </span>
                              )}
                              {activity.description && activity.description !== '<p></p>' && (
                                <span className="flex items-center gap-1 text-xs text-zinc-500" title="Tem notas">
                                  <FileText className="w-3 h-3" />
                                </span>
                              )}
                              {activity.attachments.length > 0 && (
                                <span className="flex items-center gap-1 text-xs text-zinc-500" title={`${activity.attachments.length} anexo(s)`}>
                                  <Paperclip className="w-3 h-3" />
                                  <span>{activity.attachments.length}</span>
                                </span>
                              )}
                            </div>
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openActivityDetail(activity)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-100 p-1"
                              aria-label={`Ver detalhes de "${activity.title}"`}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(activity)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400 p-1"
                              aria-label={`Remover "${activity.title}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Add activity dialog */}
      <AddActivityDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

      {/* Confirm delete dialog */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget?.title || ''}
        onConfirm={() => {
          if (deleteTarget) {
            removeActivity(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
