import React from 'react';
import { cn } from '../lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
}) => {
  return (
    <header
      className={cn(
        'flex items-start justify-between gap-4 pb-6'
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0" role="group" aria-label="Page actions">
          {actions}
        </div>
      )}
    </header>
  );
};

PageHeader.displayName = 'PageHeader';
