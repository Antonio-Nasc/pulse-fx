export function calculateChangePercent(
  currentValue: number | null,
  baseValue: number | null,
): number | null {
  if (currentValue === null || baseValue === null) {
    return null;
  }

  if (!Number.isFinite(currentValue) || !Number.isFinite(baseValue)) {
    throw new Error('Indicator values must be finite numbers');
  }

  if (baseValue === 0) {
    return null;
  }

  return ((currentValue - baseValue) / Math.abs(baseValue)) * 100;
}