import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '../components/FilterBar';

describe('FilterBar', () => {
  it('renders all filter options with Portuguese labels', () => {
    render(<FilterBar value="all" onChange={() => {}} />);

    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Citação')).toBeInTheDocument();
    expect(screen.getByText('Imagem')).toBeInTheDocument();
    expect(screen.getByText('Link')).toBeInTheDocument();
    expect(screen.getByText('Nota')).toBeInTheDocument();
  });

  it('defaults to "All" (Todos) selected on mount', () => {
    render(<FilterBar value="all" onChange={() => {}} />);

    const allButton = screen.getByText('Todos');
    expect(allButton).toHaveAttribute('data-state', 'on');
  });

  it('calls onChange with the selected filter value', () => {
    const handleChange = jest.fn();

    render(<FilterBar value="all" onChange={handleChange} />);

    fireEvent.click(screen.getByText('Citação'));
    expect(handleChange).toHaveBeenCalledWith('quote');
  });

  it('highlights the currently active filter', () => {
    render(<FilterBar value="image" onChange={() => {}} />);

    const imageButton = screen.getByText('Imagem');
    expect(imageButton).toHaveAttribute('data-state', 'on');

    const allButton = screen.getByText('Todos');
    expect(allButton).toHaveAttribute('data-state', 'off');
  });

  it('does not call onChange when deselecting the current filter (prevents empty state)', () => {
    const handleChange = jest.fn();

    render(<FilterBar value="note" onChange={handleChange} />);

    fireEvent.click(screen.getByText('Nota'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('has accessible aria-label on the toggle group', () => {
    render(<FilterBar value="all" onChange={() => {}} />);

    expect(
      screen.getByRole('radiogroup', { name: 'Filtrar itens por tipo' })
    ).toBeInTheDocument();
  });
});
