import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardNameInput } from '../components/BoardNameInput';

describe('BoardNameInput', () => {
  const defaultName = 'Test Board';

  it('renders the board name as text by default', () => {
    const onRename = jest.fn();
    render(<BoardNameInput name={defaultName} onRename={onRename} />);

    expect(screen.getByTestId('board-name-display')).toHaveTextContent(defaultName);
    expect(screen.queryByTestId('board-name-input')).not.toBeInTheDocument();
  });

  it('enters edit mode on double-click', () => {
    const onRename = jest.fn();
    render(<BoardNameInput name={defaultName} onRename={onRename} />);

    fireEvent.doubleClick(screen.getByTestId('board-name-display'));

    expect(screen.queryByTestId('board-name-display')).not.toBeInTheDocument();
    const input = screen.getByTestId('board-name-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(defaultName);
  });

  it('confirms rename on Enter key when valid', () => {
    const onRename = jest.fn().mockReturnValue({ success: true });
    render(<BoardNameInput name={defaultName} onRename={onRename} />);

    fireEvent.doubleClick(screen.getByTestId('board-name-display'));
    const input = screen.getByTestId('board-name-input');

    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRename).toHaveBeenCalledWith('New Name');
    // Should exit edit mode on success
    expect(screen.getByTestId('board-name-display')).toBeInTheDocument();
    expect(screen.queryByTestId('board-name-input')).not.toBeInTheDocument();
  });

  it('shows error message and stays in edit mode when rename fails', () => {
    const onRename = jest.fn().mockReturnValue({ success: false, error: 'O nome é obrigatório' });
    render(<BoardNameInput name={defaultName} onRename={onRename} />);

    fireEvent.doubleClick(screen.getByTestId('board-name-display'));
    const input = screen.getByTestId('board-name-input');

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRename).toHaveBeenCalledWith('   ');
    // Should stay in edit mode
    expect(screen.getByTestId('board-name-input')).toBeInTheDocument();
    // Should show error
    expect(screen.getByTestId('board-name-error')).toHaveTextContent('O nome é obrigatório');
  });

  it('cancels edit and reverts name on Escape key', () => {
    const onRename = jest.fn();
    render(<BoardNameInput name={defaultName} onRename={onRename} />);

    fireEvent.doubleClick(screen.getByTestId('board-name-display'));
    const input = screen.getByTestId('board-name-input');

    fireEvent.change(input, { target: { value: 'Changed Name' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByTestId('board-name-display')).toHaveTextContent(defaultName);
    expect(screen.queryByTestId('board-name-input')).not.toBeInTheDocument();
  });

  it('cancels edit and reverts name on blur without Enter', () => {
    const onRename = jest.fn();
    render(<BoardNameInput name={defaultName} onRename={onRename} />);

    fireEvent.doubleClick(screen.getByTestId('board-name-display'));
    const input = screen.getByTestId('board-name-input');

    fireEvent.change(input, { target: { value: 'Changed Name' } });
    fireEvent.blur(input);

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByTestId('board-name-display')).toHaveTextContent(defaultName);
    expect(screen.queryByTestId('board-name-input')).not.toBeInTheDocument();
  });

  it('auto-focuses input when entering edit mode', () => {
    const onRename = jest.fn();
    render(<BoardNameInput name={defaultName} onRename={onRename} />);

    fireEvent.doubleClick(screen.getByTestId('board-name-display'));
    const input = screen.getByTestId('board-name-input');

    expect(document.activeElement).toBe(input);
  });
});
