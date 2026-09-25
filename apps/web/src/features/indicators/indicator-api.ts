import { apiRequest } from '../../lib/api-client';
import type {
  IndicatorDetail,
  IndicatorSummary,
} from './indicator-types';

export function fetchIndicators(
  signal?: AbortSignal,
): Promise<IndicatorSummary[]> {
  return apiRequest<IndicatorSummary[]>('/v1/indicators', {
    signal,
  });
}

export function fetchIndicatorDetail(
  slug: string,
  signal?: AbortSignal,
): Promise<IndicatorDetail> {
  return apiRequest<IndicatorDetail>(
    `/v1/indicators/${encodeURIComponent(slug)}`,
    { signal },
  );
}