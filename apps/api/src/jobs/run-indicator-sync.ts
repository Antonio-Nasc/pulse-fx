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

export function requireJobEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export async function runIndicatorSync({
  slug,
  provider,
}: RunIndicatorSyncOptions): Promise<void> {
  const connectionString = requireJobEnvironmentVariable("DATABASE_URL");

  const database = createDatabaseClient(connectionString);

  try {
    const result = await syncPersistedIndicator(database, slug, provider);

    console.info({
      indicator: slug,
      ...result,
    });
  } finally {
    await database.$disconnect();
  }
}
