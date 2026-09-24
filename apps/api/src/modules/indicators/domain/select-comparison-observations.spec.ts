import { describe, expect, it } from 'vitest';

import { calculateChangePercent } from './calculate-change-percent.js';
import {
  selectComparisonObservations,
  type Observation,
} from './select-comparison-observations.js';

function observation(referenceDate: string, value = 5): Observation {
  return { referenceDate, value };
}

describe('selectComparisonObservations', () => {
  it('selects five observations back despite calendar gaps', () => {
    const observations = [
      observation('2026-09-14', 5),
      observation('2026-09-15'),
      observation('2026-09-16'),
      observation('2026-09-18'),
      observation('2026-09-21'),
      observation('2026-09-23', 5.5),
    ];
    const original = observations.map((item) => ({ ...item }));

    const result = selectComparisonObservations(observations, {
      strategy: 'PREVIOUS_OBSERVATIONS',
      periods: 5,
    });

    expect(result.latest?.referenceDate).toBe('2026-09-23');
    expect(result.base?.referenceDate).toBe('2026-09-14');
    expect(observations).toEqual(original);

    expect(
      calculateChangePercent(
        result.latest?.value ?? null,
        result.base?.value ?? null,
      ),
    ).toBeCloseTo(10);
  });

  it('returns no base when there are too few observations', () => {
    const result = selectComparisonObservations(
      [observation('2026-09-23')],
      { strategy: 'PREVIOUS_OBSERVATIONS', periods: 5 },
    );

    expect(result.latest?.referenceDate).toBe('2026-09-23');
    expect(result.base).toBeNull();
  });

  it('selects the previous calendar month across a year boundary', () => {
    const result = selectComparisonObservations(
      [
        observation('2026-01-01'),
        observation('2025-11-01'),
        observation('2025-12-01'),
      ],
      { strategy: 'PREVIOUS_CALENDAR_MONTH', periods: 1 },
    );

    expect(result.latest?.referenceDate).toBe('2026-01-01');
    expect(result.base?.referenceDate).toBe('2025-12-01');
  });

  it('handles month-end dates without overflowing February', () => {
    const result = selectComparisonObservations(
      [
        observation('2026-03-31'),
        observation('2026-02-28'),
      ],
      { strategy: 'PREVIOUS_CALENDAR_MONTH', periods: 1 },
    );

    expect(result.base?.referenceDate).toBe('2026-02-28');
  });

  it('does not substitute an older month when the target month is missing', () => {
    const result = selectComparisonObservations(
      [
        observation('2026-09-01'),
        observation('2026-07-01'),
      ],
      { strategy: 'PREVIOUS_CALENDAR_MONTH', periods: 1 },
    );

    expect(result.base).toBeNull();
  });

  it('selects the latest available date on or before the 30-day target', () => {
    // 30 dias antes de 23/09 é 24/08; não há observação nessa data.
    const result = selectComparisonObservations(
      [
        observation('2026-08-20'),
        observation('2026-08-21'),
        observation('2026-08-25'),
        observation('2026-09-23'),
      ],
      { strategy: 'PREVIOUS_CALENDAR_DAYS', periods: 30 },
    );

    expect(result.base?.referenceDate).toBe('2026-08-21');
  });

  it('accepts an observation exactly on the calendar-day target', () => {
    const result = selectComparisonObservations(
      [
        observation('2026-09-23'),
        observation('2026-08-24'),
      ],
      { strategy: 'PREVIOUS_CALENDAR_DAYS', periods: 30 },
    );

    expect(result.base?.referenceDate).toBe('2026-08-24');
  });

  it('returns no base when all dates are after the target', () => {
    const result = selectComparisonObservations(
      [
        observation('2026-09-23'),
        observation('2026-09-22'),
      ],
      { strategy: 'PREVIOUS_CALENDAR_DAYS', periods: 30 },
    );

    expect(result.base).toBeNull();
  });

  it('returns null observations for an empty history', () => {
    expect(
      selectComparisonObservations([], {
        strategy: 'PREVIOUS_OBSERVATIONS',
        periods: 5,
      }),
    ).toEqual({ latest: null, base: null });
  });

  it.each([0, -1, 1.5, NaN, Infinity])(
    'rejects an invalid period: %s',
    (periods) => {
      expect(() =>
        selectComparisonObservations([], {
          strategy: 'PREVIOUS_OBSERVATIONS',
          periods,
        }),
      ).toThrow('Variation periods must be a positive integer');
    },
  );

  it.each(['2026-02-30', '23/09/2026', 'invalid'])(
    'rejects an invalid reference date: %s',
    (date) => {
      expect(() =>
        selectComparisonObservations([observation(date)], {
          strategy: 'PREVIOUS_OBSERVATIONS',
          periods: 1,
        }),
      ).toThrow('Reference date must be a valid YYYY-MM-DD date');
    },
  );

  it('rejects duplicate dates', () => {
    expect(() =>
      selectComparisonObservations(
        [
          observation('2026-09-23'),
          observation('2026-09-23'),
        ],
        { strategy: 'PREVIOUS_OBSERVATIONS', periods: 1 },
      ),
    ).toThrow('Duplicate reference date');
  });

  it('rejects non-finite observation values', () => {
    expect(() =>
      selectComparisonObservations(
        [observation('2026-09-23', NaN)],
        { strategy: 'PREVIOUS_OBSERVATIONS', periods: 1 },
      ),
    ).toThrow('Indicator values must be finite numbers');
  });
});