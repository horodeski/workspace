import { render, screen, fireEvent } from '@testing-library/react';
import { PostItCard } from '../components/PostItCard';
import type { BoardItem } from '../types/board.types';

const createMockItem = (overrides: Partial<BoardItem> = {}): BoardItem => ({
  id: 'test-id-1',
  content: 'A short note for testing',
  type: 'note',
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
  position: { x: 100, y: 150 },
  size: { width: 240, height: 180 },
  ...overrides,
});

describe('PostItCard', () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onBringToFront = jest.fn();
  const onUpdatePosition = jest.fn();
  const onUpdateSize = jest.fn();

  const renderCard = (item: BoardItem = createMockItem(), zIndex = 1) =>
    render(
      <PostItCard
        item={item}
        zIndex={zIndex}
        onEdit={onEdit}
        onDelete={onDelete}
        onBringToFront={onBringToFront}
        onUpdatePosition={onUpdatePosition}
        onUpdateSize={onUpdateSize}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visual Design (Req 4.1, 4.2)', () => {
    it('should render with 12px border-radius', () => {
      renderCard();
      const card = screen.getByRole('application');
      expect(card).toHaveStyle({
        borderRadius: '12px',
      });
    });

    it('should apply pastel yellow background for note type', () => {
      renderCard(createMockItem({ type: 'note' }));
      const card = screen.getByRole('application');
      expect(card).toHaveStyle({ backgroundColor: '#fef9c3' });
    });

    it('should apply pastel blue background for quote type', () => {
      renderCard(createMockItem({ type: 'quote' }));
      const card = screen.getByRole('application');
      expect(card).toHaveStyle({ backgroundColor: '#dbeafe' });
    });

    it('should apply pastel green background for link type', () => {
      renderCard(createMockItem({ type: 'link' }));
      const card = screen.getByRole('application');
      expect(card).toHaveStyle({ backgroundColor: '#dcfce7' });
    });

    it('should apply pastel pink background for image type', () => {
      renderCard(createMockItem({ type: 'image', content: 'https://example.com/img.png' }));
      const card = screen.getByRole('application');
      expect(card).toHaveStyle({ backgroundColor: '#fce7f3' });
    });
  });

  describe('Content Display (Req 4.3)', () => {
    it('should display text content with line-clamp-6', () => {
      renderCard();
      const content = screen.getByText('A short note for testing');
      expect(content).toHaveClass('line-clamp-6');
    });

    it('should render edit and delete action buttons', () => {
      renderCard();
      expect(screen.getByLabelText('Edit note')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete note')).toBeInTheDocument();
    });

    it('should call onEdit with item when edit button is clicked', () => {
      const item = createMockItem();
      renderCard(item);
      fireEvent.click(screen.getByLabelText('Edit note'));
      expect(onEdit).toHaveBeenCalledWith(item);
    });

    it('should call onDelete with item id when delete button is clicked', () => {
      const item = createMockItem();
      renderCard(item);
      fireEvent.click(screen.getByLabelText('Delete note'));
      expect(onDelete).toHaveBeenCalledWith(item.id);
    });
  });

  describe('Image Type (Req 8.4, 8.5, 8.6, 8.9)', () => {
    it('should render an img element for image-type items with object-fit cover', () => {
      const item = createMockItem({ type: 'image', content: 'https://example.com/photo.jpg' });
      renderCard(item);
      const img = screen.getByAltText('Image card test-id-1');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
      expect(img).toHaveStyle({ objectFit: 'cover' });
    });

    it('should show placeholder on broken image load', () => {
      const item = createMockItem({ type: 'image', content: 'https://broken.url/img.png' });
      renderCard(item);
      const img = screen.getByAltText('Image card test-id-1');
      fireEvent.error(img);
      expect(screen.getByText('Image could not be loaded')).toBeInTheDocument();
    });

    it('should include alt attribute with "Image card {id}"', () => {
      const item = createMockItem({ id: 'abc-123', type: 'image', content: 'https://example.com/img.png' });
      renderCard(item);
      expect(screen.getByAltText('Image card abc-123')).toBeInTheDocument();
    });
  });

  describe('Accessibility (Req 7.3, 7.4)', () => {
    it('should have role="application" and aria-roledescription="draggable item"', () => {
      renderCard();
      const card = screen.getByRole('application');
      expect(card).toHaveAttribute('aria-roledescription', 'draggable item');
    });

    it('should have aria-label with type + first 50 chars of content', () => {
      const content = 'A very long content string that exceeds fifty characters in total length here';
      const item = createMockItem({ content });
      renderCard(item);
      const card = screen.getByRole('application');
      const expectedLabel = `note ${content.slice(0, 50)}`;
      expect(card).toHaveAttribute('aria-label', expectedLabel);
    });

    it('should be tab-focusable with tabIndex 0', () => {
      renderCard();
      const card = screen.getByRole('application');
      expect(card).toHaveAttribute('tabindex', '0');
    });

    it('should have focus-visible ring classes for WCAG 2.1 AA contrast', () => {
      renderCard();
      const card = screen.getByRole('application');
      expect(card).toHaveClass('focus-visible:ring-2');
      expect(card).toHaveClass('focus-visible:ring-blue-500');
      expect(card).toHaveClass('focus-visible:ring-offset-2');
    });
  });

  describe('Positioning and Sizing', () => {
    it('should render at item position with item size', () => {
      const item = createMockItem({ position: { x: 200, y: 300 }, size: { width: 300, height: 250 } });
      renderCard(item, 5);
      const card = screen.getByRole('application');
      expect(card).toHaveStyle({ left: '200px', top: '300px', width: '300px', height: '250px', zIndex: 5 });
    });
  });

  describe('Resize Handles Visibility', () => {
    it('should show resize handles on pointer hover', () => {
      renderCard();
      const card = screen.getByRole('application');
      fireEvent.pointerEnter(card);
      // Resize handles should now be rendered (they have data-handle attributes)
      expect(screen.getByTestId('postit-card-test-id-1').querySelectorAll('[data-handle]').length).toBe(8);
    });

    it('should hide resize handles when not hovered or focused', () => {
      renderCard();
      const card = screen.getByTestId('postit-card-test-id-1');
      // Not hovered, not focused - handles should not render
      expect(card.querySelectorAll('[data-handle]').length).toBe(0);
    });
  });

  describe('Bring to Front', () => {
    it('should call onBringToFront when clicked', () => {
      const item = createMockItem();
      renderCard(item);
      const card = screen.getByRole('application');
      fireEvent.click(card);
      expect(onBringToFront).toHaveBeenCalledWith(item.id);
    });
  });
});
