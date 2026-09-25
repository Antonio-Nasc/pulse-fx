import { describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../../app.js';
import type {
  FavoriteRepository,
  SaveFavoriteResult,
} from '../application/favorite-repository.js';

const visitorId = '2ec7556e-7660-4db7-a360-0a31ca743cf1';

function createRepository(
  overrides: Partial<FavoriteRepository> = {},
): FavoriteRepository {
  return {
    async listIndicatorSlugs() {
      return [];
    },
    async save() {
      return 'saved';
    },
    async remove() {},
    ...overrides,
  };
}

describe('favorite routes', () => {
  it('lists the visitor favorites', async () => {
    const repository = createRepository({
      async listIndicatorSlugs() {
        return ['fed-funds', 'usd-brl-ptax'];
      },
    });

    const app = buildApp(
      { logger: false },
      { favoriteRepository: repository },
    );

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/favorites',
        headers: {
          'x-visitor-id': visitorId,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        favorites: ['fed-funds', 'usd-brl-ptax'],
      });
    } finally {
      await app.close();
    }
  });

  it('saves a favorite idempotently', async () => {
    const save = vi.fn(
      async (
        _visitorId: string,
        _indicatorSlug: string,
      ): Promise<SaveFavoriteResult> => 'saved',
    );

    const app = buildApp(
      { logger: false },
      {
        favoriteRepository: createRepository({ save }),
      },
    );

    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/v1/favorites/usd-brl-ptax',
        headers: {
          'x-visitor-id': visitorId,
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(save).toHaveBeenCalledWith(
        visitorId,
        'usd-brl-ptax',
      );
    } finally {
      await app.close();
    }
  });

  it('returns 404 when saving an unknown indicator', async () => {
    const repository = createRepository({
      async save() {
        return 'indicator-not-found';
      },
    });

    const app = buildApp(
      { logger: false },
      { favoriteRepository: repository },
    );

    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/v1/favorites/unknown',
        headers: {
          'x-visitor-id': visitorId,
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        message: 'Indicador não encontrado.',
      });
    } finally {
      await app.close();
    }
  });

  it('removes a favorite idempotently', async () => {
    const remove = vi.fn(
      async (
        _visitorId: string,
        _indicatorSlug: string,
      ): Promise<void> => {},
    );

    const app = buildApp(
      { logger: false },
      {
        favoriteRepository: createRepository({ remove }),
      },
    );

    try {
      const response = await app.inject({
        method: 'DELETE',
        url: '/v1/favorites/usd-brl-ptax',
        headers: {
          'x-visitor-id': visitorId,
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(remove).toHaveBeenCalledWith(
        visitorId,
        'usd-brl-ptax',
      );
    } finally {
      await app.close();
    }
  });

  it('rejects an invalid visitor id before accessing the repository', async () => {
    const listIndicatorSlugs = vi.fn(async () => []);

    const app = buildApp(
      { logger: false },
      {
        favoriteRepository: createRepository({
          listIndicatorSlugs,
        }),
      },
    );

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/favorites',
        headers: {
          'x-visitor-id': 'invalid-uuid',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(listIndicatorSlugs).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('returns 503 without exposing repository errors', async () => {
    const repository = createRepository({
      async listIndicatorSlugs() {
        throw new Error('Sensitive database failure');
      },
    });

    const app = buildApp(
      { logger: false },
      { favoriteRepository: repository },
    );

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/favorites',
        headers: {
          'x-visitor-id': visitorId,
        },
      });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({
        message: 'Não foi possível consultar os favoritos.',
      });
      expect(response.body).not.toContain(
        'Sensitive database failure',
      );
    } finally {
      await app.close();
    }
  });
});