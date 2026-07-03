import React from 'react';
import { Badge } from '../../../components/Badge';
import { cn } from '../../../lib/utils';
import { Frequency, Routine } from '../types/routine.types';

export interface RoutineCardProps {
  routine: Routine;
  onToggleComplete: (id: string) => void;
}

const frequencyLabel: Record<Frequency, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  sprint: 'Sprint',
};

const frequencyVariant: Record<Frequency, 'default' | 'success' | 'warning'> = {
  daily: 'default',
  weekly: 'success',
  sprint: 'warning',
};

export const RoutineCard: React.FC<RoutineCardProps> = ({
  routine,
  onToggleComplete,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all',
        routine.completed && 'opacity-50'
      )}
    >
      <input
        type="checkbox"
        checked={routine.completed}
        onChange={() => onToggleComplete(routine.id)}
        className="h-4 w-4 rounded border-border bg-background accent-primary cursor-pointer"
        aria-label={`Marcar "${routine.title}" como ${routine.completed ? 'pendente' : 'concluída'}`}
      />

      <span
        className={cn(
          'flex-1 text-sm text-foreground',
          routine.completed && 'line-through text-muted-foreground'
        )}
      >
        {routine.title}
      </span>

      <Badge variant={frequencyVariant[routine.frequency]}>
        {frequencyLabel[routine.frequency]}
      </Badge>
    </div>
  );
};

RoutineCard.displayName = 'RoutineCard';
