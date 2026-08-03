import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../services/weekCalculation', () => ({
  ...jest.requireActual('../services/weekCalculation'),
  getISOWeekData: () => ({ weekNumber: 31, year: 2025 }),
}));

function renderEmptyState() {
  return render(
    <MemoryRouter>
      <EmptyState />
    </MemoryRouter>
  );
}

describe('EmptyState', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders "Weekly Review" title', () => {
    renderEmptyState();
    expect(screen.getByText('Weekly Review')).toBeInTheDocument();
  });

  it('renders the Portuguese description message', () => {
    renderEmptyState();
    expect(
      screen.getByText(
        'Nenhuma revisão encontrada. As Weekly Reviews ajudam você a refletir sobre o que aprendeu, as decisões que tomou e onde deseja evoluir.'
      )
    ).toBeInTheDocument();
  });

  it('renders "Criar primeira revisão" button', () => {
    renderEmptyState();
    expect(
      screen.getByRole('button', { name: 'Criar primeira revisão' })
    ).toBeInTheDocument();
  });

  it('navigates to the current week edit route on button click', () => {
    renderEmptyState();
    const button = screen.getByRole('button', { name: 'Criar primeira revisão' });
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/weekly-review/2025/31');
  });
});
