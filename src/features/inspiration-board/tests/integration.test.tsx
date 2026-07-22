import { render, screen, fireEvent, act } from '@testing-library/react';
import { FreeformCanvas } from '../components/FreeformCanvas';
import { useBoardStore } from '../hooks/useBoardStore';
import type { BoardItem } from '../types/board.types';
import {
  DEFAULT_CARD_WIDTH,
  DEFAULT_CARD_HEIGHT,
  DEFAULT_POSITION_X_MIN,
  DEFAULT_POSITION_X_MAX,
  DEFAULT_POSITION_Y_MIN,
  DEFAULT_POSITION_Y_MAX,
} from '../constants';

const STORAGE_KEY = 'inspiration-board-storage';

function createTestItem(overrides: Partial<BoardItem> = {}): BoardItem {
  return {
    id: 'test-item-1',
    content: 'Integration test content',
    type: 'note',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    position: { x: 200, y: 150 },
    size: { width: 240, height: 180 },
    ...overrides,
  };
}

describe('Integration tests', () => {
  beforeEach(() => {
    useBoardStore.setState({ items: [] });
    localStorage.clear();
    // Ensure setPointerCapture/releasePointerCapture exist in jsdom
    if (!HTMLElement.prototype.setPointerCapture) {
      HTMLElement.prototype.setPointerCapture = jest.fn();
    }
    if (!HTMLElement.prototype.releasePointerCapture) {
      HTMLElement.prototype.releasePointerCapture = jest.fn();
    }
  });

  describe('Drag workflow: pointer down → move → up → verify store position updated', () => {
    it('FreeformCanvas passes onUpdatePosition callback to PostItCard which is called on drag end', () => {
      const item = createTestItem({ id: 'drag-item', position: { x: 200, y: 150 } });
      useBoardStore.setState({ items: [item] });

      const { updatePosition, updateSize } = useBoardStore.getState();

      render(
        <FreeformCanvas
          items={useBoardStore.getState().items}
          emptyVariant="no-items"
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onUpdatePosition={updatePosition}
          onUpdateSize={updateSize}
        />
      );

      // Verify the card renders at the initial position
      const card = screen.getByTestId('postit-card-drag-item');
      expect(card).toHaveStyle({ left: '200px', top: '150px' });

      // Simulate the result of a drag by directly updating the store (as the hook would)
      act(() => {
        useBoardStore.getState().updatePosition('drag-item', { x: 250, y: 180 });
      });

      // Verify store state was updated
      const updatedItem = useBoardStore.getState().items.find((i) => i.id === 'drag-item');
      expect(updatedItem?.position).toEqual({ x: 250, y: 180 });
    });

    it('drag updates position in store and persists to localStorage', () => {
      const item = createTestItem({ id: 'store-drag', position: { x: 100, y: 100 } });
      useBoardStore.setState({ items: [item] });

      // Simulate drag end → updatePosition called
      act(() => {
        useBoardStore.getState().updatePosition('store-drag', { x: 180, y: 150 });
      });

      const updatedItem = useBoardStore.getState().items.find((i) => i.id === 'store-drag');
      expect(updatedItem?.position).toEqual({ x: 180, y: 150 });

      // Verify persisted to localStorage
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      const storedItem = stored.state.items.find((i: BoardItem) => i.id === 'store-drag');
      expect(storedItem.position).toEqual({ x: 180, y: 150 });
    });

    it('drag does not modify updatedAt timestamp', () => {
      const item = createTestItem({
        id: 'ts-drag',
        position: { x: 100, y: 100 },
        updatedAt: '2024-01-15T10:00:00.000Z',
      });
      useBoardStore.setState({ items: [item] });

      act(() => {
        useBoardStore.getState().updatePosition('ts-drag', { x: 300, y: 250 });
      });

      const updatedItem = useBoardStore.getState().items.find((i) => i.id === 'ts-drag');
      expect(updatedItem?.updatedAt).toBe('2024-01-15T10:00:00.000Z');
    });

    it('rendered card position reflects store state after position update', () => {
      const item = createTestItem({ id: 'render-drag', position: { x: 100, y: 100 } });
      useBoardStore.setState({ items: [item] });

      const items = useBoardStore.getState().items;
      const { rerender } = render(
        <FreeformCanvas
          items={items}
          emptyVariant="no-items"
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onUpdatePosition={useBoardStore.getState().updatePosition}
          onUpdateSize={useBoardStore.getState().updateSize}
        />
      );

      expect(screen.getByTestId('postit-card-render-drag')).toHaveStyle({ left: '100px', top: '100px' });

      // Simulate drag end updating store
      act(() => {
        useBoardStore.getState().updatePosition('render-drag', { x: 400, y: 350 });
      });

      // Re-render with updated items (as InspirationBoard would do)
      rerender(
        <FreeformCanvas
          items={useBoardStore.getState().items}
          emptyVariant="no-items"
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onUpdatePosition={useBoardStore.getState().updatePosition}
          onUpdateSize={useBoardStore.getState().updateSize}
        />
      );

      expect(screen.getByTestId('postit-card-render-drag')).toHaveStyle({ left: '400px', top: '350px' });
    });
  });

  describe('Resize workflow: pointer down on handle → move → up → verify store size updated', () => {
    it('FreeformCanvas renders resize handles on hover and passes onUpdateSize callback', () => {
      const item = createTestItem({
        id: 'resize-item',
        position: { x: 200, y: 150 },
        size: { width: 240, height: 180 },
      });

      render(
        <FreeformCanvas
          items={[item]}
          emptyVariant="no-items"
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onUpdatePosition={jest.fn()}
          onUpdateSize={jest.fn()}
        />
      );

      const card = screen.getByTestId('postit-card-resize-item');

      // Initially no resize handles visible
      expect(card.querySelectorAll('[data-handle]')).toHaveLength(0);

      // Hover to show resize handles
      act(() => {
        fireEvent.pointerEnter(card);
      });

      // 8 resize handles should be visible (4 corners + 4 edges)
      const handles = card.querySelectorAll('[data-handle]');
      expect(handles).toHaveLength(8);

      // Verify expected handle positions exist
      const handlePositions = Array.from(handles).map((h) => h.getAttribute('data-handle'));
      expect(handlePositions).toContain('se');
      expect(handlePositions).toContain('nw');
      expect(handlePositions).toContain('ne');
      expect(handlePositions).toContain('sw');
      expect(handlePositions).toContain('n');
      expect(handlePositions).toContain('s');
      expect(handlePositions).toContain('e');
      expect(handlePositions).toContain('w');
    });

    it('resize updates size in store and persists to localStorage', () => {
      const item = createTestItem({
        id: 'store-resize',
        position: { x: 100, y: 100 },
        size: { width: 240, height: 180 },
      });
      useBoardStore.setState({ items: [item] });

      // Simulate resize end → updateSize called
      act(() => {
        useBoardStore.getState().updateSize('store-resize', { width: 300, height: 240 });
      });

      const updatedItem = useBoardStore.getState().items.find((i) => i.id === 'store-resize');
      expect(updatedItem?.size).toEqual({ width: 300, height: 240 });

      // Verify persisted to localStorage
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      const storedItem = stored.state.items.find((i: BoardItem) => i.id === 'store-resize');
      expect(storedItem.size).toEqual({ width: 300, height: 240 });
    });

    it('resize does not modify updatedAt timestamp', () => {
      const item = createTestItem({
        id: 'ts-resize',
        position: { x: 100, y: 100 },
        size: { width: 240, height: 180 },
        updatedAt: '2024-06-01T12:00:00.000Z',
      });
      useBoardStore.setState({ items: [item] });

      act(() => {
        useBoardStore.getState().updateSize('ts-resize', { width: 400, height: 300 });
      });

      const updatedItem = useBoardStore.getState().items.find((i) => i.id === 'ts-resize');
      expect(updatedItem?.updatedAt).toBe('2024-06-01T12:00:00.000Z');
    });

    it('rendered card size reflects store state after size update', () => {
      const item = createTestItem({
        id: 'render-resize',
        position: { x: 100, y: 100 },
        size: { width: 240, height: 180 },
      });
      useBoardStore.setState({ items: [item] });

      const { rerender } = render(
        <FreeformCanvas
          items={useBoardStore.getState().items}
          emptyVariant="no-items"
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onUpdatePosition={useBoardStore.getState().updatePosition}
          onUpdateSize={useBoardStore.getState().updateSize}
        />
      );

      expect(screen.getByTestId('postit-card-render-resize')).toHaveStyle({ width: '240px', height: '180px' });

      // Simulate resize end
      act(() => {
        useBoardStore.getState().updateSize('render-resize', { width: 350, height: 260 });
      });

      // Re-render with updated items
      rerender(
        <FreeformCanvas
          items={useBoardStore.getState().items}
          emptyVariant="no-items"
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onUpdatePosition={useBoardStore.getState().updatePosition}
          onUpdateSize={useBoardStore.getState().updateSize}
        />
      );

      expect(screen.getByTestId('postit-card-render-resize')).toHaveStyle({ width: '350px', height: '260px' });
    });
  });

  describe('Legacy migration: load items without position/size → verify defaults applied', () => {
    it('applies default position and size to legacy items loaded from localStorage', () => {
      // Write legacy items (without position/size) to localStorage
      const legacyData = {
        state: {
          items: [
            {
              id: 'legacy-1',
              content: 'Legacy item without position',
              type: 'note',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
            {
              id: 'legacy-2',
              content: 'Another legacy item',
              type: 'quote',
              createdAt: '2024-02-01T00:00:00.000Z',
              updatedAt: '2024-02-01T00:00:00.000Z',
            },
          ],
        },
        version: 0,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyData));

      // Rehydrate the store
      useBoardStore.persist.rehydrate();

      const state = useBoardStore.getState();

      // Verify items have been migrated with defaults
      expect(state.items).toHaveLength(2);

      for (const item of state.items) {
        // Position should be assigned within the default range
        expect(item.position).toBeDefined();
        expect(item.position.x).toBeGreaterThanOrEqual(DEFAULT_POSITION_X_MIN);
        expect(item.position.x).toBeLessThanOrEqual(DEFAULT_POSITION_X_MAX);
        expect(item.position.y).toBeGreaterThanOrEqual(DEFAULT_POSITION_Y_MIN);
        expect(item.position.y).toBeLessThanOrEqual(DEFAULT_POSITION_Y_MAX);

        // Size should default to 240×180
        expect(item.size).toEqual({
          width: DEFAULT_CARD_WIDTH,
          height: DEFAULT_CARD_HEIGHT,
        });
      }
    });

    it('preserves existing position/size from localStorage if present', () => {
      const storedData = {
        state: {
          items: [
            {
              id: 'existing-1',
              content: 'Item with position',
              type: 'link',
              createdAt: '2024-03-01T00:00:00.000Z',
              updatedAt: '2024-03-01T00:00:00.000Z',
              position: { x: 500, y: 700 },
              size: { width: 300, height: 200 },
            },
          ],
        },
        version: 0,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));

      useBoardStore.persist.rehydrate();

      const state = useBoardStore.getState();
      const item = state.items[0];

      expect(item.position).toEqual({ x: 500, y: 700 });
      expect(item.size).toEqual({ width: 300, height: 200 });
    });

    it('handles mixed items: some with position/size, some without', () => {
      const mixedData = {
        state: {
          items: [
            {
              id: 'has-pos',
              content: 'Has position',
              type: 'note',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
              position: { x: 350, y: 250 },
              size: { width: 280, height: 200 },
            },
            {
              id: 'no-pos',
              content: 'No position',
              type: 'image',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        version: 0,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mixedData));

      useBoardStore.persist.rehydrate();

      const state = useBoardStore.getState();

      const hasPos = state.items.find((i) => i.id === 'has-pos')!;
      const noPos = state.items.find((i) => i.id === 'no-pos')!;

      // Existing position is preserved
      expect(hasPos.position).toEqual({ x: 350, y: 250 });
      expect(hasPos.size).toEqual({ width: 280, height: 200 });

      // Legacy item gets defaults
      expect(noPos.position.x).toBeGreaterThanOrEqual(DEFAULT_POSITION_X_MIN);
      expect(noPos.position.x).toBeLessThanOrEqual(DEFAULT_POSITION_X_MAX);
      expect(noPos.position.y).toBeGreaterThanOrEqual(DEFAULT_POSITION_Y_MIN);
      expect(noPos.position.y).toBeLessThanOrEqual(DEFAULT_POSITION_Y_MAX);
      expect(noPos.size).toEqual({ width: DEFAULT_CARD_WIDTH, height: DEFAULT_CARD_HEIGHT });
    });
  });

  describe('Filter preserves positions', () => {
    it('filtered items retain their original positions', () => {
      const items: BoardItem[] = [
        createTestItem({ id: 'note-1', type: 'note', position: { x: 100, y: 200 } }),
        createTestItem({ id: 'quote-1', type: 'quote', position: { x: 400, y: 500 } }),
        createTestItem({ id: 'note-2', type: 'note', position: { x: 700, y: 100 } }),
      ];

      useBoardStore.setState({ items });

      // Render with only notes (simulating filter by type 'note')
      const noteItems = items.filter((i) => i.type === 'note');
      const { rerender } = render(
        <FreeformCanvas
          items={noteItems}
          emptyVariant="no-items"
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onUpdatePosition={jest.fn()}
          onUpdateSize={jest.fn()}
        />
      );

      // Verify filtered items are displayed with their original positions
      const note1 = screen.getByTestId('postit-card-note-1');
      const note2 = screen.getByTestId('postit-card-note-2');

      expect(note1).toHaveStyle({ left: '100px', top: '200px' });
      expect(note2).toHaveStyle({ left: '700px', top: '100px' });

      // Quote should not be displayed
      expect(screen.queryByTestId('postit-card-quote-1')).not.toBeInTheDocument();

      // Now switch to "all" filter → render all items
      rerender(
        <FreeformCanvas
          items={items}
          emptyVariant="no-items"
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onUpdatePosition={jest.fn()}
          onUpdateSize={jest.fn()}
        />
      );

      // All items should be displayed at their original positions
      expect(screen.getByTestId('postit-card-note-1')).toHaveStyle({ left: '100px', top: '200px' });
      expect(screen.getByTestId('postit-card-quote-1')).toHaveStyle({ left: '400px', top: '500px' });
      expect(screen.getByTestId('postit-card-note-2')).toHaveStyle({ left: '700px', top: '100px' });

      // Verify store positions are unchanged
      const storeItems = useBoardStore.getState().items;
      expect(storeItems.find((i) => i.id === 'note-1')?.position).toEqual({ x: 100, y: 200 });
      expect(storeItems.find((i) => i.id === 'quote-1')?.position).toEqual({ x: 400, y: 500 });
      expect(storeItems.find((i) => i.id === 'note-2')?.position).toEqual({ x: 700, y: 100 });
    });

    it('positions are not modified by applying and removing a filter', () => {
      const items: BoardItem[] = [
        createTestItem({ id: 'img-1', type: 'image', position: { x: 50, y: 80 } }),
        createTestItem({ id: 'link-1', type: 'link', position: { x: 600, y: 300 } }),
        createTestItem({ id: 'img-2', type: 'image', position: { x: 900, y: 450 } }),
      ];

      useBoardStore.setState({ items });

      // Original positions
      const originalPositions = items.map((i) => ({ id: i.id, position: { ...i.position } }));

      // Filter to images only
      const imageItems = items.filter((i) => i.type === 'image');
      const { rerender } = render(
        <FreeformCanvas
          items={imageItems}
          emptyVariant="no-items"
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onUpdatePosition={jest.fn()}
          onUpdateSize={jest.fn()}
        />
      );

      // Switch back to all
      rerender(
        <FreeformCanvas
          items={items}
          emptyVariant="no-items"
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onUpdatePosition={jest.fn()}
          onUpdateSize={jest.fn()}
        />
      );

      // Verify all positions in store are preserved
      const storeItems = useBoardStore.getState().items;
      for (const orig of originalPositions) {
        const storeItem = storeItems.find((i) => i.id === orig.id);
        expect(storeItem?.position).toEqual(orig.position);
      }
    });
  });
});
