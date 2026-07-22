import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../components/EmptyState';

describe('EmptyState', () => {
  describe('variant: no-items', () => {
    it('displays empty board message prompting user to add first item', () => {
      render(<EmptyState variant="no-items" />);

      expect(screen.getByText('Nenhuma inspiração ainda')).toBeInTheDocument();
      expect(
        screen.getByText(/Comece adicionando seu primeiro item/)
      ).toBeInTheDocument();
    });

    it('renders the add item button when onAddItem is provided', () => {
      const onAddItem = jest.fn();
      render(<EmptyState variant="no-items" onAddItem={onAddItem} />);

      expect(
        screen.getByRole('button', { name: 'Adicionar primeiro item' })
      ).toBeInTheDocument();
    });

    it('calls onAddItem when the button is clicked', () => {
      const onAddItem = jest.fn();
      render(<EmptyState variant="no-items" onAddItem={onAddItem} />);

      fireEvent.click(
        screen.getByRole('button', { name: 'Adicionar primeiro item' })
      );

      expect(onAddItem).toHaveBeenCalledTimes(1);
    });

    it('does not render the button when onAddItem is not provided', () => {
      render(<EmptyState variant="no-items" />);

      expect(
        screen.queryByRole('button', { name: 'Adicionar primeiro item' })
      ).not.toBeInTheDocument();
    });
  });

  describe('variant: no-filter-results', () => {
    it('displays filter empty message', () => {
      render(<EmptyState variant="no-filter-results" />);

      expect(screen.getByText('Nenhum item encontrado')).toBeInTheDocument();
      expect(
        screen.getByText(/Não há itens para o filtro selecionado/)
      ).toBeInTheDocument();
    });

    it('does not render the add item button', () => {
      render(<EmptyState variant="no-filter-results" onAddItem={jest.fn()} />);

      expect(
        screen.queryByRole('button', { name: 'Adicionar primeiro item' })
      ).not.toBeInTheDocument();
    });
  });
});
