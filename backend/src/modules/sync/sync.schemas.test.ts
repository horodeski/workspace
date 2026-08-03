import { describe, it, expect } from 'vitest';
import { syncPushSchema } from './sync.schemas.js';

describe('syncPushSchema', () => {
  it('should accept a valid push payload with one operation', () => {
    const payload = {
      operations: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          entity: 'activity',
          action: 'create',
          data: { title: 'Test', date: '2024-01-15' },
          timestamp: '2024-01-15T10:30:00.000Z',
        },
      ],
    };

    const result = syncPushSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should accept multiple operations', () => {
    const payload = {
      operations: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          entity: 'activity',
          action: 'create',
          data: { title: 'Test' },
          timestamp: '2024-01-15T10:30:00.000Z',
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          entity: 'board',
          action: 'update',
          data: { id: '323e4567-e89b-12d3-a456-426614174000', name: 'Updated' },
          timestamp: '2024-01-15T10:31:00.000Z',
        },
      ],
    };

    const result = syncPushSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should reject empty operations array', () => {
    const payload = { operations: [] };
    const result = syncPushSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('should reject invalid entity type', () => {
    const payload = {
      operations: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          entity: 'invalid-entity',
          action: 'create',
          data: {},
          timestamp: '2024-01-15T10:30:00.000Z',
        },
      ],
    };

    const result = syncPushSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('should reject invalid action', () => {
    const payload = {
      operations: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          entity: 'activity',
          action: 'invalid-action',
          data: {},
          timestamp: '2024-01-15T10:30:00.000Z',
        },
      ],
    };

    const result = syncPushSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('should reject invalid timestamp', () => {
    const payload = {
      operations: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          entity: 'activity',
          action: 'create',
          data: {},
          timestamp: 'not-a-date',
        },
      ],
    };

    const result = syncPushSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('should reject invalid operation ID (not UUID)', () => {
    const payload = {
      operations: [
        {
          id: 'not-a-uuid',
          entity: 'activity',
          action: 'create',
          data: {},
          timestamp: '2024-01-15T10:30:00.000Z',
        },
      ],
    };

    const result = syncPushSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('should accept all valid entity types', () => {
    const entities = ['activity', 'support-entry', 'board', 'board-item', 'review'] as const;

    for (const entity of entities) {
      const payload = {
        operations: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            entity,
            action: 'create',
            data: {},
            timestamp: '2024-01-15T10:30:00.000Z',
          },
        ],
      };

      const result = syncPushSchema.safeParse(payload);
      expect(result.success).toBe(true);
    }
  });

  it('should accept all valid action types', () => {
    const actions = ['create', 'update', 'delete'] as const;

    for (const action of actions) {
      const payload = {
        operations: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            entity: 'activity',
            action,
            data: {},
            timestamp: '2024-01-15T10:30:00.000Z',
          },
        ],
      };

      const result = syncPushSchema.safeParse(payload);
      expect(result.success).toBe(true);
    }
  });
});
