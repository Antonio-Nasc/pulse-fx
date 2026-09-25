import type {
  Observation,
  VariationPolicy,
} from "../domain/select-comparison-observations.js";

export type IndicatorSnapshot = {
  slug: string;
  name: string;
  source: "BCB" | "FRED";
  frequency: "DAILY" | "MONTHLY";
  unit: string;
  description: string;
  limitationText: string;
  sourceUrl: string;
  historyMonths: number;
  variationPolicy: VariationPolicy;
  ttlMinutes: number;
  lastSyncedAt: Date | null;
  observations: readonly Observation[];
};

export interface IndicatorRepository {
  listSnapshots(): Promise<IndicatorSnapshot[]>;
}
