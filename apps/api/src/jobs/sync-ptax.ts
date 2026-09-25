import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

import { createDatabaseClient } from '../database/client.js';
import { BcbPtaxProvider } from '../modules/indicators/infrastructure/bcb-ptax-provider.js';
import { syncPersistedIndicator } from '../modules/indicators/infrastructure/sync-persisted-indicator.js';

dotenv.config({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
  quiet: true,
});

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  const database = createDatabaseClient(connectionString);

  try {
    const result = await syncPersistedIndicator(
      database,
      'usd-brl-ptax',
      new BcbPtaxProvider(),
    );

    console.info({
      indicator: 'usd-brl-ptax',
      ...result,
    });
  } finally {
    await database.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('PTAX synchronization failed:', error);
  process.exitCode = 1;
});