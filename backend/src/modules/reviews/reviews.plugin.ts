import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { reviewsRoutes } from './reviews.routes.js';

const reviewsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(reviewsRoutes, { prefix: '/api/v1/reviews' });
};

export default fp(reviewsPlugin, { name: 'reviews-plugin' });
