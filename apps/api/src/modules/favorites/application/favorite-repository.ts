export type SaveFavoriteResult = 'saved' | 'indicator-not-found';

export interface FavoriteRepository {
  listIndicatorSlugs(visitorId: string): Promise<string[]>;

  save(
    visitorId: string,
    indicatorSlug: string,
  ): Promise<SaveFavoriteResult>;

  remove(visitorId: string, indicatorSlug: string): Promise<void>;
}