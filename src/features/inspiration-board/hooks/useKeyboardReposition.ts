import { useCallback, useState } from 'react';
import {
  KEYBOARD_MOVE_STEP,
  MIN_CARD_WIDTH,
  MAX_CARD_WIDTH,
  MIN_CARD_HEIGHT,
  MAX_CARD_HEIGHT,
} from '../constants';

interface UseKeyboardRepositionOptions {
  itemId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  canvasSize: { width: number; height: number };
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onSizeChange: (id: string, size: { width: number; height: number }) => void;
}

interface UseKeyboardRepositionReturn {
  handleKeyDown: (e: React.KeyboardEvent) => void;
  announcement: string;
}

export function useKeyboardReposition(
  options: UseKeyboardRepositionOptions
): UseKeyboardRepositionReturn {
  const { itemId, position, size, canvasSize, onPositionChange, onSizeChange } =
    options;

  const [announcement, setAnnouncement] = useState('');

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const { key, shiftKey, ctrlKey } = e;

      // Only handle arrow keys with Shift or Ctrl modifiers
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
        return;
      }

      if (!shiftKey && !ctrlKey) {
        return;
      }

      // Shift+Arrow: move card by KEYBOARD_MOVE_STEP
      if (shiftKey && !ctrlKey) {
        e.preventDefault();

        let newX = position.x;
        let newY = position.y;

        switch (key) {
          case 'ArrowLeft':
            newX = position.x - KEYBOARD_MOVE_STEP;
            break;
          case 'ArrowRight':
            newX = position.x + KEYBOARD_MOVE_STEP;
            break;
          case 'ArrowUp':
            newY = position.y - KEYBOARD_MOVE_STEP;
            break;
          case 'ArrowDown':
            newY = position.y + KEYBOARD_MOVE_STEP;
            break;
        }

        // Clamp to canvas bounds
        newX = Math.max(0, Math.min(newX, canvasSize.width - size.width));
        newY = Math.max(0, Math.min(newY, canvasSize.height - size.height));

        onPositionChange(itemId, { x: newX, y: newY });
        setAnnouncement(`Position: ${newX}, ${newY}`);
      }

      // Ctrl+Arrow: resize card by KEYBOARD_MOVE_STEP
      if (ctrlKey && !shiftKey) {
        e.preventDefault();

        let newWidth = size.width;
        let newHeight = size.height;

        switch (key) {
          case 'ArrowRight':
            newWidth = size.width + KEYBOARD_MOVE_STEP;
            break;
          case 'ArrowLeft':
            newWidth = size.width - KEYBOARD_MOVE_STEP;
            break;
          case 'ArrowDown':
            newHeight = size.height + KEYBOARD_MOVE_STEP;
            break;
          case 'ArrowUp':
            newHeight = size.height - KEYBOARD_MOVE_STEP;
            break;
        }

        // Clamp to size bounds
        newWidth = Math.max(MIN_CARD_WIDTH, Math.min(newWidth, MAX_CARD_WIDTH));
        newHeight = Math.max(MIN_CARD_HEIGHT, Math.min(newHeight, MAX_CARD_HEIGHT));

        onSizeChange(itemId, { width: newWidth, height: newHeight });
        setAnnouncement(`Size: ${newWidth} × ${newHeight}`);
      }
    },
    [itemId, position, size, canvasSize, onPositionChange, onSizeChange]
  );

  return {
    handleKeyDown,
    announcement,
  };
}
