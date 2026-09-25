import { describe, expect, it } from 'vitest';

import { buildApp } from '../../../app.js';
import type { IndicatorRepository } from '../application/indicator-repository.js';

describe('GET /v1/indicators', () => {
  it('returns an empty array when no indicators are registered', async () => {
    const repository: IndicatorRepository = {
      async listSnapshots() {
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
        url: '/v1/indicators',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it('returns the HTTP contract for an indicator without observations', async () => {
    const repository: IndicatorRepository = {
      async listSnapshots() {
        return [
          {
            slug: 'usd-brl-ptax',
            name: 'USD/BRL PTAX venda',
            source: 'BCB',
            frequency: 'DAILY',
            unit: 'BRL/USD',
            variationPolicy: {
              strategy: 'PREVIOUS_OBSERVATIONS',
              periods: 5,
            },
            ttlMinutes: 360,
            lastSyncedAt: null,
            observations: [],
          },
        ];
      },
    };

    const app = buildApp(
      { logger: false },
      { indicatorRepository: repository },
    );

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/indicators',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([
        {
          slug: 'usd-brl-ptax',
          name: 'USD/BRL PTAX venda',
          source: 'BCB',
          frequency: 'DAILY',
          unit: 'BRL/USD',
          latestValue: null,
          referenceDate: null,
          changePercent: null,
          variationLabel: '5 observações',
          lastSyncedAt: null,
          stale: true,
        },
      ]);
    } finally {
      await app.close();
    }
  });

  it('returns 503 without exposing internal error details', async () => {
    const repository: IndicatorRepository = {
      async listSnapshots() {
        throw new Error('Internal database connection failure');
      },
    };

    const app = buildApp(
      { logger: false },
      { indicatorRepository: repository },
    );

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/indicators',
      });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({
        message: 'Não foi possível consultar os indicadores.',
      });
      expect(response.body).not.toContain('Internal database');
    } finally {
      await app.close();
    }
  });
});