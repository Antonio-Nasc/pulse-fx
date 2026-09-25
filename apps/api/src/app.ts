import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";

import { healthRoutes } from "./http/routes/health.js";
import type { IndicatorRepository } from "./modules/indicators/application/indicator-repository.js";
import { indicatorRoutes } from "./modules/indicators/http/indicator-routes.js";
import type { FavoriteRepository } from "./modules/favorites/application/favorite-repository.js";
import { favoriteRoutes } from "./modules/favorites/http/favorite-routes.js";

type AppDependencies = {
  indicatorRepository?: IndicatorRepository;
  favoriteRepository?: FavoriteRepository;
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
  
  if (dependencies.favoriteRepository) {
    app.register(favoriteRoutes, {
      repository: dependencies.favoriteRepository,
    });
  }
  return app;
}
