import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

const frequencyVariant: Record<Frequency, 'secondary' | 'success' | 'warning'> = {
  daily: 'secondary',
  weekly: 'success',
  sprint: 'warning',
};

export const RoutineCard: React.FC<RoutineCardProps> = ({
  routine,
  onToggleComplete,
}) => {
  return (
    <Card
      className={cn(
        'rounded-lg shadow-none transition-all',
        routine.completed && 'opacity-50'
      )}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <Checkbox
          checked={routine.completed}
          onCheckedChange={() => onToggleComplete(routine.id)}
          aria-label={`Marcar "${routine.title}" como ${routine.completed ? 'pendente' : 'concluída'}`}
          className="cursor-pointer"
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
      </CardContent>
    </Card>
  );
};

RoutineCard.displayName = 'RoutineCard';
