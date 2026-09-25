import type { PrismaClient } from '../../../generated/prisma/client.js';
import type {
  IndicatorRepository,
  IndicatorSnapshot,
} from '../application/indicator-repository.js';

export class PrismaIndicatorRepository implements IndicatorRepository {
  constructor(private readonly database: PrismaClient) {}

  async listSnapshots(): Promise<IndicatorSnapshot[]> {
    const indicators = await this.database.indicator.findMany({
      orderBy: { slug: 'asc' },
      include: {
        observations: {
          orderBy: { referenceDate: 'desc' },
        },
      },
    });

    return indicators.map((indicator) => ({
      slug: indicator.slug,
      name: indicator.name,
      source: indicator.source,
      frequency: indicator.frequency,
      unit: indicator.unit,
      variationPolicy: {
        strategy: indicator.variationStrategy,
        periods: indicator.variationPeriods,
      },
      ttlMinutes: indicator.ttlMinutes,
      lastSyncedAt: indicator.lastSyncedAt,
      observations: indicator.observations.map((observation) => ({
        referenceDate: observation.referenceDate.toISOString().slice(0, 10),
        value: observation.value.toNumber(),
      })),
    }));
  }
}