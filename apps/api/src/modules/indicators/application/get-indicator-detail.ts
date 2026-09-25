import type { Observation } from '../domain/select-comparison-observations.js';
import type {
  IndicatorRepository,
  IndicatorSnapshot,
} from './indicator-repository.js';
import {
  summarizeIndicator,
  type IndicatorSummary,
} from './list-indicators.js';

export type IndicatorDetail = IndicatorSummary & {
  description: string;
  limitationText: string;
  sourceUrl: string;
  historyMonths: number;
  observations: Observation[];
};

function selectHistory(indicator: IndicatorSnapshot): Observation[] {
  if (
    !Number.isInteger(indicator.historyMonths) ||
    indicator.historyMonths < 1
  ) {
    throw new Error('Indicator historyMonths must be positive');
  }

  const observations = [...indicator.observations].sort((a, b) =>
    a.referenceDate.localeCompare(b.referenceDate),
  );

  if (indicator.frequency === 'MONTHLY') {
    return observations.slice(-indicator.historyMonths);
  }

  const latest = observations.at(-1);

  if (!latest) {
    return [];
  }

  const from = new Date(`${latest.referenceDate}T00:00:00.000Z`);

  from.setUTCMonth(from.getUTCMonth() - indicator.historyMonths);

  const fromDate = from.toISOString().slice(0, 10);

  return observations.filter(
    (observation) => observation.referenceDate >= fromDate,
  );
}

export async function getIndicatorDetail(
  repository: IndicatorRepository,
  slug: string,
  now: Date = new Date(),
): Promise<IndicatorDetail | null> {
  const indicators = await repository.listSnapshots();
  const indicator = indicators.find(
    (candidate) => candidate.slug === slug,
  );

  if (!indicator) {
    return null;
  }

  return {
    ...summarizeIndicator(indicator, now),
    description: indicator.description,
    limitationText: indicator.limitationText,
    sourceUrl: indicator.sourceUrl,
    historyMonths: indicator.historyMonths,
    observations: selectHistory(indicator),
  };
}
