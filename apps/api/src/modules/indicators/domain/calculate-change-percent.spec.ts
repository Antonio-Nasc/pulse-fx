import { describe, expect, it } from 'vitest';

import { calculateChangePercent } from './calculate-change-percent.js';

describe('calculateChangePercent', () => {
  it('calculates an increase relative to the base value', () => {
    expect(calculateChangePercent(5.5, 5)).toBeCloseTo(10);
  });

  it('calculates a decrease relative to the base value', () => {
    expect(calculateChangePercent(4.5, 5)).toBeCloseTo(-10);
  });

  it('returns zero when the value has not changed', () => {
    expect(calculateChangePercent(5, 5)).toBe(0);
  });

  it('accepts zero as the current value', () => {
    expect(calculateChangePercent(0, 5)).toBe(-100);
  });

  it('uses the absolute base value as the denominator', () => {
    expect(calculateChangePercent(-8, -10)).toBeCloseTo(20);
  });

  it('returns null when the base value is zero', () => {
    expect(calculateChangePercent(5, 0)).toBeNull();
    expect(calculateChangePercent(0, 0)).toBeNull();
  });

  it('returns null when an observation is missing', () => {
    expect(calculateChangePercent(null, 5)).toBeNull();
    expect(calculateChangePercent(5, null)).toBeNull();
    expect(calculateChangePercent(null, null)).toBeNull();
  });

  it('preserves precision instead of rounding the result', () => {
    expect(calculateChangePercent(4, 3)).toBeCloseTo(
      33.33333333333333,
      10,
    );
  });

  it.each([NaN, Infinity, -Infinity])(
    'rejects non-finite values: %s',
    (value) => {
      expect(() => calculateChangePercent(value, 5)).toThrow(
        'Indicator values must be finite numbers',
      );

      expect(() => calculateChangePercent(5, value)).toThrow(
        'Indicator values must be finite numbers',
      );
    },
  );
});