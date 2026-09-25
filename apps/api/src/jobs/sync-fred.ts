import { FredFundsProvider } from "../modules/indicators/infrastructure/fred-funds-provider.js";

import {
  requireJobEnvironmentVariable,
  runIndicatorSync,
} from "./run-indicator-sync.js";

async function main(): Promise<void> {
  const apiKey = requireJobEnvironmentVariable("FRED_API_KEY");

  await runIndicatorSync({
    slug: "fed-funds",
    provider: new FredFundsProvider(apiKey),
  });
}

main().catch((error: unknown) => {
  console.error("FRED synchronization failed:", error);
  process.exitCode = 1;
});