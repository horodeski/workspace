import { describe, it, expect } from 'vitest';
import { normalizePaginationOptions } from './pagination.js';

describe('normalizePaginationOptions', () => {
  it('uses default limit of 20 when not provided', () => {
    const result = normalizePaginationOptions({});
    expect(result.limit).toBe(20);
  });

  it('clamps limit to minimum of 1', () => {
    const result = normalizePaginationOptions({ limit: 0 });
    expect(result.limit).toBe(1);

    const result2 = normalizePaginationOptions({ limit: -5 });
    expect(result2.limit).toBe(1);
  });

  it('clamps limit to maximum of 100', () => {
    const result = normalizePaginationOptions({ limit: 200 });
    expect(result.limit).toBe(100);

    const result2 = normalizePaginationOptions({ limit: 101 });
    expect(result2.limit).toBe(100);
  });

  it('preserves valid limit within range', () => {
    const result = normalizePaginationOptions({ limit: 50 });
    expect(result.limit).toBe(50);
  });

  it('passes through cursor', () => {
    const result = normalizePaginationOptions({ cursor: 'abc123' });
    expect(result.cursor).toBe('abc123');
  });

  it('passes through sort options', () => {
    const sort = { field: 'createdAt', order: 'desc' as const };
    const result = normalizePaginationOptions({ sort });
    expect(result.sort).toEqual(sort);
  });

  it('passes through filter options', () => {
    const filter = { type: 'quote' };
    const result = normalizePaginationOptions({ filter });
    expect(result.filter).toEqual(filter);
  });

  it('returns undefined for unset optional fields', () => {
    const result = normalizePaginationOptions({});
    expect(result.cursor).toBeUndefined();
    expect(result.sort).toBeUndefined();
    expect(result.filter).toBeUndefined();
  });
});
