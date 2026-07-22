import React from 'react';
import { Link } from 'react-router-dom';

export interface HistoryItemProps {
  weekNumber: number;
  year: number;
  hasReview: boolean;
  isLocked: boolean;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({
  weekNumber,
  year,
  hasReview,
}) => {
  return (
    <Link
      to={`/weekly-review/${year}/${weekNumber}`}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="text-base" aria-hidden="true">
        {hasReview ? '✔' : '○'}
      </span>
      <span>Semana {weekNumber}</span>
    </Link>
  );
};
