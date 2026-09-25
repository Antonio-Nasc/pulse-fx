export type IndicatorSource = 'BCB' | 'FRED';
export type IndicatorFrequency = 'DAILY' | 'MONTHLY';

export type IndicatorSummary = {
  slug: string;
  name: string;
  source: IndicatorSource;
  frequency: IndicatorFrequency;
  unit: string;
  latestValue: number | null;
  referenceDate: string | null;
  changePercent: number | null;
  variationLabel: string;
  lastSyncedAt: string | null;
  stale: boolean;
};

export type IndicatorObservation = {
  referenceDate: string;
  value: number;
};

export type IndicatorDetail = IndicatorSummary & {
  description: string;
  limitationText: string;
  sourceUrl: string;
  historyMonths: number;
  observations: IndicatorObservation[];
};