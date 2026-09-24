import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';

import { healthRoutes } from './http/routes/health.js';

export function buildApp(
  options: FastifyServerOptions = {},
): FastifyInstance {
  const app = Fastify({
    logger: true,
    ...options,
  });

  app.register(healthRoutes);

  return app;
}