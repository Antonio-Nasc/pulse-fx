import { describe, expect, it, vi } from "vitest";

import type { IndicatorProvider } from "../modules/indicators/application/indicator-provider.js";

import { createIndicatorSyncScheduler } from "./indicator-sync-scheduler.js";

function createProvider(): IndicatorProvider {
  return {
    fetchObservations: vi.fn(),
  };
}

function createLogger() {
  return {
    info: vi.fn(),
    error: vi.fn(),
  };
}

describe("createIndicatorSyncScheduler", () => {
  it("isolates provider failures and continues the cycle", async () => {
    const logger = createLogger();

    const synchronize = vi.fn(
      async (slug: string) => {
        if (slug === "failed-indicator") {
          throw new Error("Provider unavailable");
        }

        return {
          status: "fresh" as const,
          observationsWritten: 0,
        };
      },
    );

    const scheduler = createIndicatorSyncScheduler({
      entries: [
        {
          slug: "failed-indicator",
          provider: createProvider(),
        },
        {
          slug: "healthy-indicator",
          provider: createProvider(),
        },
      ],
      synchronize,
      logger,
      intervalMilliseconds: 60_000,
    });

    await scheduler.runOnce();

    expect(synchronize).toHaveBeenCalledTimes(2);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        indicator: "failed-indicator",
        err: expect.any(Error),
      }),
      "Indicator synchronization failed",
    );

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        indicator: "healthy-indicator",
        status: "fresh",
        observationsWritten: 0,
      }),
      "Indicator synchronization completed",
    );
  });

  it("does not overlap synchronization cycles", async () => {
    const logger = createLogger();

    let completeSynchronization:
      | ((result: {
          status: "fresh";
          observationsWritten: number;
        }) => void)
      | undefined;

    const pendingSynchronization = new Promise<{
      status: "fresh";
      observationsWritten: number;
    }>((resolve) => {
      completeSynchronization = resolve;
    });

    const synchronize = vi.fn(
      async () => pendingSynchronization,
    );

    const scheduler = createIndicatorSyncScheduler({
      entries: [
        {
          slug: "slow-indicator",
          provider: createProvider(),
        },
      ],
      synchronize,
      logger,
      intervalMilliseconds: 60_000,
    });

    const firstCycle = scheduler.runOnce();
    await scheduler.runOnce();

    expect(synchronize).toHaveBeenCalledTimes(1);

    expect(logger.info).toHaveBeenCalledWith(
      { event: "indicator-sync-skipped" },
      "Indicator synchronization is already running",
    );

    completeSynchronization?.({
      status: "fresh",
      observationsWritten: 0,
    });

    await firstCycle;
  });

  it("rejects an invalid interval", () => {
    expect(() =>
      createIndicatorSyncScheduler({
        entries: [],
        synchronize: vi.fn(),
        logger: createLogger(),
        intervalMilliseconds: 0,
      }),
    ).toThrow(
      "Sync interval must be an integer of at least 1000 milliseconds",
    );
  });
});