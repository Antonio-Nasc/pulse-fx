import { describe, expect, it } from "vitest";

import type {
  IndicatorRepository,
  IndicatorSnapshot,
} from "./indicator-repository.js";
import { listIndicators } from "./list-indicators.js";

const now = new Date("2026-09-24T12:00:00.000Z");

function createIndicator(
  overrides: Partial<IndicatorSnapshot> = {},
): IndicatorSnapshot {
  return {
    slug: "usd-brl-ptax",
    name: "USD/BRL PTAX venda",
    source: "BCB",
    frequency: "DAILY",
    unit: "BRL/USD",
    description: "Referência do valor do dólar em reais.",
    limitationText: "Não é uma cotação em tempo real.",
    sourceUrl: "https://example.com/ptax",
    historyMonths: 3,
    variationPolicy: {
      strategy: "PREVIOUS_OBSERVATIONS",
      periods: 5,
    },
    ttlMinutes: 360,
    lastSyncedAt: new Date("2026-09-24T11:00:00.000Z"),
    observations: [
      { referenceDate: "2026-09-14", value: 5 },
      { referenceDate: "2026-09-15", value: 5.1 },
      { referenceDate: "2026-09-16", value: 5.2 },
      { referenceDate: "2026-09-18", value: 5.3 },
      { referenceDate: "2026-09-21", value: 5.4 },
      { referenceDate: "2026-09-23", value: 5.5 },
    ],
    ...overrides,
  };
}

function repositoryFor(
  ...indicators: IndicatorSnapshot[]
): IndicatorRepository {
  return {
    async listSnapshots() {
      return indicators;
    },
  };
}

describe("listIndicators", () => {
  it("returns the latest observation and the configured variation", async () => {
    const result = await listIndicators(repositoryFor(createIndicator()), now);

    expect(result).toEqual([
      {
        slug: "usd-brl-ptax",
        name: "USD/BRL PTAX venda",
        source: "BCB",
        frequency: "DAILY",
        unit: "BRL/USD",
        latestValue: 5.5,
        referenceDate: "2026-09-23",
        changePercent: 10,
        variationLabel: "5 observações",
        lastSyncedAt: "2026-09-24T11:00:00.000Z",
        stale: false,
      },
    ]);
  });

  it("returns null values for an indicator without observations", async () => {
    const result = await listIndicators(
      repositoryFor(
        createIndicator({
          observations: [],
          lastSyncedAt: null,
        }),
      ),
      now,
    );

    expect(result[0]).toMatchObject({
      latestValue: null,
      referenceDate: null,
      changePercent: null,
      lastSyncedAt: null,
      stale: true,
    });
  });

  it("preserves existing values when synchronization has expired", async () => {
    const result = await listIndicators(
      repositoryFor(
        createIndicator({
          lastSyncedAt: new Date("2026-09-24T05:00:00.000Z"),
        }),
      ),
      now,
    );

    expect(result[0]).toMatchObject({
      latestValue: 5.5,
      referenceDate: "2026-09-23",
      changePercent: 10,
      stale: true,
    });
  });

  it("expires exactly at the TTL boundary", async () => {
    const result = await listIndicators(
      repositoryFor(
        createIndicator({
          lastSyncedAt: new Date("2026-09-24T06:00:00.000Z"),
        }),
      ),
      now,
    );

    expect(result[0]?.stale).toBe(true);
  });

  it("returns no variation when there is insufficient history", async () => {
    const result = await listIndicators(
      repositoryFor(
        createIndicator({
          observations: [{ referenceDate: "2026-09-23", value: 5.5 }],
        }),
      ),
      now,
    );

    expect(result[0]).toMatchObject({
      latestValue: 5.5,
      changePercent: null,
      stale: false,
    });
  });

  it("uses synchronization time to determine freshness of monthly data", async () => {
    const result = await listIndicators(
      repositoryFor(
        createIndicator({
          slug: "fed-funds",
          source: "FRED",
          frequency: "MONTHLY",
          variationPolicy: {
            strategy: "PREVIOUS_CALENDAR_MONTH",
            periods: 1,
          },
          ttlMinutes: 1440,
          observations: [
            { referenceDate: "2026-07-01", value: 4 },
            { referenceDate: "2026-08-01", value: 4.2 },
          ],
        }),
      ),
      now,
    );

    expect(result[0]).toMatchObject({
      referenceDate: "2026-08-01",
      variationLabel: "1 mês",
      stale: false,
    });
    expect(result[0]?.changePercent).toBeCloseTo(5);
  });

  it("labels the calendar-day policy", async () => {
    const result = await listIndicators(
      repositoryFor(
        createIndicator({
          variationPolicy: {
            strategy: "PREVIOUS_CALENDAR_DAYS",
            periods: 30,
          },
        }),
      ),
      now,
    );

    expect(result[0]?.variationLabel).toBe("30 dias");
  });

  it("returns an empty list when no indicators are registered", async () => {
    expect(await listIndicators(repositoryFor(), now)).toEqual([]);
  });
});
