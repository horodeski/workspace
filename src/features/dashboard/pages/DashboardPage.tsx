import { ListChecks, Inbox, BookOpen, LayoutDashboard } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { StatCard } from '../components/StatCard';
import { useRoutineStore } from '../../routine/hooks/useRoutineStore';
import { useInboxStore } from '../../inbox/hooks/useInboxStore';
import { useJournalStore } from '../../journal/hooks/useJournalStore';

export function DashboardPage() {
  const routines = useRoutineStore((state) => state.routines);
  const tasks = useInboxStore((state) => state.tasks);
  const getEntriesByPeriod = useJournalStore((state) => state.getEntriesByPeriod);

  const completedRoutines = routines.filter((r) => r.completed).length;
  const totalInboxTasks = tasks.length;
  const todayEntries = getEntriesByPeriod('today').length;

  const hasNoData = routines.length === 0 && totalInboxTasks === 0 && todayEntries === 0;

  if (hasNoData) {
    return (
      <div className="p-6">
        <PageHeader title="Dashboard" description="Visão geral do seu dia" />
        <EmptyState
          icon={<LayoutDashboard className="h-10 w-10" />}
          title="Nenhum dado ainda"
          description="Comece criando rotinas, capturando tarefas no inbox ou registrando entradas no journal."
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" description="Visão geral do seu dia" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Rotinas concluídas"
          value={completedRoutines}
          icon={<ListChecks className="h-5 w-5" />}
        />
        <StatCard
          title="Tarefas no Inbox"
          value={totalInboxTasks}
          icon={<Inbox className="h-5 w-5" />}
        />
        <StatCard
          title="Entradas hoje"
          value={todayEntries}
          icon={<BookOpen className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
