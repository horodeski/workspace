import React from 'react';
import { Button } from '@/components/ui/button';

export interface SaveButtonProps {
  onSave: () => void;
  isSaving: boolean;
  showConfirmation: boolean;
  error?: string;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  onSave,
  isSaving,
  showConfirmation,
  error,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="default"
        onClick={onSave}
        disabled={isSaving}
      >
        Salvar revisão
      </Button>
      {showConfirmation && (
        <p
          className="text-sm text-green-600 dark:text-green-400"
          aria-live="polite"
        >
          ✓ Weekly Review salva. Até a próxima semana.
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

SaveButton.displayName = 'SaveButton';
