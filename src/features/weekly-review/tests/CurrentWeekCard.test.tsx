import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CurrentWeekCard } from '../components/CurrentWeekCard';

function renderCard(props: Partial<React.ComponentProps<typeof CurrentWeekCard>> = {}) {
  const defaultProps = {
    weekNumber: 31,
    year: 2025,
    isLocked: false,
    updatedAt: new Date().toISOString(),
    ...props,
  };

  return render(
    <MemoryRouter>
      <CurrentWeekCard {...defaultProps} />
    </MemoryRouter>
  );
}

describe('CurrentWeekCard', () => {
  it('displays the week number as title', () => {
    renderCard({ weekNumber: 31 });
    expect(screen.getByText('Semana 31')).toBeInTheDocument();
  });

  it('displays "Concluída" status when isLocked is true', () => {
    renderCard({ isLocked: true });
    expect(screen.getByText('Concluída')).toBeInTheDocument();
  });

  it('displays "Em andamento" status when isLocked is false', () => {
    renderCard({ isLocked: false });
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
  });

  it('displays formatted relative timestamp with "Última edição" prefix', () => {
    const now = new Date();
    renderCard({ updatedAt: now.toISOString() });
    // Should contain "Última edição Hoje às HH:mm"
    const element = screen.getByText(/Última edição Hoje às \d{2}:\d{2}/);
    expect(element).toBeInTheDocument();
  });

  it('renders "Abrir" link pointing to correct route', () => {
    renderCard({ weekNumber: 31, year: 2025 });
    const link = screen.getByRole('link', { name: 'Abrir' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/weekly-review/2025/31');
  });

  it('renders "Abrir" link with correct route for different year/week', () => {
    renderCard({ weekNumber: 5, year: 2026 });
    const link = screen.getByRole('link', { name: 'Abrir' });
    expect(link).toHaveAttribute('href', '/weekly-review/2026/5');
  });
});
