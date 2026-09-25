import type { FastifyPluginAsync } from 'fastify';

import type { FavoriteRepository } from '../application/favorite-repository.js';
import {
  listFavorites,
  removeFavorite,
  saveFavorite,
} from '../application/manage-favorites.js';

type FavoriteRoutesOptions = {
  repository: FavoriteRepository;
};

type VisitorHeaders = {
  'x-visitor-id': string;
};

type FavoriteParams = {
  slug: string;
};

const visitorHeadersSchema = {
  type: 'object',
  required: ['x-visitor-id'],
  properties: {
    'x-visitor-id': {
      type: 'string',
      format: 'uuid',
    },
  },
};

const favoriteParamsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['slug'],
  properties: {
    slug: {
      type: 'string',
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    },
  },
};

const errorResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['message'],
  properties: {
    message: { type: 'string' },
  },
};

export const favoriteRoutes: FastifyPluginAsync<
  FavoriteRoutesOptions
> = async (app, options) => {
  app.get<{ Headers: VisitorHeaders }>(
    '/v1/favorites',
    {
      schema: {
        headers: visitorHeadersSchema,
        response: {
          200: {
            type: 'object',
            additionalProperties: false,
            required: ['favorites'],
            properties: {
              favorites: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        return await listFavorites(
          options.repository,
          request.headers['x-visitor-id'],
        );
      } catch (error) {
        request.log.error(
          { err: error },
          'Failed to list visitor favorites',
        );

        return reply.code(503).send({
          message: 'Não foi possível consultar os favoritos.',
        });
      }
    },
  );

  app.put<{
    Headers: VisitorHeaders;
    Params: FavoriteParams;
  }>(
    '/v1/favorites/:slug',
    {
      schema: {
        headers: visitorHeadersSchema,
        params: favoriteParamsSchema,
        response: {
          404: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await saveFavorite(
          options.repository,
          request.headers['x-visitor-id'],
          request.params.slug,
        );

        if (result === 'indicator-not-found') {
          return reply.code(404).send({
            message: 'Indicador não encontrado.',
          });
        }

        return reply.code(204).send();
      } catch (error) {
        request.log.error(
          { err: error, slug: request.params.slug },
          'Failed to save visitor favorite',
        );

        return reply.code(503).send({
          message: 'Não foi possível salvar o favorito.',
        });
      }
    },
  );

  app.delete<{
    Headers: VisitorHeaders;
    Params: FavoriteParams;
  }>(
    '/v1/favorites/:slug',
    {
      schema: {
        headers: visitorHeadersSchema,
        params: favoriteParamsSchema,
        response: {
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        await removeFavorite(
          options.repository,
          request.headers['x-visitor-id'],
          request.params.slug,
        );

        return reply.code(204).send();
      } catch (error) {
        request.log.error(
          { err: error, slug: request.params.slug },
          'Failed to remove visitor favorite',
        );

        return reply.code(503).send({
          message: 'Não foi possível remover o favorito.',
        });
      }
    },
  );
};