import type { FastifyPluginAsync } from 'fastify';
import { authRateLimitPlugin } from '../../shared/plugins/rate-limit.js';
import authRoutes from './auth.routes.js';

const authPlugin: FastifyPluginAsync = async (app) => {
  // Apply auth rate limiting to all routes in this plugin scope
  await app.register(authRateLimitPlugin);

  // Register routes
  await app.register(authRoutes);
};

export default authPlugin;
