import { describe, it, expect } from 'vitest';
import {
  clampSize,
  clampPosition,
  adjustPositionForSize,
  generateRandomPosition,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MIN_WIDTH,
  MAX_WIDTH,
  MIN_HEIGHT,
  MAX_HEIGHT,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
} from './clamping.js';

describe('clamping utility', () => {
  describe('constants', () => {
    it('has expected canvas dimensions', () => {
      expect(CANVAS_WIDTH).toBe(3000);
      expect(CANVAS_HEIGHT).toBe(2000);
    });

    it('has expected size constraints', () => {
      expect(MIN_WIDTH).toBe(120);
      expect(MAX_WIDTH).toBe(800);
      expect(MIN_HEIGHT).toBe(80);
      expect(MAX_HEIGHT).toBe(600);
    });

    it('has expected default dimensions', () => {
      expect(DEFAULT_WIDTH).toBe(240);
      expect(DEFAULT_HEIGHT).toBe(180);
    });
  });

  describe('clampSize', () => {
    it('returns size unchanged when within bounds', () => {
      expect(clampSize({ width: 300, height: 200 })).toEqual({ width: 300, height: 200 });
    });

    it('clamps width below minimum to MIN_WIDTH', () => {
      expect(clampSize({ width: 50, height: 200 })).toEqual({ width: MIN_WIDTH, height: 200 });
    });

    it('clamps width above maximum to MAX_WIDTH', () => {
      expect(clampSize({ width: 1000, height: 200 })).toEqual({ width: MAX_WIDTH, height: 200 });
    });

    it('clamps height below minimum to MIN_HEIGHT', () => {
      expect(clampSize({ width: 300, height: 30 })).toEqual({ width: 300, height: MIN_HEIGHT });
    });

    it('clamps height above maximum to MAX_HEIGHT', () => {
      expect(clampSize({ width: 300, height: 900 })).toEqual({ width: 300, height: MAX_HEIGHT });
    });

    it('clamps both dimensions simultaneously', () => {
      expect(clampSize({ width: 10, height: 10 })).toEqual({ width: MIN_WIDTH, height: MIN_HEIGHT });
      expect(clampSize({ width: 9999, height: 9999 })).toEqual({ width: MAX_WIDTH, height: MAX_HEIGHT });
    });

    it('handles exact boundary values', () => {
      expect(clampSize({ width: MIN_WIDTH, height: MIN_HEIGHT })).toEqual({ width: MIN_WIDTH, height: MIN_HEIGHT });
      expect(clampSize({ width: MAX_WIDTH, height: MAX_HEIGHT })).toEqual({ width: MAX_WIDTH, height: MAX_HEIGHT });
    });
  });

  describe('clampPosition', () => {
    const defaultSize = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };

    it('returns position unchanged when within bounds', () => {
      expect(clampPosition({ x: 100, y: 100 }, defaultSize)).toEqual({ x: 100, y: 100 });
    });

    it('clamps negative x to 0', () => {
      expect(clampPosition({ x: -50, y: 100 }, defaultSize)).toEqual({ x: 0, y: 100 });
    });

    it('clamps negative y to 0', () => {
      expect(clampPosition({ x: 100, y: -50 }, defaultSize)).toEqual({ x: 100, y: 0 });
    });

    it('clamps x exceeding canvas-width boundary', () => {
      const maxX = CANVAS_WIDTH - defaultSize.width;
      expect(clampPosition({ x: 5000, y: 100 }, defaultSize)).toEqual({ x: maxX, y: 100 });
    });

    it('clamps y exceeding canvas-height boundary', () => {
      const maxY = CANVAS_HEIGHT - defaultSize.height;
      expect(clampPosition({ x: 100, y: 5000 }, defaultSize)).toEqual({ x: 100, y: maxY });
    });

    it('accounts for item size when clamping upper bound', () => {
      const size = { width: 800, height: 600 };
      const maxX = CANVAS_WIDTH - size.width; // 2200
      const maxY = CANVAS_HEIGHT - size.height; // 1400
      expect(clampPosition({ x: 2500, y: 1500 }, size)).toEqual({ x: maxX, y: maxY });
    });

    it('handles position at exact maximum bound', () => {
      const maxX = CANVAS_WIDTH - defaultSize.width;
      const maxY = CANVAS_HEIGHT - defaultSize.height;
      expect(clampPosition({ x: maxX, y: maxY }, defaultSize)).toEqual({ x: maxX, y: maxY });
    });
  });

  describe('adjustPositionForSize', () => {
    it('keeps position unchanged if item still fits', () => {
      const position = { x: 100, y: 100 };
      const newSize = { width: 200, height: 150 };
      expect(adjustPositionForSize(position, newSize)).toEqual({ x: 100, y: 100 });
    });

    it('shifts position inward when larger size would overflow x', () => {
      const position = { x: 2800, y: 100 };
      const newSize = { width: 500, height: 150 };
      // maxX = 3000 - 500 = 2500
      expect(adjustPositionForSize(position, newSize)).toEqual({ x: 2500, y: 100 });
    });

    it('shifts position inward when larger size would overflow y', () => {
      const position = { x: 100, y: 1800 };
      const newSize = { width: 200, height: 500 };
      // maxY = 2000 - 500 = 1500
      expect(adjustPositionForSize(position, newSize)).toEqual({ x: 100, y: 1500 });
    });

    it('shifts both axes when needed', () => {
      const position = { x: 2900, y: 1900 };
      const newSize = { width: 800, height: 600 };
      // maxX = 3000 - 800 = 2200, maxY = 2000 - 600 = 1400
      expect(adjustPositionForSize(position, newSize)).toEqual({ x: 2200, y: 1400 });
    });
  });

  describe('generateRandomPosition', () => {
    it('generates position within valid bounds for default size', () => {
      const size = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
      for (let i = 0; i < 50; i++) {
        const pos = generateRandomPosition(size);
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.x).toBeLessThanOrEqual(CANVAS_WIDTH - size.width);
        expect(pos.y).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeLessThanOrEqual(CANVAS_HEIGHT - size.height);
      }
    });

    it('generates position within valid bounds for maximum size', () => {
      const size = { width: MAX_WIDTH, height: MAX_HEIGHT };
      for (let i = 0; i < 50; i++) {
        const pos = generateRandomPosition(size);
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.x).toBeLessThanOrEqual(CANVAS_WIDTH - size.width);
        expect(pos.y).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeLessThanOrEqual(CANVAS_HEIGHT - size.height);
      }
    });

    it('generates integer positions', () => {
      const size = { width: 300, height: 200 };
      for (let i = 0; i < 20; i++) {
        const pos = generateRandomPosition(size);
        expect(Number.isInteger(pos.x)).toBe(true);
        expect(Number.isInteger(pos.y)).toBe(true);
      }
    });
  });
});
