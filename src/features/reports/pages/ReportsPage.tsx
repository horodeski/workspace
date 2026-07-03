import React from 'react';

import { Button } from '../../../components/Button';
import { PageHeader } from '../../../components/PageHeader';
import { useJournalStore } from '../../journal/hooks/useJournalStore';
import { ReportViewer } from '../components/ReportViewer';
import { useReportStore } from '../hooks/useReportStore';
import { ReportPeriod } from '../types/report.types';

interface PeriodOption {
  value: ReportPeriod;
  label: string;
}

const periodOptions: PeriodOption[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
  { value: 'sprint', label: 'Sprint' },
];

export const ReportsPage: React.FC = () => {
  const { selectedPeriod, setSelectedPeriod } = useReportStore();
  const getEntriesByPeriod = useJournalStore((state) => state.getEntriesByPeriod);

  const entries = getEntriesByPeriod(selectedPeriod);

  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios" description="Visualize seus registros agrupados por período" />

      <div className="flex items-center gap-2" role="group" aria-label="Seleção de período">
        {periodOptions.map((option) => (
          <Button
            key={option.value}
            variant={selectedPeriod === option.value ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedPeriod(option.value)}
            aria-pressed={selectedPeriod === option.value}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <ReportViewer entries={entries} period={selectedPeriod} />
    </div>
  );
};

ReportsPage.displayName = 'ReportsPage';
