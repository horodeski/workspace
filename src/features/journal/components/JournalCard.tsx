import React from 'react';
import { cn } from '../../../lib/utils';
import type { JournalEntry } from '../types/journal.types';

export interface JournalCardProps {
  entry: JournalEntry;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const JournalCard: React.FC<JournalCardProps> = ({ entry }) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4',
        'flex flex-col gap-3'
      )}
    >
      <div className="flex items-center justify-between">
        <time
          className="text-xs text-muted-foreground"
          dateTime={entry.createdAt}
        >
          {formatDate(entry.createdAt)}
        </time>
      </div>

      <div className="flex flex-col gap-3">
        <section>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Original
          </h4>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {entry.rawText}
          </p>
        </section>

        <div className="border-t border-border" />

        <section>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Formatado
          </h4>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {entry.formattedText}
          </p>
        </section>
      </div>
    </div>
  );
};
