import type { IndicatorProvider } from "../modules/indicators/application/indicator-provider.js";

export type IndicatorSyncResult = {
  status: "synced" | "fresh" | "already-running";
  observationsWritten: number;
};

export type IndicatorSyncEntry = {
  slug: string;
  provider: IndicatorProvider;
};

type SynchronizeIndicator = (
  slug: string,
  provider: IndicatorProvider,
) => Promise<IndicatorSyncResult>;

type SchedulerLogger = {
  info(bindings: Record<string, unknown>, message: string): void;
  error(bindings: Record<string, unknown>, message: string): void;
};

type IndicatorSyncSchedulerOptions = {
  entries: IndicatorSyncEntry[];
  synchronize: SynchronizeIndicator;
  logger: SchedulerLogger;
  intervalMilliseconds: number;
};

export function createIndicatorSyncScheduler({
  entries,
  synchronize,
  logger,
  intervalMilliseconds,
}: IndicatorSyncSchedulerOptions) {
  if (!Number.isInteger(intervalMilliseconds) || intervalMilliseconds < 1_000) {
    throw new Error(
      "Sync interval must be an integer of at least 1000 milliseconds",
    );
  }

  let timer: NodeJS.Timeout | undefined;
  let activeCycle: Promise<void> | undefined;

  async function executeCycle(): Promise<void> {
    for (const entry of entries) {
      try {
        const result = await synchronize(entry.slug, entry.provider);

        logger.info(
          {
            indicator: entry.slug,
            ...result,
          },
          "Indicator synchronization completed",
        );
      } catch (error) {
        logger.error(
          {
            err: error,
            indicator: entry.slug,
          },
          "Indicator synchronization failed",
        );
      }
    }
  }

  function runOnce(): Promise<void> {
    if (activeCycle) {
      logger.info(
        { event: "indicator-sync-skipped" },
        "Indicator synchronization is already running",
      );

      return Promise.resolve();
    }

    activeCycle = executeCycle().finally(() => {
      activeCycle = undefined;
    });

    return activeCycle;
  }

  function start(): void {
    if (timer) {
      return;
    }

    void runOnce();

    timer = setInterval(() => {
      void runOnce();
    }, intervalMilliseconds);

    timer.unref();
  }

  async function stop(): Promise<void> {
    if (timer) {
      clearInterval(timer);
      timer = undefined;
    }

    if (activeCycle) {
      await activeCycle;
    }
  }

  return {
    runOnce,
    start,
    stop,
  };
}
