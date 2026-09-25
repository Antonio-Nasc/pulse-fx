import { apiRequest } from '../../lib/api-client';

type FavoriteListResponse = {
  favorites: string[];
};

function createVisitorHeaders(visitorId: string): HeadersInit {
  return {
    'x-visitor-id': visitorId,
  };
}

export async function fetchFavorites(
  visitorId: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const response = await apiRequest<FavoriteListResponse>(
    '/v1/favorites',
    {
      headers: createVisitorHeaders(visitorId),
      signal,
    },
  );

  return response.favorites;
}

export function saveFavorite(
  visitorId: string,
  indicatorSlug: string,
): Promise<void> {
  return apiRequest<void>(
    `/v1/favorites/${encodeURIComponent(indicatorSlug)}`,
    {
      method: 'PUT',
      headers: createVisitorHeaders(visitorId),
    },
  );
}

export function removeFavorite(
  visitorId: string,
  indicatorSlug: string,
): Promise<void> {
  return apiRequest<void>(
    `/v1/favorites/${encodeURIComponent(indicatorSlug)}`,
    {
      method: 'DELETE',
      headers: createVisitorHeaders(visitorId),
    },
  );
}