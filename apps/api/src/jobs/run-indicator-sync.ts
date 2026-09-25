import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

import { createDatabaseClient } from "../database/client.js";
import type { IndicatorProvider } from "../modules/indicators/application/indicator-provider.js";
import { syncPersistedIndicator } from "../modules/indicators/infrastructure/sync-persisted-indicator.js";

type RunIndicatorSyncOptions = {
  slug: string;
  provider: IndicatorProvider;
};

dotenv.config({
  path: fileURLToPath(new URL("../../../../.env", import.meta.url)),
  quiet: true,
});

export async function runIndicatorSync({
  slug,
  provider,
}: RunIndicatorSyncOptions): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const database = createDatabaseClient(connectionString);

  try {
    const result = await syncPersistedIndicator(
      database,
      slug,
      provider,
    );

    console.info({
      indicator: slug,
      ...result,
    });
  } finally {
    await database.$disconnect();
  }
}