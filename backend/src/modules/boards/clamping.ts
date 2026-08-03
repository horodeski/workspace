/**
 * Board item position and size clamping utilities.
 *
 * Ensures board items stay within the canvas bounds and respect
 * minimum/maximum size constraints.
 *
 * Canvas: 1920 x 1080 pixels
 * Item size: width [120, 800], height [80, 600]
 * Position: x [0, CANVAS_WIDTH - width], y [0, CANVAS_HEIGHT - height]
 */

// Canvas dimensions
export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

// Size constraints
export const MIN_WIDTH = 120;
export const MAX_WIDTH = 800;
export const MIN_HEIGHT = 80;
export const MAX_HEIGHT = 600;

// Default item dimensions
export const DEFAULT_WIDTH = 240;
export const DEFAULT_HEIGHT = 180;

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Clamps a size to be within the allowed minimum and maximum dimensions.
 *
 * width ∈ [MIN_WIDTH, MAX_WIDTH] = [120, 800]
 * height ∈ [MIN_HEIGHT, MAX_HEIGHT] = [80, 600]
 */
export function clampSize(size: { width: number; height: number }): Size {
  return {
    width: Math.min(Math.max(size.width, MIN_WIDTH), MAX_WIDTH),
    height: Math.min(Math.max(size.height, MIN_HEIGHT), MAX_HEIGHT),
  };
}

/**
 * Clamps a position so that the item (with given size) stays within the canvas.
 *
 * x ∈ [0, CANVAS_WIDTH - size.width]
 * y ∈ [0, CANVAS_HEIGHT - size.height]
 */
export function clampPosition(
  position: { x: number; y: number },
  size: { width: number; height: number },
): Position {
  return {
    x: Math.min(Math.max(position.x, 0), CANVAS_WIDTH - size.width),
    y: Math.min(Math.max(position.y, 0), CANVAS_HEIGHT - size.height),
  };
}

/**
 * Re-clamps a position when the item's size changes.
 *
 * If the new size would cause the item to overflow the canvas at its
 * current position, the position is shifted inward to keep it within bounds.
 */
export function adjustPositionForSize(
  position: { x: number; y: number },
  newSize: { width: number; height: number },
): Position {
  return clampPosition(position, newSize);
}

/**
 * Generates a random initial position within valid canvas bounds for the given size.
 *
 * x ∈ [0, CANVAS_WIDTH - size.width]
 * y ∈ [0, CANVAS_HEIGHT - size.height]
 */
export function generateRandomPosition(size: { width: number; height: number }): Position {
  const maxX = CANVAS_WIDTH - size.width;
  const maxY = CANVAS_HEIGHT - size.height;

  return {
    x: Math.floor(Math.random() * (maxX + 1)),
    y: Math.floor(Math.random() * (maxY + 1)),
  };
}
