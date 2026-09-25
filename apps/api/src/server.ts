import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { createDatabaseClient } from "./database/client.js";
import { PrismaIndicatorRepository } from "./modules/indicators/infrastructure/prisma-indicator-repository.js";
import { createIndicatorSyncScheduler } from "./jobs/indicator-sync-scheduler.js";
import { BcbPtaxProvider } from "./modules/indicators/infrastructure/bcb-ptax-provider.js";
import { BcbSelicProvider } from "./modules/indicators/infrastructure/bcb-selic-provider.js";
import { FredFundsProvider } from "./modules/indicators/infrastructure/fred-funds-provider.js";
import { syncPersistedIndicator } from "./modules/indicators/infrastructure/sync-persisted-indicator.js";
import { PrismaFavoriteRepository } from "./modules/favorites/infrastructure/prisma-favorite-repository.js";

const database = createDatabaseClient(env.DATABASE_URL);
const indicatorRepository = new PrismaIndicatorRepository(database);
const favoriteRepository = new PrismaFavoriteRepository(database);

const app = buildApp(
  {},
  {
    indicatorRepository,
    favoriteRepository,
  },
);

const syncScheduler = createIndicatorSyncScheduler({
  entries: [
    {
      slug: "usd-brl-ptax",
      provider: new BcbPtaxProvider(),
    },
    {
      slug: "selic-target",
      provider: new BcbSelicProvider(),
    },
    {
      slug: "fed-funds",
      provider: new FredFundsProvider(env.FRED_API_KEY),
    },
  ],
  synchronize: (slug, provider) =>
    syncPersistedIndicator(database, slug, provider),
  logger: app.log,
  intervalMilliseconds: env.SYNC_INTERVAL_MILLISECONDS,
});

app.addHook("onClose", async () => {
  await syncScheduler.stop();
  await database.$disconnect();
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  app.log.info({ signal }, "Shutting down API");

  try {
    await app.close();
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

try {
  await database.$connect();

  await app.listen({
    host: env.API_HOST,
    port: env.API_PORT,
  });
  syncScheduler.start();
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
  await app.close();
}
