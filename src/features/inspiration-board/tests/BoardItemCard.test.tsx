import { render, screen, fireEvent } from '@testing-library/react';
import { BoardItemCard } from '../components/BoardItemCard';
import type { BoardItem } from '../types/board.types';

const mockItem: BoardItem = {
  id: 'test-id-1',
  content: 'Uma citação inspiradora para o dia',
  type: 'quote',
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
};

describe('BoardItemCard', () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the item content', () => {
    render(<BoardItemCard item={mockItem} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText(mockItem.content)).toBeInTheDocument();
  });

  it('should display the type badge for quote', () => {
    render(<BoardItemCard item={mockItem} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Citação')).toBeInTheDocument();
  });

  it('should display the type badge for image', () => {
    const imageItem: BoardItem = { ...mockItem, type: 'image' };
    render(<BoardItemCard item={imageItem} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Imagem')).toBeInTheDocument();
  });

  it('should display the type badge for link', () => {
    const linkItem: BoardItem = { ...mockItem, type: 'link' };
    render(<BoardItemCard item={linkItem} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Link')).toBeInTheDocument();
  });

  it('should display the type badge for note', () => {
    const noteItem: BoardItem = { ...mockItem, type: 'note' };
    render(<BoardItemCard item={noteItem} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Nota')).toBeInTheDocument();
  });

  it('should call onEdit with the item when edit button is clicked', () => {
    render(<BoardItemCard item={mockItem} onEdit={onEdit} onDelete={onDelete} />);

    const editButton = screen.getByRole('button', { name: /editar item/i });
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(mockItem);
  });

  it('should call onDelete with the item id when delete button is clicked', () => {
    render(<BoardItemCard item={mockItem} onEdit={onEdit} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: /excluir item/i });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(mockItem.id);
  });

  it('should truncate long content visually via line-clamp', () => {
    const longItem: BoardItem = {
      ...mockItem,
      content: 'A'.repeat(500),
    };
    render(<BoardItemCard item={longItem} onEdit={onEdit} onDelete={onDelete} />);

    const contentElement = screen.getByText('A'.repeat(500));
    expect(contentElement).toHaveClass('line-clamp-4');
  });
});
