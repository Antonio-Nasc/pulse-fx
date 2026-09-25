import { describe, expect, it } from 'vitest';

import type {
  IndicatorRepository,
  IndicatorSnapshot,
} from './indicator-repository.js';
import { getIndicatorDetail } from './get-indicator-detail.js';

const now = new Date('2026-09-24T12:00:00.000Z');

function createIndicator(
  overrides: Partial<IndicatorSnapshot> = {},
): IndicatorSnapshot {
  return {
    slug: 'usd-brl-ptax',
    name: 'USD/BRL PTAX venda',
    source: 'BCB',
    frequency: 'DAILY',
    unit: 'BRL/USD',
    description: 'Referência do dólar em reais.',
    limitationText: 'Não é uma cotação em tempo real.',
    sourceUrl: 'https://example.com/ptax',
    historyMonths: 3,
    variationPolicy: {
      strategy: 'PREVIOUS_OBSERVATIONS',
      periods: 1,
    },
    ttlMinutes: 360,
    lastSyncedAt: new Date('2026-09-24T11:00:00.000Z'),
    observations: [
      { referenceDate: '2026-06-22', value: 4.8 },
      { referenceDate: '2026-06-23', value: 4.9 },
      { referenceDate: '2026-09-22', value: 5 },
      { referenceDate: '2026-09-23', value: 5.5 },
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

describe('getIndicatorDetail', () => {
  it('returns metadata, summary and the configured daily window', async () => {
    const result = await getIndicatorDetail(
      repositoryFor(createIndicator()),
      'usd-brl-ptax',
      now,
    );

    expect(result).toMatchObject({
      slug: 'usd-brl-ptax',
      description: 'Referência do dólar em reais.',
      limitationText: 'Não é uma cotação em tempo real.',
      sourceUrl: 'https://example.com/ptax',
      latestValue: 5.5,
      referenceDate: '2026-09-23',
      changePercent: 10,
      historyMonths: 3,
      stale: false,
    });

    expect(result?.observations).toEqual([
      { referenceDate: '2026-06-23', value: 4.9 },
      { referenceDate: '2026-09-22', value: 5 },
      { referenceDate: '2026-09-23', value: 5.5 },
    ]);
  });

  it('keeps only the configured number of monthly observations', async () => {
    const result = await getIndicatorDetail(
      repositoryFor(
        createIndicator({
          slug: 'fed-funds',
          source: 'FRED',
          frequency: 'MONTHLY',
          historyMonths: 2,
          variationPolicy: {
            strategy: 'PREVIOUS_CALENDAR_MONTH',
            periods: 1,
          },
          observations: [
            { referenceDate: '2026-06-01', value: 4 },
            { referenceDate: '2026-07-01', value: 4.1 },
            { referenceDate: '2026-08-01', value: 4.2 },
          ],
        }),
      ),
      'fed-funds',
      now,
    );

    expect(result?.observations).toEqual([
      { referenceDate: '2026-07-01', value: 4.1 },
      { referenceDate: '2026-08-01', value: 4.2 },
    ]);
  });

  it('returns null for an unknown indicator', async () => {
    const result = await getIndicatorDetail(
      repositoryFor(),
      'unknown',
      now,
    );

    expect(result).toBeNull();
  });
});
