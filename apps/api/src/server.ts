import { buildApp } from './app.js';
import { env } from './config/env.js';
import { createDatabaseClient } from './database/client.js';
import { PrismaIndicatorRepository } from './modules/indicators/infrastructure/prisma-indicator-repository.js';

const database = createDatabaseClient(env.DATABASE_URL);
const indicatorRepository = new PrismaIndicatorRepository(database);

const app = buildApp({}, { indicatorRepository });

app.addHook('onClose', async () => {
  await database.$disconnect();
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  app.log.info({ signal }, 'Shutting down API');

  try {
    await app.close();
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

try {
  await database.$connect();

  await app.listen({
    host: env.API_HOST,
    port: env.API_PORT,
  });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
  await app.close();
}