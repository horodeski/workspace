import { render, screen, fireEvent } from '@testing-library/react';
import { FreeformCanvas } from '../components/FreeformCanvas';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import type { BoardItem } from '../types/board.types';

const createItem = (overrides: Partial<BoardItem> = {}): BoardItem => ({
  id: 'item-1',
  content: 'Test content',
  type: 'note',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  position: { x: 100, y: 200 },
  size: { width: 240, height: 180 },
  ...overrides,
});

describe('FreeformCanvas', () => {
  const defaultProps = {
    items: [] as BoardItem[],
    emptyVariant: 'no-items' as const,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onAddItem: jest.fn(),
    onUpdatePosition: jest.fn(),
    onUpdateSize: jest.fn(),
  };

  describe('empty state', () => {
    it('shows EmptyState with no-items variant when items array is empty', () => {
      render(<FreeformCanvas {...defaultProps} />);

      expect(screen.getByText('Nenhuma inspiração ainda')).toBeInTheDocument();
    });

    it('shows EmptyState with no-filter-results variant when specified', () => {
      render(
        <FreeformCanvas {...defaultProps} emptyVariant="no-filter-results" />
      );

      expect(screen.getByText('Nenhum item encontrado')).toBeInTheDocument();
    });
  });

  describe('canvas container', () => {
    it('renders outer container with overflow auto', () => {
      const items = [createItem()];
      render(<FreeformCanvas {...defaultProps} items={items} />);

      const outer = screen.getByTestId('freeform-canvas');
      expect(outer).toHaveClass('overflow-auto');
    });

    it('renders inner container with canvas dimensions', () => {
      const items = [createItem()];
      render(<FreeformCanvas {...defaultProps} items={items} />);

      const inner = screen.getByTestId('freeform-canvas-inner');
      expect(inner).toHaveStyle({
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        minWidth: `${CANVAS_WIDTH}px`,
        minHeight: `${CANVAS_HEIGHT}px`,
      });
    });
  });

  describe('card rendering', () => {
    it('renders PostItCard for each item', () => {
      const items = [
        createItem({ id: 'a', position: { x: 150, y: 300 } }),
        createItem({ id: 'b', position: { x: 500, y: 700 } }),
      ];
      render(<FreeformCanvas {...defaultProps} items={items} />);

      expect(screen.getByTestId('postit-card-a')).toBeInTheDocument();
      expect(screen.getByTestId('postit-card-b')).toBeInTheDocument();
    });

    it('positions each card at item.position', () => {
      const items = [
        createItem({ id: 'a', position: { x: 150, y: 300 } }),
      ];
      render(<FreeformCanvas {...defaultProps} items={items} />);

      const card = screen.getByTestId('postit-card-a');
      expect(card).toHaveStyle({
        left: '150px',
        top: '300px',
      });
    });

    it('sets card dimensions from item.size', () => {
      const items = [createItem({ id: 'c', size: { width: 300, height: 200 } })];
      render(<FreeformCanvas {...defaultProps} items={items} />);

      const card = screen.getByTestId('postit-card-c');
      expect(card).toHaveStyle({
        width: '300px',
        height: '200px',
      });
    });
  });

  describe('z-index bring-to-front', () => {
    it('assigns higher z-index to card after click (bring-to-front)', () => {
      const items = [
        createItem({ id: 'x' }),
        createItem({ id: 'y', position: { x: 200, y: 200 } }),
      ];
      render(<FreeformCanvas {...defaultProps} items={items} />);

      const cardX = screen.getByTestId('postit-card-x');
      const cardY = screen.getByTestId('postit-card-y');

      // Initially both have z-index 0
      expect(cardX).toHaveStyle({ zIndex: '0' });
      expect(cardY).toHaveStyle({ zIndex: '0' });

      // Click card X → should get z-index 1
      fireEvent.click(cardX);
      expect(cardX).toHaveStyle({ zIndex: '1' });

      // Click card Y → should get z-index 2
      fireEvent.click(cardY);
      expect(cardY).toHaveStyle({ zIndex: '2' });

      // Card X remains at 1
      expect(cardX).toHaveStyle({ zIndex: '1' });
    });
  });

  describe('card actions', () => {
    it('calls onEdit when edit button is clicked', () => {
      const onEdit = jest.fn();
      const item = createItem({ id: 'e1' });
      render(<FreeformCanvas {...defaultProps} items={[item]} onEdit={onEdit} />);

      const editBtn = screen.getByLabelText('Edit note');
      fireEvent.click(editBtn);

      expect(onEdit).toHaveBeenCalledWith(item);
    });

    it('calls onDelete when delete button is clicked', () => {
      const onDelete = jest.fn();
      const item = createItem({ id: 'd1' });
      render(
        <FreeformCanvas {...defaultProps} items={[item]} onDelete={onDelete} />
      );

      const deleteBtn = screen.getByLabelText('Delete note');
      fireEvent.click(deleteBtn);

      expect(onDelete).toHaveBeenCalledWith('d1');
    });
  });
});
