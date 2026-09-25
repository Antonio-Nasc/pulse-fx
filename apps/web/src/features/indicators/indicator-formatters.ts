export function formatIndicatorValue(
  value: number | null,
): string {
  if (value === null) {
    return 'Sem dado';
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

export function formatChangePercent(
  value: number | null,
): string {
  if (value === null) {
    return 'Sem comparação';
  }

  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'always',
  }).format(value);

  return `${formatted}%`;
}

export function formatReferenceDate(
  value: string | null,
): string {
  if (!value) {
    return 'Data indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

export function getChangeTone(
  value: number | null,
): 'positive' | 'negative' | 'neutral' {
  if (value === null || value === 0) {
    return 'neutral';
  }

  return value > 0 ? 'positive' : 'negative';
}