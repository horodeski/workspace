import { useBoardModuleStore } from '../hooks/useBoardModuleStore';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_ITEM_WIDTH,
  DEFAULT_ITEM_HEIGHT,
  MIN_ITEM_WIDTH,
  MIN_ITEM_HEIGHT,
  MAX_ITEM_WIDTH,
  MAX_ITEM_HEIGHT,
} from '../constants';

// Reset store state before each test
beforeEach(() => {
  useBoardModuleStore.setState(useBoardModuleStore.getInitialState());
});

describe('useBoardModuleStore - Item CRUD', () => {
  describe('addItem', () => {
    it('adds an item to the active board with valid content', () => {
      const { addItem, boards, activeBoardId } = useBoardModuleStore.getState();
      addItem('Hello World', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      expect(activeBoard!.items).toHaveLength(1);

      const item = activeBoard!.items[0];
      expect(item.content).toBe('Hello World');
      expect(item.type).toBe('note');
      expect(item.size.width).toBe(DEFAULT_ITEM_WIDTH);
      expect(item.size.height).toBe(DEFAULT_ITEM_HEIGHT);
    });

    it('generates a valid UUID for the item', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Test content', 'quote');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(activeBoard!.items[0].id).toMatch(uuidRegex);
    });

    it('positions item within canvas bounds', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Bounded item', 'image');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const item = activeBoard!.items[0];

      expect(item.position.x).toBeGreaterThanOrEqual(0);
      expect(item.position.x).toBeLessThanOrEqual(CANVAS_WIDTH - DEFAULT_ITEM_WIDTH);
      expect(item.position.y).toBeGreaterThanOrEqual(0);
      expect(item.position.y).toBeLessThanOrEqual(CANVAS_HEIGHT - DEFAULT_ITEM_HEIGHT);
    });

    it('sets createdAt and updatedAt as valid ISO 8601 timestamps', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Timestamped', 'link');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const item = activeBoard!.items[0];

      expect(new Date(item.createdAt).toISOString()).toBe(item.createdAt);
      expect(new Date(item.updatedAt).toISOString()).toBe(item.updatedAt);
    });

    it('is a no-op when content is empty', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      expect(activeBoard!.items).toHaveLength(0);
    });

    it('is a no-op when content exceeds 500 characters', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('a'.repeat(501), 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      expect(activeBoard!.items).toHaveLength(0);
    });

    it('is a no-op when activeBoardId is null', () => {
      useBoardModuleStore.setState({ activeBoardId: null });
      const { addItem } = useBoardModuleStore.getState();
      addItem('Content', 'note');

      const state = useBoardModuleStore.getState();
      // All boards should have no items
      state.boards.forEach((board) => {
        expect(board.items).toHaveLength(0);
      });
    });

    it('adds items only to the active board', () => {
      const { createBoard } = useBoardModuleStore.getState();
      createBoard('Second Board');

      // Active board is now the second one
      const { addItem, boards } = useBoardModuleStore.getState();
      addItem('Active board item', 'note');

      const state = useBoardModuleStore.getState();
      const firstBoard = state.boards.find((b) => b.id === boards[0].id);
      const secondBoard = state.boards.find((b) => b.id === boards[1].id);
      expect(firstBoard!.items).toHaveLength(0);
      expect(secondBoard!.items).toHaveLength(1);
    });
  });

  describe('updateItem', () => {
    it('updates the content of an existing item', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Original', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      state.updateItem(itemId, 'Updated');

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].content).toBe('Updated');
    });

    it('updates the updatedAt timestamp', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Original', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const item = activeBoard!.items[0];
      const originalUpdatedAt = item.updatedAt;

      // Small delay to ensure timestamp differs
      state.updateItem(item.id, 'Updated');

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      const updatedItem = updatedBoard!.items[0];
      expect(updatedItem.updatedAt).toBeDefined();
      expect(new Date(updatedItem.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );
    });

    it('preserves id, type, createdAt, position, and size', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Original', 'quote');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const originalItem = { ...activeBoard!.items[0] };

      state.updateItem(originalItem.id, 'Updated');

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      const updatedItem = updatedBoard!.items[0];

      expect(updatedItem.id).toBe(originalItem.id);
      expect(updatedItem.type).toBe(originalItem.type);
      expect(updatedItem.createdAt).toBe(originalItem.createdAt);
      expect(updatedItem.position).toEqual(originalItem.position);
      expect(updatedItem.size).toEqual(originalItem.size);
    });

    it('is a no-op for invalid content (empty)', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Original', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      state.updateItem(itemId, '');

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].content).toBe('Original');
    });

    it('is a no-op for non-existent item id', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Original', 'note');

      const { updateItem } = useBoardModuleStore.getState();
      updateItem('non-existent-id', 'Updated');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      expect(activeBoard!.items[0].content).toBe('Original');
    });

    it('is a no-op when activeBoardId is null', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Original', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      useBoardModuleStore.setState({ activeBoardId: null });
      const { updateItem } = useBoardModuleStore.getState();
      updateItem(itemId, 'Updated');

      const updatedState = useBoardModuleStore.getState();
      const board = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(board!.items[0].content).toBe('Original');
    });
  });

  describe('removeItem', () => {
    it('removes an item from the active board', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('To be removed', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      state.removeItem(itemId);

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items).toHaveLength(0);
    });

    it('only removes the specified item, leaving others unchanged', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Item 1', 'note');

      let state = useBoardModuleStore.getState();
      state.addItem('Item 2', 'quote');

      state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const firstItemId = activeBoard!.items[0].id;

      state.removeItem(firstItemId);

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items).toHaveLength(1);
      expect(updatedBoard!.items[0].content).toBe('Item 2');
    });

    it('is a no-op for non-existent item id', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Existing', 'note');

      const { removeItem } = useBoardModuleStore.getState();
      removeItem('non-existent-id');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      expect(activeBoard!.items).toHaveLength(1);
    });

    it('is a no-op when activeBoardId is null', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Existing', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      useBoardModuleStore.setState({ activeBoardId: null });
      const { removeItem } = useBoardModuleStore.getState();
      removeItem(itemId);

      const updatedState = useBoardModuleStore.getState();
      const board = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(board!.items).toHaveLength(1);
    });
  });

  describe('updatePosition', () => {
    it('updates item position within bounds', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Positioned item', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      state.updatePosition(itemId, { x: 100, y: 200 });

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].position).toEqual({ x: 100, y: 200 });
    });

    it('clamps negative x position to 0', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Item', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      state.updatePosition(itemId, { x: -50, y: 100 });

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].position.x).toBe(0);
    });

    it('clamps negative y position to 0', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Item', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      state.updatePosition(itemId, { x: 100, y: -30 });

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].position.y).toBe(0);
    });

    it('clamps x position to CANVAS_WIDTH - item.width', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Item', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      state.updatePosition(itemId, { x: 5000, y: 100 });

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].position.x).toBe(CANVAS_WIDTH - DEFAULT_ITEM_WIDTH);
    });

    it('clamps y position to CANVAS_HEIGHT - item.height', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Item', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      state.updatePosition(itemId, { x: 100, y: 5000 });

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].position.y).toBe(CANVAS_HEIGHT - DEFAULT_ITEM_HEIGHT);
    });

    it('is a no-op for non-existent item id', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Item', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const originalPosition = { ...activeBoard!.items[0].position };

      state.updatePosition('non-existent-id', { x: 999, y: 999 });

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].position).toEqual(originalPosition);
    });
  });

  describe('updateSize', () => {
    it('updates item size within valid range', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Resizable item', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      state.updateSize(itemId, { width: 400, height: 300 });

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].size).toEqual({ width: 400, height: 300 });
    });

    it('clamps width below minimum to MIN_ITEM_WIDTH', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Item', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      state.updateSize(itemId, { width: 50, height: 180 });

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].size.width).toBe(MIN_ITEM_WIDTH);
    });

    it('clamps height below minimum to MIN_ITEM_HEIGHT', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Item', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      state.updateSize(itemId, { width: 240, height: 30 });

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].size.height).toBe(MIN_ITEM_HEIGHT);
    });

    it('clamps width above maximum to MAX_ITEM_WIDTH', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Item', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      state.updateSize(itemId, { width: 1000, height: 180 });

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].size.width).toBe(MAX_ITEM_WIDTH);
    });

    it('clamps height above maximum to MAX_ITEM_HEIGHT', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Item', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      state.updateSize(itemId, { width: 240, height: 900 });

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].size.height).toBe(MAX_ITEM_HEIGHT);
    });

    it('adjusts position when new size would exceed canvas bounds', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Item', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      // First position the item near the right/bottom edge
      state.updatePosition(itemId, { x: 2900, y: 1900 });

      // Now resize to a larger size - position should be adjusted
      const { updateSize } = useBoardModuleStore.getState();
      updateSize(itemId, { width: 400, height: 300 });

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      const item = updatedBoard!.items[0];

      // Position should be clamped so item stays within canvas
      expect(item.position.x).toBeLessThanOrEqual(CANVAS_WIDTH - item.size.width);
      expect(item.position.y).toBeLessThanOrEqual(CANVAS_HEIGHT - item.size.height);
      expect(item.position.x).toBeGreaterThanOrEqual(0);
      expect(item.position.y).toBeGreaterThanOrEqual(0);
    });

    it('does not adjust position when item still fits', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Item', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const itemId = activeBoard!.items[0].id;

      // Position the item away from edges
      state.updatePosition(itemId, { x: 100, y: 100 });

      // Resize within bounds - position should stay the same
      const { updateSize } = useBoardModuleStore.getState();
      updateSize(itemId, { width: 300, height: 200 });

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].position).toEqual({ x: 100, y: 100 });
    });

    it('is a no-op for non-existent item id', () => {
      const { addItem, activeBoardId } = useBoardModuleStore.getState();
      addItem('Item', 'note');

      const state = useBoardModuleStore.getState();
      const activeBoard = state.boards.find((b) => b.id === activeBoardId);
      const originalSize = { ...activeBoard!.items[0].size };

      state.updateSize('non-existent-id', { width: 500, height: 400 });

      const updatedState = useBoardModuleStore.getState();
      const updatedBoard = updatedState.boards.find((b) => b.id === activeBoardId);
      expect(updatedBoard!.items[0].size).toEqual(originalSize);
    });
  });
});
