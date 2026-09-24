export type Observation = {
  referenceDate: string;
  value: number;
};

export type VariationPolicy = {
  strategy:
    | 'PREVIOUS_OBSERVATIONS'
    | 'PREVIOUS_CALENDAR_MONTH'
    | 'PREVIOUS_CALENDAR_DAYS';
  periods: number;
};

type Comparison = {
  latest: Observation | null;
  base: Observation | null;
};

function parseReferenceDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error('Reference date must be a valid YYYY-MM-DD date');
  }

  return date;
}

export function selectComparisonObservations(
  observations: readonly Observation[],
  policy: VariationPolicy,
): Comparison {
  if (!Number.isSafeInteger(policy.periods) || policy.periods < 1) {
    throw new Error('Variation periods must be a positive integer');
  }

  const seenDates = new Set<string>();

  for (const observation of observations) {
    parseReferenceDate(observation.referenceDate);

    if (!Number.isFinite(observation.value)) {
      throw new Error('Indicator values must be finite numbers');
    }

    if (seenDates.has(observation.referenceDate)) {
      throw new Error('Duplicate reference date');
    }

    seenDates.add(observation.referenceDate);
  }

  const sorted = [...observations].sort((a, b) =>
    b.referenceDate.localeCompare(a.referenceDate),
  );

  const latest = sorted[0];

  if (!latest) {
    return { latest: null, base: null };
  }

  switch (policy.strategy) {
    case 'PREVIOUS_OBSERVATIONS':
      return {
        latest,
        base: sorted[policy.periods] ?? null,
      };

    case 'PREVIOUS_CALENDAR_MONTH': {
      const target = parseReferenceDate(latest.referenceDate);

      // Primeiro dia evita transbordar ao voltar de um mês com 31 dias.
      target.setUTCDate(1);
      target.setUTCMonth(target.getUTCMonth() - policy.periods);

      const targetMonth = target.toISOString().slice(0, 7);

      return {
        latest,
        base:
          sorted.find((observation) =>
            observation.referenceDate.startsWith(`${targetMonth}-`),
          ) ?? null,
      };
    }

    case 'PREVIOUS_CALENDAR_DAYS': {
      const target = parseReferenceDate(latest.referenceDate);
      target.setUTCDate(target.getUTCDate() - policy.periods);

      const targetDate = target.toISOString().slice(0, 10);

      return {
        latest,
        base:
          sorted.find(
            (observation) => observation.referenceDate <= targetDate,
          ) ?? null,
      };
    }

    default:
      throw new Error('Unsupported variation strategy');
  }
}