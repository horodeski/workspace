import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog';

describe('ConfirmDeleteDialog', () => {
  const defaultProps = {
    boardName: 'Meu Quadro',
    disabled: false,
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    (defaultProps.onConfirm as jest.Mock).mockClear();
  });

  function renderDialog(props = {}) {
    return render(<ConfirmDeleteDialog {...defaultProps} {...props} />);
  }

  it('renders the delete trigger button', () => {
    renderDialog();
    expect(screen.getByTestId('delete-board-trigger')).toBeInTheDocument();
  });

  it('disables the trigger button when disabled prop is true', () => {
    renderDialog({ disabled: true });
    expect(screen.getByTestId('delete-board-trigger')).toBeDisabled();
  });

  it('enables the trigger button when disabled prop is false', () => {
    renderDialog({ disabled: false });
    expect(screen.getByTestId('delete-board-trigger')).not.toBeDisabled();
  });

  it('opens the dialog when trigger is clicked', () => {
    renderDialog();
    fireEvent.click(screen.getByTestId('delete-board-trigger'));
    expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
  });

  it('displays the dialog title "Excluir quadro"', () => {
    renderDialog();
    fireEvent.click(screen.getByTestId('delete-board-trigger'));
    expect(screen.getByText('Excluir quadro')).toBeInTheDocument();
  });

  it('displays the board name in the dialog description', () => {
    renderDialog({ boardName: 'Trabalho' });
    fireEvent.click(screen.getByTestId('delete-board-trigger'));
    expect(screen.getByText(/Trabalho/)).toBeInTheDocument();
  });

  it('informs that the deletion is permanent', () => {
    renderDialog();
    fireEvent.click(screen.getByTestId('delete-board-trigger'));
    expect(
      screen.getByText(/Esta ação é permanente e não pode ser desfeita/)
    ).toBeInTheDocument();
  });

  it('calls onConfirm and closes dialog when confirm button is clicked', () => {
    renderDialog();
    fireEvent.click(screen.getByTestId('delete-board-trigger'));
    fireEvent.click(screen.getByTestId('confirm-delete-button'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument();
  });

  it('closes dialog without calling onConfirm when cancel button is clicked', () => {
    renderDialog();
    fireEvent.click(screen.getByTestId('delete-board-trigger'));
    fireEvent.click(screen.getByTestId('cancel-delete-button'));
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument();
  });

  it('does not open dialog when trigger is disabled', () => {
    renderDialog({ disabled: true });
    fireEvent.click(screen.getByTestId('delete-board-trigger'));
    expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument();
  });
});
