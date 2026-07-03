import React from 'react';

import { EmptyState } from '../../../components/EmptyState';
import { JournalEntry } from '../../journal/types/journal.types';
import { useReportStore } from '../hooks/useReportStore';
import { ReportPeriod } from '../types/report.types';

export interface ReportViewerProps {
  entries: JournalEntry[];
  period: ReportPeriod;
}

function formatDateHeader(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  entries,
  period,
}) => {
  const { generateReport } = useReportStore();
  const report = generateReport(entries, period);

  if (report.sections.length === 0) {
    return (
      <EmptyState
        title="Nenhum registro encontrado"
        description="Não há entradas de journal para o período selecionado."
      />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{report.title}</h2>

      <div className="space-y-6">
        {report.sections.map((section) => (
          <section
            key={section.date}
            className="rounded-lg border border-border bg-card p-4"
          >
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {formatDateHeader(section.date)}
            </h3>

            <ul className="space-y-3">
              {section.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-md bg-muted/50 p-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap"
                >
                  {entry.formattedText}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};

ReportViewer.displayName = 'ReportViewer';
