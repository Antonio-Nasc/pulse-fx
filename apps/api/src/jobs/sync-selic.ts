import { BcbSelicProvider } from "../modules/indicators/infrastructure/bcb-selic-provider.js";

import { runIndicatorSync } from "./run-indicator-sync.js";

runIndicatorSync({
  slug: "selic-target",
  provider: new BcbSelicProvider(),
}).catch((error: unknown) => {
  console.error("Selic synchronization failed:", error);
  process.exitCode = 1;
});