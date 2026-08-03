import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface ReviewHeaderProps {
  weekNumber: number;
  dateRange: string;
}

export const ReviewHeader: React.FC<ReviewHeaderProps> = ({
  weekNumber,
  dateRange,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/weekly-review');
  };

  return (
    <header className="mb-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleBack}
          className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          aria-label="Voltar para Weekly Review"
        >
          <span className="text-lg" aria-hidden="true">
            ←
          </span>
        </button>
        <h1 className="text-lg font-medium text-foreground">Weekly Review</h1>
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">
        Semana {weekNumber}
      </p>
      <p className="text-sm text-muted-foreground">{dateRange}</p>
    </header>
  );
};

ReviewHeader.displayName = 'ReviewHeader';
