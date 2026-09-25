import type { FastifyPluginAsync } from "fastify";

import type { IndicatorRepository } from "../application/indicator-repository.js";
import { listIndicators } from "../application/list-indicators.js";
import { getIndicatorDetail } from "../application/get-indicator-detail.js";

type IndicatorRoutesOptions = {
  repository: IndicatorRepository;
};

const summaryProperties = {
  slug: { type: "string" },
  name: { type: "string" },
  source: { type: "string", enum: ["BCB", "FRED"] },
  frequency: { type: "string", enum: ["DAILY", "MONTHLY"] },
  unit: { type: "string" },
  latestValue: { type: ["number", "null"] },
  referenceDate: { type: ["string", "null"], format: "date" },
  changePercent: { type: ["number", "null"] },
  variationLabel: { type: "string" },
  lastSyncedAt: { type: ["string", "null"], format: "date-time" },
  stale: { type: "boolean" },
};

const detailProperties = {
  ...summaryProperties,
  description: { type: "string" },
  limitationText: { type: "string" },
  sourceUrl: { type: "string" },
  historyMonths: { type: "integer", minimum: 1 },
  observations: {
    type: "array",
    items: {
      type: "object",
      additionalProperties: false,
      required: ["referenceDate", "value"],
      properties: {
        referenceDate: {
          type: "string",
          format: "date",
        },
        value: { type: "number" },
      },
    },
  },
};

export const indicatorRoutes: FastifyPluginAsync<
  IndicatorRoutesOptions
> = async (app, options) => {
  app.get(
    "/v1/indicators",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: Object.keys(summaryProperties),
              properties: summaryProperties,
            },
          },
          503: {
            type: "object",
            additionalProperties: false,
            required: ["message"],
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        return await listIndicators(options.repository);
      } catch (error) {
        request.log.error({ err: error }, "Failed to list indicators");

        return reply.code(503).send({
          message: "Não foi possível consultar os indicadores.",
        });
      }
    },
  );

  app.get<{ Params: { slug: string } }>(
    "/v1/indicators/:slug",
    {
      schema: {
        params: {
          type: "object",
          additionalProperties: false,
          required: ["slug"],
          properties: {
            slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
            },
          },
        },
        response: {
          200: {
            type: "object",
            additionalProperties: false,
            required: Object.keys(detailProperties),
            properties: detailProperties,
          },
          404: {
            type: "object",
            additionalProperties: false,
            required: ["message"],
            properties: {
              message: { type: "string" },
            },
          },
          503: {
            type: "object",
            additionalProperties: false,
            required: ["message"],
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const detail = await getIndicatorDetail(
          options.repository,
          request.params.slug,
        );

        if (!detail) {
          return reply.code(404).send({
            message: "Indicador não encontrado.",
          });
        }

        return detail;
      } catch (error) {
        request.log.error(
          { err: error, slug: request.params.slug },
          "Failed to get indicator detail",
        );

        return reply.code(503).send({
          message: "Não foi possível consultar o indicador.",
        });
      }
    },
  );
};
