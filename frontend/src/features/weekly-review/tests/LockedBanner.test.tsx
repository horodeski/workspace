import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LockedBanner } from '../components/LockedBanner';

describe('LockedBanner', () => {
  const mockOnUnlock = jest.fn();

  beforeEach(() => {
    mockOnUnlock.mockClear();
  });

  function renderBanner(onUnlock = mockOnUnlock) {
    return render(<LockedBanner onUnlock={onUnlock} />);
  }

  it('renders "Concluída." in bold', () => {
    renderBanner();
    const text = screen.getByText('Concluída.');
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass('font-bold');
  });

  it('renders the explanatory text', () => {
    renderBanner();
    expect(
      screen.getByText('Esta revisão representa sua percepção naquele momento.')
    ).toBeInTheDocument();
  });

  it('renders the "Desbloquear edição" button', () => {
    renderBanner();
    expect(
      screen.getByRole('button', { name: 'Desbloquear edição' })
    ).toBeInTheDocument();
  });

  it('calls onUnlock when "Desbloquear edição" is clicked', () => {
    renderBanner();
    fireEvent.click(
      screen.getByRole('button', { name: 'Desbloquear edição' })
    );
    expect(mockOnUnlock).toHaveBeenCalledTimes(1);
  });
});
