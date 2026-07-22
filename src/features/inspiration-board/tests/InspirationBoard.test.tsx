import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InspirationBoard } from '../components/InspirationBoard';
import { useBoardStore } from '../hooks/useBoardStore';
import type { BoardItem } from '../types/board.types';

// Mock the Dialog portal so it renders inline for testing
jest.mock('@/components/ui/dialog', () => {
  const actual = jest.requireActual('@/components/ui/dialog');
  return {
    ...actual,
    DialogContent: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div role="dialog" {...props}>
        {children}
      </div>
    ),
    DialogPortal: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

function createItem(overrides: Partial<BoardItem> = {}): BoardItem {
  return {
    id: crypto.randomUUID(),
    content: 'Test content',
    type: 'quote',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    position: { x: 100, y: 100 },
    size: { width: 240, height: 180 },
    ...overrides,
  };
}

describe('InspirationBoard', () => {
  beforeEach(() => {
    useBoardStore.setState({ items: [] });
  });

  describe('Filter defaults', () => {
    it('should default filter to "Todos" on mount', () => {
      render(<InspirationBoard />);

      const todosToggle = screen.getByRole('radio', {
        name: /filtrar por todos/i,
      });
      expect(todosToggle).toHaveAttribute('data-state', 'on');
    });

    it('should show all items when "Todos" is selected', () => {
      useBoardStore.setState({
        items: [
          createItem({ id: '1', content: 'Quote item', type: 'quote' }),
          createItem({ id: '2', content: 'Note item', type: 'note' }),
        ],
      });

      render(<InspirationBoard />);

      expect(screen.getByText('Quote item')).toBeInTheDocument();
      expect(screen.getByText('Note item')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should display "Nenhuma inspiração ainda" when no items exist', () => {
      render(<InspirationBoard />);

      expect(
        screen.getByText('Nenhuma inspiração ainda')
      ).toBeInTheDocument();
    });

    it('should display "Nenhum item encontrado" when no items match the selected filter', () => {
      useBoardStore.setState({
        items: [createItem({ id: '1', content: 'A quote', type: 'quote' })],
      });

      render(<InspirationBoard />);

      // Select the "Imagem" filter — no image items exist
      const imagemToggle = screen.getByRole('radio', {
        name: /filtrar por imagem/i,
      });
      fireEvent.click(imagemToggle);

      expect(screen.getByText('Nenhum item encontrado')).toBeInTheDocument();
    });
  });

  describe('Edit mode dialog', () => {
    it('should pre-populate the form fields when edit is triggered', async () => {
      useBoardStore.setState({
        items: [
          createItem({
            id: 'edit-1',
            content: 'Citação inspiradora',
            type: 'quote',
          }),
        ],
      });

      render(<InspirationBoard />);

      // Click the edit button on the item card
      const editButton = screen.getByRole('button', { name: /edit quote/i });
      fireEvent.click(editButton);

      // The dialog should open with the form pre-populated
      await waitFor(() => {
        expect(screen.getByText('Editar inspiração')).toBeInTheDocument();
      });

      const textarea = screen.getByLabelText('Conteúdo');
      expect(textarea).toHaveValue('Citação inspiradora');
    });

    it('should show dialog title "Nova inspiração" when adding a new item', async () => {
      render(<InspirationBoard />);

      // Use exact text to distinguish from "Adicionar primeiro item" in EmptyState
      const addButton = screen.getByRole('button', { name: 'Adicionar' });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Nova inspiração')).toBeInTheDocument();
      });
    });
  });

  describe('Form validation in dialog context', () => {
    it('should display validation error for empty content when submitting from dialog', async () => {
      render(<InspirationBoard />);

      // Open the add dialog - use exact text to distinguish from "Adicionar primeiro item"
      const addButton = screen.getByRole('button', { name: 'Adicionar' });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Nova inspiração')).toBeInTheDocument();
      });

      // Submit without filling in any fields
      const saveButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('O conteúdo é obrigatório')
        ).toBeInTheDocument();
      });
    });

    it('should display validation error when type is not selected', async () => {
      render(<InspirationBoard />);

      // Open the add dialog - use exact text to distinguish from "Adicionar primeiro item"
      const addButton = screen.getByRole('button', { name: 'Adicionar' });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Nova inspiração')).toBeInTheDocument();
      });

      // Fill content but don't select a type
      const textarea = screen.getByLabelText('Conteúdo');
      fireEvent.change(textarea, { target: { value: 'Some valid content' } });

      const saveButton = screen.getByRole('button', { name: /salvar/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Selecione um tipo')).toBeInTheDocument();
      });
    });
  });
});
