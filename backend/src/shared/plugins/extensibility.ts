/**
 * Plugin Extension Point Documentation
 *
 * The Workspace Backend supports extension through Fastify plugins.
 * Each domain module (auth, activities, support-entries, boards, reviews, sync)
 * is implemented as a self-contained Fastify plugin with its own routes, schemas,
 * services, and repositories.
 *
 * ## Creating a Plugin
 *
 * Every domain module follows this pattern:
 *
 * 1. Create a Fastify plugin:
 *    ```typescript
 *    import type { FastifyPluginAsync } from 'fastify';
 *
 *    const myPlugin: FastifyPluginAsync = async (fastify) => {
 *      // Register routes, hooks, middleware, etc.
 *    };
 *    export default myPlugin;
 *    ```
 *
 * 2. Subscribe to domain events via the shared EventBus:
 *    ```typescript
 *    import { eventBus } from '../../shared/event-bus/index.js';
 *
 *    eventBus.subscribe('activity.created', (event) => {
 *      // React to the event asynchronously
 *    });
 *    ```
 *
 * 3. Register in app.ts:
 *    ```typescript
 *    import myPlugin from './modules/my-module/my-plugin.js';
 *    await app.register(myPlugin, { prefix: '/api/v1/my-module' });
 *    ```
 *
 * ## Middleware Extension
 *
 * Plugins can register custom middleware (Fastify hooks) scoped to their routes:
 *    ```typescript
 *    const myPlugin: FastifyPluginAsync<PluginMiddlewareOptions> = async (fastify, opts) => {
 *      // Register plugin-scoped hooks
 *      if (opts.middleware) {
 *        for (const mw of opts.middleware) {
 *          fastify.addHook(mw.hook, mw.handler);
 *        }
 *      }
 *      // Register routes...
 *    };
 *    ```
 *
 * ## EventBus as Injectable Dependency
 *
 * The EventBus singleton is exported from `src/shared/event-bus/index.ts` and can be
 * imported by any module. New plugins can subscribe to existing domain events without
 * modifying the emitting module:
 *
 * Supported events:
 * - `activity.created` — emitted when a new activity is created
 * - `review.saved` — emitted when a weekly review is saved
 * - `review.unlocked` — emitted when a weekly review is unlocked
 * - `board.created` — emitted when a new board is created
 * - `board.deleted` — emitted when a board is deleted
 * - `support-card.cleared` — emitted when support entries are finalized
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import type { IEventBus, DomainEvent } from '../event-bus/event-bus.js';

/**
 * Metadata describing a plugin for registration and dependency resolution.
 */
export interface PluginMetadata {
  /** Unique name identifying this plugin */
  name: string;
  /** Semantic version of the plugin */
  version?: string;
  /** Human-readable description of the plugin's purpose */
  description?: string;
  /** List of plugin names this plugin depends on (must be registered first) */
  dependencies?: string[];
}

/**
 * Interface for plugins that need to register and manage event handlers.
 * Implement this when your plugin subscribes to domain events and needs
 * a clean teardown path (e.g., for testing or graceful shutdown).
 */
export interface EventAwarePlugin {
  /** Register all event subscriptions for this plugin */
  registerEventHandlers(): void;
  /** Remove all event subscriptions (for cleanup/teardown) */
  unregisterEventHandlers(): void;
}

/**
 * Supported Fastify lifecycle hooks for custom middleware registration.
 */
export type MiddlewareHook =
  | 'onRequest'
  | 'preParsing'
  | 'preValidation'
  | 'preHandler'
  | 'preSerialization'
  | 'onSend'
  | 'onResponse'
  | 'onError';

/**
 * A custom middleware definition that can be registered via plugin configuration.
 * This allows extending the request pipeline without modifying core application code.
 */
export interface PluginMiddleware {
  /** The Fastify lifecycle hook to attach to */
  hook: MiddlewareHook;
  /** The handler function invoked at the specified hook point */
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<void> | void;
}

/**
 * Options for plugins that support registering custom middleware via configuration.
 * Pass these when registering a plugin to inject additional request pipeline behavior.
 *
 * @example
 * ```typescript
 * await app.register(myPlugin, {
 *   middleware: [
 *     { hook: 'preHandler', handler: async (req, reply) => { /* custom logic *\/ } }
 *   ]
 * });
 * ```
 */
export interface PluginMiddlewareOptions {
  /** Custom middleware handlers to register within the plugin scope */
  middleware?: PluginMiddleware[];
}

/**
 * Factory type for creating a domain plugin with access to the EventBus.
 * Use this when your plugin needs event-driven behavior injected at creation time.
 *
 * @example
 * ```typescript
 * import { eventBus } from '../../shared/event-bus/index.js';
 * import type { EventBusPluginFactory } from '../../shared/plugins/extensibility.js';
 *
 * const createNotificationPlugin: EventBusPluginFactory = (bus) => {
 *   return async (fastify) => {
 *     bus.subscribe('activity.created', (event) => {
 *       fastify.log.info({ event }, 'Activity created notification');
 *     });
 *   };
 * };
 * ```
 */
export type EventBusPluginFactory = (eventBus: IEventBus) => FastifyPluginAsync;

/**
 * Re-export EventBus types for convenience so plugin authors can import
 * everything from a single extensibility module.
 */
export type { IEventBus, DomainEvent };
