import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { boardsRoutes } from './boards.routes.js';

const boardsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(boardsRoutes, { prefix: '/api/v1/boards' });
};

export default fp(boardsPlugin, { name: 'boards-plugin' });
