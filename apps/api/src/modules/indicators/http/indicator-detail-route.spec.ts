import { describe, expect, it } from 'vitest';

import { buildApp } from '../../../app.js';
import type {
  IndicatorRepository,
  IndicatorSnapshot,
} from '../application/indicator-repository.js';

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
    lastSyncedAt: new Date(),
    observations: [
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

describe('GET /v1/indicators/:slug', () => {
  it('returns the indicator detail and history', async () => {
    const indicator = createIndicator();
    const app = buildApp(
      { logger: false },
      {
        indicatorRepository: repositoryFor(indicator),
      },
    );

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/indicators/usd-brl-ptax',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        slug: 'usd-brl-ptax',
        name: 'USD/BRL PTAX venda',
        source: 'BCB',
        frequency: 'DAILY',
        unit: 'BRL/USD',
        latestValue: 5.5,
        referenceDate: '2026-09-23',
        changePercent: 10,
        variationLabel: '1 observação',
        lastSyncedAt: indicator.lastSyncedAt?.toISOString(),
        stale: false,
        description: 'Referência do dólar em reais.',
        limitationText: 'Não é uma cotação em tempo real.',
        sourceUrl: 'https://example.com/ptax',
        historyMonths: 3,
        observations: [
          { referenceDate: '2026-09-22', value: 5 },
          { referenceDate: '2026-09-23', value: 5.5 },
        ],
      });
    } finally {
      await app.close();
    }
  });

  it('returns 404 for an unknown indicator', async () => {
    const app = buildApp(
      { logger: false },
      {
        indicatorRepository: repositoryFor(),
      },
    );

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/indicators/unknown',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        message: 'Indicador não encontrado.',
      });
    } finally {
      await app.close();
    }
  });

  it('returns 503 without exposing repository errors', async () => {
    const repository: IndicatorRepository = {
      async listSnapshots() {
        throw new Error('Sensitive database failure');
      },
    };

    const app = buildApp(
      { logger: false },
      { indicatorRepository: repository },
    );

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/indicators/usd-brl-ptax',
      });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({
        message: 'Não foi possível consultar o indicador.',
      });
      expect(response.body).not.toContain(
        'Sensitive database failure',
      );
    } finally {
      await app.close();
    }
  });

  it('rejects an invalid slug before accessing the repository', async () => {
    let repositoryCalled = false;

    const repository: IndicatorRepository = {
      async listSnapshots() {
        repositoryCalled = true;
        return [];
      },
    };

    const app = buildApp(
      { logger: false },
      { indicatorRepository: repository },
    );

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/indicators/INVALID_SLUG',
      });

      expect(response.statusCode).toBe(400);
      expect(repositoryCalled).toBe(false);
    } finally {
      await app.close();
    }
  });
});
