import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface HistoryItemProps {
  weekNumber: number;
  year: number;
  hasReview: boolean;
  isLocked: boolean;
  isCurrent?: boolean;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({
  weekNumber,
  year,
  hasReview,
  isCurrent,
}) => {
  return (
    <Link
      to={`/weekly-review/${year}/${weekNumber}`}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isCurrent
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-foreground hover:bg-muted'
      )}
    >
      <span className="text-base" aria-hidden="true">
        {hasReview ? '✔' : '○'}
      </span>
      <span>Semana {weekNumber}</span>
      {isCurrent && (
        <span className="ml-auto text-xs text-muted-foreground font-normal">
          atual
        </span>
      )}
    </Link>
  );
};
