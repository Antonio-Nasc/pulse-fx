export type ProviderObservation = {
  referenceDate: string;
  value: string;
};

export type ObservationPeriod = {
  from: string;
  to: string;
};

export interface IndicatorProvider {
  fetchObservations(
    period: ObservationPeriod,
  ): Promise<ProviderObservation[]>;
}