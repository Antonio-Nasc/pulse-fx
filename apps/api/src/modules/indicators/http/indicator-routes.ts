import type { FastifyPluginAsync } from 'fastify';

import type { IndicatorRepository } from '../application/indicator-repository.js';
import { listIndicators } from '../application/list-indicators.js';

type IndicatorRoutesOptions = {
  repository: IndicatorRepository;
};

const summaryProperties = {
  slug: { type: 'string' },
  name: { type: 'string' },
  source: { type: 'string', enum: ['BCB', 'FRED'] },
  frequency: { type: 'string', enum: ['DAILY', 'MONTHLY'] },
  unit: { type: 'string' },
  latestValue: { type: ['number', 'null'] },
  referenceDate: { type: ['string', 'null'], format: 'date' },
  changePercent: { type: ['number', 'null'] },
  variationLabel: { type: 'string' },
  lastSyncedAt: { type: ['string', 'null'], format: 'date-time' },
  stale: { type: 'boolean' },
};

export const indicatorRoutes: FastifyPluginAsync<
  IndicatorRoutesOptions
> = async (app, options) => {
  app.get(
    '/v1/indicators',
    {
      schema: {
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: Object.keys(summaryProperties),
              properties: summaryProperties,
            },
          },
          503: {
            type: 'object',
            additionalProperties: false,
            required: ['message'],
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        return await listIndicators(options.repository);
      } catch (error) {
        request.log.error({ err: error }, 'Failed to list indicators');

        return reply.code(503).send({
          message: 'Não foi possível consultar os indicadores.',
        });
      }
    },
  );
};