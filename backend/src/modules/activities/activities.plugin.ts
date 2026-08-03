import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { activitiesRoutes } from './activities.routes.js';
import { activityAttachmentsRoutes } from './attachments.routes.js';

const activitiesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(activitiesRoutes, { prefix: '/api/v1/activities' });
  fastify.register(activityAttachmentsRoutes, { prefix: '/api/v1/activities' });
};

export default fp(activitiesPlugin, { name: 'activities-plugin' });
