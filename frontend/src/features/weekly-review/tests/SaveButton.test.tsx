import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaveButton } from '../components/SaveButton';

describe('SaveButton', () => {
  const defaultProps = {
    onSave: jest.fn(),
    isSaving: false,
    showConfirmation: false,
  };

  beforeEach(() => {
    (defaultProps.onSave as jest.Mock).mockClear();
  });

  function renderButton(props = {}) {
    return render(<SaveButton {...defaultProps} {...props} />);
  }

  it('renders the "Salvar revisão" button', () => {
    renderButton();
    expect(
      screen.getByRole('button', { name: 'Salvar revisão' })
    ).toBeInTheDocument();
  });

  it('calls onSave when the button is clicked', () => {
    renderButton();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar revisão' }));
    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  it('disables the button when isSaving is true', () => {
    renderButton({ isSaving: true });
    expect(
      screen.getByRole('button', { name: 'Salvar revisão' })
    ).toBeDisabled();
  });

  it('does not disable the button when isSaving is false', () => {
    renderButton({ isSaving: false });
    expect(
      screen.getByRole('button', { name: 'Salvar revisão' })
    ).not.toBeDisabled();
  });

  it('shows confirmation message when showConfirmation is true', () => {
    renderButton({ showConfirmation: true });
    expect(
      screen.getByText('✓ Weekly Review salva. Até a próxima semana.')
    ).toBeInTheDocument();
  });

  it('does not show confirmation message when showConfirmation is false', () => {
    renderButton({ showConfirmation: false });
    expect(
      screen.queryByText('✓ Weekly Review salva. Até a próxima semana.')
    ).not.toBeInTheDocument();
  });

  it('has aria-live="polite" on the confirmation message', () => {
    renderButton({ showConfirmation: true });
    const confirmation = screen.getByText(
      '✓ Weekly Review salva. Até a próxima semana.'
    );
    expect(confirmation).toHaveAttribute('aria-live', 'polite');
  });

  it('shows error message when error prop is provided', () => {
    renderButton({ error: 'Não foi possível salvar a revisão.' });
    expect(
      screen.getByText('Não foi possível salvar a revisão.')
    ).toBeInTheDocument();
  });

  it('does not show error message when error prop is not provided', () => {
    renderButton();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('displays error with role="alert" for accessibility', () => {
    renderButton({ error: 'Erro ao salvar.' });
    expect(screen.getByRole('alert')).toHaveTextContent('Erro ao salvar.');
  });
});
