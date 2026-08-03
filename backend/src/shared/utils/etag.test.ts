import { describe, it, expect } from 'vitest';
import { generateETag, parseETag, isETagMatch } from './etag.js';

describe('ETag utility', () => {
  describe('generateETag', () => {
    it('should generate a weak ETag from updatedAt timestamp', () => {
      const entity = { updatedAt: new Date('2024-01-15T10:30:00.000Z') };
      const etag = generateETag(entity);
      expect(etag).toBe(`W/"${entity.updatedAt.getTime()}"`);
    });

    it('should produce different ETags for different timestamps', () => {
      const entity1 = { updatedAt: new Date('2024-01-15T10:30:00.000Z') };
      const entity2 = { updatedAt: new Date('2024-01-15T10:31:00.000Z') };
      expect(generateETag(entity1)).not.toBe(generateETag(entity2));
    });

    it('should produce the same ETag for the same timestamp', () => {
      const entity1 = { updatedAt: new Date('2024-01-15T10:30:00.000Z') };
      const entity2 = { updatedAt: new Date('2024-01-15T10:30:00.000Z') };
      expect(generateETag(entity1)).toBe(generateETag(entity2));
    });

    it('should start with W/ indicating a weak ETag', () => {
      const entity = { updatedAt: new Date() };
      expect(generateETag(entity)).toMatch(/^W\//);
    });
  });

  describe('parseETag', () => {
    it('should parse a valid weak ETag to a timestamp', () => {
      const timestamp = 1705312200000;
      const parsed = parseETag(`W/"${timestamp}"`);
      expect(parsed).toBe(timestamp);
    });

    it('should return null for invalid ETag format', () => {
      expect(parseETag('invalid')).toBeNull();
      expect(parseETag('"123"')).toBeNull();
      expect(parseETag('W/123')).toBeNull();
      expect(parseETag('W/"abc"')).toBeNull();
      expect(parseETag('')).toBeNull();
    });

    it('should round-trip with generateETag', () => {
      const entity = { updatedAt: new Date('2024-06-01T12:00:00.000Z') };
      const etag = generateETag(entity);
      const parsed = parseETag(etag);
      expect(parsed).toBe(entity.updatedAt.getTime());
    });
  });

  describe('isETagMatch', () => {
    it('should return true when ETag matches current entity updatedAt', () => {
      const entity = { updatedAt: new Date('2024-01-15T10:30:00.000Z') };
      const etag = generateETag(entity);
      expect(isETagMatch(etag, entity)).toBe(true);
    });

    it('should return false when ETag is stale (entity was updated after)', () => {
      const oldEntity = { updatedAt: new Date('2024-01-15T10:30:00.000Z') };
      const etag = generateETag(oldEntity);

      const updatedEntity = { updatedAt: new Date('2024-01-15T11:00:00.000Z') };
      expect(isETagMatch(etag, updatedEntity)).toBe(false);
    });

    it('should return false for invalid ETag format', () => {
      const entity = { updatedAt: new Date() };
      expect(isETagMatch('invalid', entity)).toBe(false);
    });
  });
});
