import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventBus } from './event-bus.js';
import type { DomainEvent, IEventBus } from './event-bus.js';

describe('EventBus', () => {
  let bus: IEventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('subscribe and publish', () => {
    it('delivers event to subscribed handler', async () => {
      const handler = vi.fn();
      bus.subscribe('activity.created', handler);

      const event: DomainEvent = {
        type: 'activity.created',
        payload: { activityId: 'act-1', userId: 'user-1' },
      };
      bus.publish(event);

      // Wait for queueMicrotask to process
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('delivers event to multiple subscribers of the same type', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.subscribe('board.created', handler1);
      bus.subscribe('board.created', handler2);

      const event: DomainEvent = {
        type: 'board.created',
        payload: { boardId: 'board-1', userId: 'user-1' },
      };
      bus.publish(event);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();
    });

    it('does not deliver event to handlers of different types', async () => {
      const handler = vi.fn();
      bus.subscribe('board.created', handler);

      const event: DomainEvent = {
        type: 'board.deleted',
        payload: { boardId: 'board-1', userId: 'user-1' },
      };
      bus.publish(event);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handler).not.toHaveBeenCalled();
    });

    it('does nothing when publishing to a type with no subscribers', () => {
      // Should not throw
      expect(() => {
        bus.publish({
          type: 'review.saved',
          payload: { reviewId: 'r-1', userId: 'u-1', week: 1, year: 2024 },
        });
      }).not.toThrow();
    });
  });

  describe('unsubscribe', () => {
    it('removes handler so it no longer receives events', async () => {
      const handler = vi.fn();
      bus.subscribe('activity.created', handler);
      bus.unsubscribe('activity.created', handler);

      bus.publish({
        type: 'activity.created',
        payload: { activityId: 'act-1', userId: 'user-1' },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handler).not.toHaveBeenCalled();
    });

    it('only removes the specific handler, others remain', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.subscribe('support-card.cleared', handler1);
      bus.subscribe('support-card.cleared', handler2);
      bus.unsubscribe('support-card.cleared', handler1);

      bus.publish({
        type: 'support-card.cleared',
        payload: { userId: 'user-1', count: 5 },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledOnce();
    });

    it('handles unsubscribing a handler that was never subscribed', () => {
      const handler = vi.fn();
      // Should not throw
      expect(() => {
        bus.unsubscribe('activity.created', handler);
      }).not.toThrow();
    });
  });

  describe('async processing', () => {
    it('does not block the caller when publishing', () => {
      const handler = vi.fn(() => {
        // Simulate slow handler
        return new Promise<void>((resolve) => setTimeout(resolve, 100));
      });
      bus.subscribe('review.unlocked', handler);

      const start = Date.now();
      bus.publish({
        type: 'review.unlocked',
        payload: { reviewId: 'r-1', userId: 'u-1' },
      });
      const elapsed = Date.now() - start;

      // publish should return immediately (< 5ms), not wait for handler
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('error handling', () => {
    it('does not propagate synchronous handler errors', async () => {
      const failingHandler = vi.fn(() => {
        throw new Error('handler exploded');
      });
      const successHandler = vi.fn();

      bus.subscribe('activity.created', failingHandler);
      bus.subscribe('activity.created', successHandler);

      bus.publish({
        type: 'activity.created',
        payload: { activityId: 'act-1', userId: 'user-1' },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(failingHandler).toHaveBeenCalledOnce();
      expect(successHandler).toHaveBeenCalledOnce();
    });

    it('does not propagate async handler rejections', async () => {
      const failingHandler = vi.fn(async () => {
        throw new Error('async handler exploded');
      });
      const successHandler = vi.fn();

      bus.subscribe('board.deleted', failingHandler);
      bus.subscribe('board.deleted', successHandler);

      bus.publish({
        type: 'board.deleted',
        payload: { boardId: 'board-1', userId: 'user-1' },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(failingHandler).toHaveBeenCalledOnce();
      expect(successHandler).toHaveBeenCalledOnce();
    });
  });
});
