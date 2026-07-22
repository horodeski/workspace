import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { BoardFilter } from '../types/board.types';

export interface FilterBarProps {
  value: BoardFilter;
  onChange: (filter: BoardFilter) => void;
}

const filterOptions: { value: BoardFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'quote', label: 'Citação' },
  { value: 'image', label: 'Imagem' },
  { value: 'link', label: 'Link' },
  { value: 'note', label: 'Nota' },
];

export const FilterBar: React.FC<FilterBarProps> = ({ value, onChange }) => {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => {
        if (val) {
          onChange(val as BoardFilter);
        }
      }}
      aria-label="Filtrar itens por tipo"
    >
      {filterOptions.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={`Filtrar por ${option.label}`}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

FilterBar.displayName = 'FilterBar';
