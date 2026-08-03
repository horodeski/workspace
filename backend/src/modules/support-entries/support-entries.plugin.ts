import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { supportEntriesRoutes } from './support-entries.routes.js';
import { supportEntryAttachmentsRoutes } from './attachments.routes.js';

const supportEntriesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(supportEntriesRoutes, { prefix: '/api/v1/support-entries' });
  fastify.register(supportEntryAttachmentsRoutes, { prefix: '/api/v1/support-entries' });
};

export default fp(supportEntriesPlugin, { name: 'support-entries-plugin' });
