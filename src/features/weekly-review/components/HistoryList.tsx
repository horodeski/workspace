import React from 'react';
import type { WeekHistoryItem } from '../types/review.types';
import { HistoryItem } from './HistoryItem';

export interface HistoryListProps {
  items: WeekHistoryItem[];
}

export const HistoryList: React.FC<HistoryListProps> = ({ items }) => {
  // Group items by year (items are already in reverse chronological order)
  const groupedByYear = items.reduce<Record<number, WeekHistoryItem[]>>(
    (groups, item) => {
      if (!groups[item.year]) {
        groups[item.year] = [];
      }
      groups[item.year].push(item);
      return groups;
    },
    {}
  );

  // Sort year keys in descending order to maintain reverse chronological grouping
  const sortedYears = Object.keys(groupedByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <section aria-label="Histórico de revisões">
      {sortedYears.map((year) => (
        <div key={year} className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-3">
            {year}
          </h3>
          <ul className="space-y-1">
            {groupedByYear[year].map((item) => (
              <li key={`${item.year}-${item.weekNumber}`}>
                <HistoryItem
                  weekNumber={item.weekNumber}
                  year={item.year}
                  hasReview={item.hasReview}
                  isLocked={item.isLocked}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
};
