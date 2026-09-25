import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

import { createDatabaseClient } from './client.js';
import { indicatorCatalog } from './indicator-catalog.js';

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
    await database.$transaction(
      indicatorCatalog.map((indicator) =>
        database.indicator.upsert({
          where: { slug: indicator.slug },
          create: indicator,
          update: indicator,
        }),
      ),
    );

    console.info(`Seed completed: ${indicatorCatalog.length} indicators.`);
  } finally {
    await database.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});