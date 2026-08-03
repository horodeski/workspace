import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReviewHeader } from '../components/ReviewHeader';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ReviewHeader', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const defaultProps = {
    weekNumber: 31,
    dateRange: '27 Jul → 02 Ago',
  };

  function renderHeader(props = defaultProps) {
    return render(
      <MemoryRouter>
        <ReviewHeader {...props} />
      </MemoryRouter>
    );
  }

  it('renders the "Weekly Review" title', () => {
    renderHeader();
    expect(screen.getByText('Weekly Review')).toBeInTheDocument();
  });

  it('renders the week number as "Semana {weekNumber}"', () => {
    renderHeader();
    expect(screen.getByText('Semana 31')).toBeInTheDocument();
  });

  it('renders the date range', () => {
    renderHeader();
    expect(screen.getByText('27 Jul → 02 Ago')).toBeInTheDocument();
  });

  it('renders the back arrow button with accessible label', () => {
    renderHeader();
    const backButton = screen.getByRole('button', {
      name: /voltar para weekly review/i,
    });
    expect(backButton).toBeInTheDocument();
  });

  it('navigates to /weekly-review when back arrow is clicked', () => {
    renderHeader();
    const backButton = screen.getByRole('button', {
      name: /voltar para weekly review/i,
    });
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/weekly-review');
  });

  it('renders back arrow and title on the same line', () => {
    renderHeader();
    const backButton = screen.getByRole('button', {
      name: /voltar para weekly review/i,
    });
    const title = screen.getByText('Weekly Review');
    // Both should share the same flex parent
    expect(backButton.parentElement).toBe(title.parentElement);
  });

  it('renders different week numbers correctly', () => {
    renderHeader({ weekNumber: 1, dateRange: '30 Dez 2024 → 05 Jan 2025' });
    expect(screen.getByText('Semana 1')).toBeInTheDocument();
    expect(screen.getByText('30 Dez 2024 → 05 Jan 2025')).toBeInTheDocument();
  });
});
