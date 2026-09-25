import { BcbPtaxProvider } from "../modules/indicators/infrastructure/bcb-ptax-provider.js";

import { runIndicatorSync } from "./run-indicator-sync.js";

runIndicatorSync({
  slug: "usd-brl-ptax",
  provider: new BcbPtaxProvider(),
}).catch((error: unknown) => {
  console.error("PTAX synchronization failed:", error);
  process.exitCode = 1;
});
