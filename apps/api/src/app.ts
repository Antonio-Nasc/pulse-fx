import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';

import { healthRoutes } from './http/routes/health.js';
import type { IndicatorRepository } from './modules/indicators/application/indicator-repository.js';
import { indicatorRoutes } from './modules/indicators/http/indicator-routes.js';

type AppDependencies = {
  indicatorRepository?: IndicatorRepository;
};

export function buildApp(
  options: FastifyServerOptions = {},
  dependencies: AppDependencies = {},
): FastifyInstance {
  const app = Fastify({
    logger: true,
    ...options,
  });

  app.register(healthRoutes);

  if (dependencies.indicatorRepository) {
    app.register(indicatorRoutes, {
      repository: dependencies.indicatorRepository,
    });
  }

  return app;
}