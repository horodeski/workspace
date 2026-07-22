import { renderHook, act } from '@testing-library/react';
import { useKeyboardReposition } from '../hooks/useKeyboardReposition';
import {
  KEYBOARD_MOVE_STEP,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MIN_CARD_WIDTH,
  MAX_CARD_WIDTH,
  MIN_CARD_HEIGHT,
  MAX_CARD_HEIGHT,
} from '../constants';

function createKeyEvent(
  key: string,
  modifiers: { shiftKey?: boolean; ctrlKey?: boolean } = {}
): React.KeyboardEvent {
  return {
    key,
    shiftKey: modifiers.shiftKey ?? false,
    ctrlKey: modifiers.ctrlKey ?? false,
    preventDefault: jest.fn(),
  } as unknown as React.KeyboardEvent;
}

describe('useKeyboardReposition', () => {
  const defaultOptions = {
    itemId: 'test-item-1',
    position: { x: 200, y: 300 },
    size: { width: 240, height: 180 },
    canvasSize: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    onPositionChange: jest.fn(),
    onSizeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Shift+Arrow: move card', () => {
    it('should move card left by 20px on Shift+ArrowLeft', () => {
      const { result } = renderHook(() => useKeyboardReposition(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowLeft', { shiftKey: true }));
      });

      expect(defaultOptions.onPositionChange).toHaveBeenCalledWith('test-item-1', {
        x: 180,
        y: 300,
      });
    });

    it('should move card right by 20px on Shift+ArrowRight', () => {
      const { result } = renderHook(() => useKeyboardReposition(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowRight', { shiftKey: true }));
      });

      expect(defaultOptions.onPositionChange).toHaveBeenCalledWith('test-item-1', {
        x: 220,
        y: 300,
      });
    });

    it('should move card up by 20px on Shift+ArrowUp', () => {
      const { result } = renderHook(() => useKeyboardReposition(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowUp', { shiftKey: true }));
      });

      expect(defaultOptions.onPositionChange).toHaveBeenCalledWith('test-item-1', {
        x: 200,
        y: 280,
      });
    });

    it('should move card down by 20px on Shift+ArrowDown', () => {
      const { result } = renderHook(() => useKeyboardReposition(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowDown', { shiftKey: true }));
      });

      expect(defaultOptions.onPositionChange).toHaveBeenCalledWith('test-item-1', {
        x: 200,
        y: 320,
      });
    });

    it('should clamp x to 0 when moving left beyond canvas', () => {
      const options = { ...defaultOptions, position: { x: 10, y: 300 } };
      const { result } = renderHook(() => useKeyboardReposition(options));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowLeft', { shiftKey: true }));
      });

      expect(options.onPositionChange).toHaveBeenCalledWith('test-item-1', {
        x: 0,
        y: 300,
      });
    });

    it('should clamp x to canvasWidth - cardWidth when moving right beyond canvas', () => {
      const options = {
        ...defaultOptions,
        position: { x: CANVAS_WIDTH - 240, y: 300 },
      };
      const { result } = renderHook(() => useKeyboardReposition(options));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowRight', { shiftKey: true }));
      });

      expect(options.onPositionChange).toHaveBeenCalledWith('test-item-1', {
        x: CANVAS_WIDTH - 240,
        y: 300,
      });
    });

    it('should clamp y to 0 when moving up beyond canvas', () => {
      const options = { ...defaultOptions, position: { x: 200, y: 5 } };
      const { result } = renderHook(() => useKeyboardReposition(options));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowUp', { shiftKey: true }));
      });

      expect(options.onPositionChange).toHaveBeenCalledWith('test-item-1', {
        x: 200,
        y: 0,
      });
    });

    it('should clamp y to canvasHeight - cardHeight when moving down beyond canvas', () => {
      const options = {
        ...defaultOptions,
        position: { x: 200, y: CANVAS_HEIGHT - 180 },
      };
      const { result } = renderHook(() => useKeyboardReposition(options));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowDown', { shiftKey: true }));
      });

      expect(options.onPositionChange).toHaveBeenCalledWith('test-item-1', {
        x: 200,
        y: CANVAS_HEIGHT - 180,
      });
    });
  });

  describe('Ctrl+Arrow: resize card', () => {
    it('should increase width by 20px on Ctrl+ArrowRight', () => {
      const { result } = renderHook(() => useKeyboardReposition(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowRight', { ctrlKey: true }));
      });

      expect(defaultOptions.onSizeChange).toHaveBeenCalledWith('test-item-1', {
        width: 260,
        height: 180,
      });
    });

    it('should decrease width by 20px on Ctrl+ArrowLeft', () => {
      const { result } = renderHook(() => useKeyboardReposition(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowLeft', { ctrlKey: true }));
      });

      expect(defaultOptions.onSizeChange).toHaveBeenCalledWith('test-item-1', {
        width: 220,
        height: 180,
      });
    });

    it('should increase height by 20px on Ctrl+ArrowDown', () => {
      const { result } = renderHook(() => useKeyboardReposition(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowDown', { ctrlKey: true }));
      });

      expect(defaultOptions.onSizeChange).toHaveBeenCalledWith('test-item-1', {
        width: 240,
        height: 200,
      });
    });

    it('should decrease height by 20px on Ctrl+ArrowUp', () => {
      const { result } = renderHook(() => useKeyboardReposition(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowUp', { ctrlKey: true }));
      });

      expect(defaultOptions.onSizeChange).toHaveBeenCalledWith('test-item-1', {
        width: 240,
        height: 160,
      });
    });

    it('should clamp width to MIN_CARD_WIDTH when decreasing below minimum', () => {
      const options = {
        ...defaultOptions,
        size: { width: MIN_CARD_WIDTH + 10, height: 180 },
      };
      const { result } = renderHook(() => useKeyboardReposition(options));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowLeft', { ctrlKey: true }));
      });

      expect(options.onSizeChange).toHaveBeenCalledWith('test-item-1', {
        width: MIN_CARD_WIDTH,
        height: 180,
      });
    });

    it('should clamp width to MAX_CARD_WIDTH when increasing beyond maximum', () => {
      const options = {
        ...defaultOptions,
        size: { width: MAX_CARD_WIDTH - 10, height: 180 },
      };
      const { result } = renderHook(() => useKeyboardReposition(options));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowRight', { ctrlKey: true }));
      });

      expect(options.onSizeChange).toHaveBeenCalledWith('test-item-1', {
        width: MAX_CARD_WIDTH,
        height: 180,
      });
    });

    it('should clamp height to MIN_CARD_HEIGHT when decreasing below minimum', () => {
      const options = {
        ...defaultOptions,
        size: { width: 240, height: MIN_CARD_HEIGHT + 10 },
      };
      const { result } = renderHook(() => useKeyboardReposition(options));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowUp', { ctrlKey: true }));
      });

      expect(options.onSizeChange).toHaveBeenCalledWith('test-item-1', {
        width: 240,
        height: MIN_CARD_HEIGHT,
      });
    });

    it('should clamp height to MAX_CARD_HEIGHT when increasing beyond maximum', () => {
      const options = {
        ...defaultOptions,
        size: { width: 240, height: MAX_CARD_HEIGHT - 10 },
      };
      const { result } = renderHook(() => useKeyboardReposition(options));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowDown', { ctrlKey: true }));
      });

      expect(options.onSizeChange).toHaveBeenCalledWith('test-item-1', {
        width: 240,
        height: MAX_CARD_HEIGHT,
      });
    });
  });

  describe('announcement via aria-live', () => {
    it('should announce position after Shift+Arrow move', () => {
      const { result } = renderHook(() => useKeyboardReposition(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowRight', { shiftKey: true }));
      });

      expect(result.current.announcement).toBe('Position: 220, 300');
    });

    it('should announce size after Ctrl+Arrow resize', () => {
      const { result } = renderHook(() => useKeyboardReposition(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowRight', { ctrlKey: true }));
      });

      expect(result.current.announcement).toBe('Size: 260 × 180');
    });
  });

  describe('event handling', () => {
    it('should prevent default on handled key events', () => {
      const { result } = renderHook(() => useKeyboardReposition(defaultOptions));
      const event = createKeyEvent('ArrowRight', { shiftKey: true });

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not call any handler for non-arrow keys', () => {
      const { result } = renderHook(() => useKeyboardReposition(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('Enter', { shiftKey: true }));
      });

      expect(defaultOptions.onPositionChange).not.toHaveBeenCalled();
      expect(defaultOptions.onSizeChange).not.toHaveBeenCalled();
    });

    it('should not call any handler for arrow keys without modifiers', () => {
      const { result } = renderHook(() => useKeyboardReposition(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyEvent('ArrowRight', {}));
      });

      expect(defaultOptions.onPositionChange).not.toHaveBeenCalled();
      expect(defaultOptions.onSizeChange).not.toHaveBeenCalled();
    });

    it('should not call any handler when both Shift and Ctrl are pressed', () => {
      const { result } = renderHook(() => useKeyboardReposition(defaultOptions));

      act(() => {
        result.current.handleKeyDown(
          createKeyEvent('ArrowRight', { shiftKey: true, ctrlKey: true })
        );
      });

      expect(defaultOptions.onPositionChange).not.toHaveBeenCalled();
      expect(defaultOptions.onSizeChange).not.toHaveBeenCalled();
    });
  });
});
