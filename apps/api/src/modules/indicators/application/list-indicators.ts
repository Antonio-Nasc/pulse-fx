import { calculateChangePercent } from '../domain/calculate-change-percent.js';
import {
  selectComparisonObservations,
  type VariationPolicy,
} from '../domain/select-comparison-observations.js';
import type {
  IndicatorRepository,
  IndicatorSnapshot,
} from './indicator-repository.js';

export type IndicatorSummary = {
  slug: string;
  name: string;
  source: 'BCB' | 'FRED';
  frequency: 'DAILY' | 'MONTHLY';
  unit: string;
  latestValue: number | null;
  referenceDate: string | null;
  changePercent: number | null;
  variationLabel: string;
  lastSyncedAt: string | null;
  stale: boolean;
};

function getVariationLabel(policy: VariationPolicy): string {
  const periods = policy.periods;

  switch (policy.strategy) {
    case 'PREVIOUS_OBSERVATIONS':
      return `${periods} ${periods === 1 ? 'observação' : 'observações'}`;

    case 'PREVIOUS_CALENDAR_MONTH':
      return `${periods} ${periods === 1 ? 'mês' : 'meses'}`;

    case 'PREVIOUS_CALENDAR_DAYS':
      return `${periods} ${periods === 1 ? 'dia' : 'dias'}`;

    default:
      throw new Error('Unsupported variation strategy');
  }
}

export function summarizeIndicator(
  indicator: IndicatorSnapshot,
  now: Date = new Date(),
): IndicatorSummary {
  const { latest, base } = selectComparisonObservations(
    indicator.observations,
    indicator.variationPolicy,
  );

  const ttlMilliseconds = indicator.ttlMinutes * 60_000;

  const stale =
    latest === null ||
    indicator.lastSyncedAt === null ||
    now.getTime() - indicator.lastSyncedAt.getTime() >= ttlMilliseconds;

  return {
    slug: indicator.slug,
    name: indicator.name,
    source: indicator.source,
    frequency: indicator.frequency,
    unit: indicator.unit,
    latestValue: latest?.value ?? null,
    referenceDate: latest?.referenceDate ?? null,
    changePercent: calculateChangePercent(
      latest?.value ?? null,
      base?.value ?? null,
    ),
    variationLabel: getVariationLabel(indicator.variationPolicy),
    lastSyncedAt: indicator.lastSyncedAt?.toISOString() ?? null,
    stale,
  };
}

export async function listIndicators(
  repository: IndicatorRepository,
  now: Date = new Date(),
): Promise<IndicatorSummary[]> {
  const indicators = await repository.listSnapshots();

  return indicators.map((indicator) =>
    summarizeIndicator(indicator, now),
  );
}
