import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { syncRoutes } from './sync.routes.js';

const syncPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(syncRoutes, { prefix: '/api/v1/sync' });
};

export default fp(syncPlugin, { name: 'sync-plugin' });
