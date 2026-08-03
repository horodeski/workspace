import pino from 'pino';

const logger = pino({ name: 'event-bus' });

// Domain event types for the Workspace application
export type DomainEvent =
  | { type: 'activity.created'; payload: { activityId: string; userId: string } }
  | { type: 'review.saved'; payload: { reviewId: string; userId: string; week: number; year: number } }
  | { type: 'review.unlocked'; payload: { reviewId: string; userId: string } }
  | { type: 'board.created'; payload: { boardId: string; userId: string } }
  | { type: 'board.deleted'; payload: { boardId: string; userId: string } }
  | { type: 'support-card.cleared'; payload: { userId: string; count: number } };

export type DomainEventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void;

export interface IEventBus {
  publish(event: DomainEvent): void;
  subscribe<T extends DomainEvent['type']>(
    type: T,
    handler: (event: Extract<DomainEvent, { type: T }>) => Promise<void> | void
  ): void;
  unsubscribe(type: DomainEvent['type'], handler: Function): void;
}

export class EventBus implements IEventBus {
  private handlers: Map<string, Set<Function>> = new Map();

  publish(event: DomainEvent): void {
    const subscribers = this.handlers.get(event.type);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    // Process each handler asynchronously without blocking the caller
    for (const handler of subscribers) {
      queueMicrotask(() => {
        try {
          const result = handler(event);
          // If handler returns a promise, catch rejections
          if (result && typeof result === 'object' && 'catch' in result) {
            (result as Promise<void>).catch((error: unknown) => {
              logger.error(
                { err: error, eventType: event.type },
                'Event handler failed'
              );
            });
          }
        } catch (error: unknown) {
          logger.error(
            { err: error, eventType: event.type },
            'Event handler threw synchronously'
          );
        }
      });
    }
  }

  subscribe<T extends DomainEvent['type']>(
    type: T,
    handler: (event: Extract<DomainEvent, { type: T }>) => Promise<void> | void
  ): void {
    const existing = this.handlers.get(type);
    if (existing) {
      existing.add(handler);
    } else {
      this.handlers.set(type, new Set([handler]));
    }
  }

  unsubscribe(type: DomainEvent['type'], handler: Function): void {
    const subscribers = this.handlers.get(type);
    if (subscribers) {
      subscribers.delete(handler);
      if (subscribers.size === 0) {
        this.handlers.delete(type);
      }
    }
  }
}

// Singleton instance for use throughout the application
export const eventBus = new EventBus();
