import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getISOWeekData } from '../services/weekCalculation';

export const EmptyState: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateFirstReview = () => {
    const { weekNumber, year } = getISOWeekData(new Date());
    navigate(`/weekly-review/${year}/${weekNumber}`);
  };

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      role="status"
      aria-label="Weekly Review"
    >
      <h2 className="text-lg font-medium text-foreground">Weekly Review</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Nenhuma revisão encontrada. As Weekly Reviews ajudam você a refletir
        sobre o que aprendeu, as decisões que tomou e onde deseja evoluir.
      </p>
      <Button
        variant="default"
        size="sm"
        className="mt-6"
        onClick={handleCreateFirstReview}
      >
        Criar primeira revisão
      </Button>
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
