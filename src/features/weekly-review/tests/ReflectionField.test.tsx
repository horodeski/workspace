import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ReflectionField } from '../components/ReflectionField';

// Tiptap requires a more complete DOM environment.
// These tests validate the wrapper structure and props.

describe('ReflectionField', () => {
  const defaultProps = {
    id: 'learning',
    emoji: '💡',
    label: 'Aprendizados',
    placeholder: 'O que você aprendeu esta semana?',
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the label with emoji', () => {
    render(<ReflectionField {...defaultProps} />);
    const label = screen.getByText('💡 Aprendizados');
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for', 'learning');
  });

  it('renders the character counter showing 0 for empty content', async () => {
    render(<ReflectionField {...defaultProps} value="" />);
    await waitFor(() => {
      expect(screen.getByText('0 / 500 caracteres')).toBeInTheDocument();
    });
  });

  it('renders the character counter with correct count for content', async () => {
    render(<ReflectionField {...defaultProps} value="<p>Hello</p>" />);
    await waitFor(() => {
      expect(screen.getByText('5 / 500 caracteres')).toBeInTheDocument();
    });
  });

  it('marks counter as aria-live="polite"', async () => {
    render(<ReflectionField {...defaultProps} />);
    await waitFor(() => {
      const counter = screen.getByText('0 / 500 caracteres');
      expect(counter).toHaveAttribute('aria-live', 'polite');
    });
  });

  it('displays validation error when present', async () => {
    render(
      <ReflectionField
        {...defaultProps}
        error="Preencha pelo menos um campo para salvar a revisão."
      />
    );
    await waitFor(() => {
      expect(
        screen.getByText('Preencha pelo menos um campo para salvar a revisão.')
      ).toBeInTheDocument();
    });
  });

  it('renders error with role="alert"', async () => {
    render(<ReflectionField {...defaultProps} error="Erro" />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Erro');
    });
  });

  it('renders toolbar buttons when not disabled', async () => {
    render(<ReflectionField {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByLabelText('Negrito')).toBeInTheDocument();
      expect(screen.getByLabelText('Itálico')).toBeInTheDocument();
      expect(screen.getByLabelText('Sublinhado')).toBeInTheDocument();
      expect(screen.getByLabelText('Lista')).toBeInTheDocument();
      expect(screen.getByLabelText('Lista numerada')).toBeInTheDocument();
    });
  });

  it('does not render toolbar when disabled', async () => {
    render(<ReflectionField {...defaultProps} disabled />);
    await waitFor(() => {
      expect(screen.queryByLabelText('Negrito')).not.toBeInTheDocument();
    });
  });
});
