import type {
  FavoriteRepository,
  SaveFavoriteResult,
} from './favorite-repository.js';

export type FavoriteList = {
  favorites: string[];
};

export async function listFavorites(
  repository: FavoriteRepository,
  visitorId: string,
): Promise<FavoriteList> {
  const favorites = await repository.listIndicatorSlugs(visitorId);

  return { favorites };
}

export async function saveFavorite(
  repository: FavoriteRepository,
  visitorId: string,
  indicatorSlug: string,
): Promise<SaveFavoriteResult> {
  return repository.save(visitorId, indicatorSlug);
}

export async function removeFavorite(
  repository: FavoriteRepository,
  visitorId: string,
  indicatorSlug: string,
): Promise<void> {
  await repository.remove(visitorId, indicatorSlug);
}