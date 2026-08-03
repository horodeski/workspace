import React from 'react';
import { Link } from 'react-router-dom';
import { formatRelativeTimestamp } from '../services/weekCalculation';

export interface CurrentWeekCardProps {
  weekNumber: number;
  year: number;
  isLocked: boolean;
  updatedAt: string; // ISO datetime string for formatRelativeTimestamp
}

export const CurrentWeekCard: React.FC<CurrentWeekCardProps> = ({
  weekNumber,
  year,
  isLocked,
  updatedAt,
}) => {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">
            Semana {weekNumber}
          </h3>
          <span
            className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              isLocked
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}
          >
            {isLocked ? 'Concluída' : 'Em andamento'}
          </span>
          <p className="text-sm text-muted-foreground">
            Última edição {formatRelativeTimestamp(updatedAt)}
          </p>
        </div>
        <Link
          to={`/weekly-review/${year}/${weekNumber}`}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Abrir
        </Link>
      </div>
    </div>
  );
};
