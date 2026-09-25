import { describe, expect, it } from 'vitest';

import {
  formatChangePercent,
  formatIndicatorValue,
  formatReferenceDate,
  getChangeTone,
} from './indicator-formatters';

describe('indicator formatters', () => {
  it('formats indicator values using the Brazilian locale', () => {
    expect(formatIndicatorValue(5)).toBe('5,00');
    expect(formatIndicatorValue(5.1795)).toBe('5,1795');
    expect(formatIndicatorValue(null)).toBe('Sem dado');
  });

  it('formats positive, negative and missing changes', () => {
    expect(formatChangePercent(0.5318)).toBe('+0,53%');
    expect(formatChangePercent(-1.7857)).toBe('-1,79%');
    expect(formatChangePercent(null)).toBe('Sem comparação');
  });

  it('returns the correct semantic change tone', () => {
    expect(getChangeTone(1)).toBe('positive');
    expect(getChangeTone(-1)).toBe('negative');
    expect(getChangeTone(0)).toBe('neutral');
    expect(getChangeTone(null)).toBe('neutral');
  });

  it('handles a missing reference date', () => {
    expect(formatReferenceDate(null)).toBe(
      'Data indisponível',
    );
  });
});