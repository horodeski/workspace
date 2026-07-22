import React from 'react';
import { Button } from '@/components/ui/button';

export interface LockedBannerProps {
  onUnlock: () => void;
}

export const LockedBanner: React.FC<LockedBannerProps> = ({ onUnlock }) => {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4">
      <p className="text-sm font-bold text-foreground">Concluída.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Esta revisão representa sua percepção naquele momento.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={onUnlock}
      >
        Desbloquear edição
      </Button>
    </div>
  );
};

LockedBanner.displayName = 'LockedBanner';
