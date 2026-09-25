import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

dotenv.config({
  path: fileURLToPath(new URL("../../../../.env", import.meta.url)),
  quiet: true,
});

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 3333);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      "API_PORT must be an integer between 1 and 65535",
    );
  }

  return port;
}

function parsePositiveInteger(
  name: string,
  value: string | undefined,
  defaultValue: number,
): number {
  const parsed = Number(value ?? defaultValue);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

function requireEnvironmentVariable(
  name: string,
  value: string | undefined,
): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`${name} is required`);
  }

  return normalizedValue;
}

const syncIntervalMinutes = parsePositiveInteger(
  "SYNC_INTERVAL_MINUTES",
  process.env.SYNC_INTERVAL_MINUTES,
  15,
);

export const env = {
  API_HOST: process.env.API_HOST ?? "0.0.0.0",
  API_PORT: parsePort(process.env.API_PORT),
  DATABASE_URL: requireEnvironmentVariable(
    "DATABASE_URL",
    process.env.DATABASE_URL,
  ),
  FRED_API_KEY: requireEnvironmentVariable(
    "FRED_API_KEY",
    process.env.FRED_API_KEY,
  ),
  SYNC_INTERVAL_MILLISECONDS: syncIntervalMinutes * 60_000,
};