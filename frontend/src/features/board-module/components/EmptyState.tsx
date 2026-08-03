import React from 'react';
import { Lightbulb, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
  variant: 'no-items' | 'no-filter-results';
  onAddItem?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant,
  onAddItem,
}) => {
  if (variant === 'no-items') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nenhuma inspiração ainda
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Comece adicionando seu primeiro item ao quadro. Pode ser uma citação,
          imagem, link ou nota.
        </p>
        {onAddItem && (
          <Button onClick={onAddItem}>Adicionar primeiro item</Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        Nenhum item encontrado
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Não há itens para o filtro selecionado. Tente outro filtro ou adicione
        novos itens.
      </p>
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
