import type { PrismaClient } from '../../../generated/prisma/client.js';
import type {
  FavoriteRepository,
  SaveFavoriteResult,
} from '../application/favorite-repository.js';

export class PrismaFavoriteRepository implements FavoriteRepository {
  constructor(private readonly database: PrismaClient) {}

  async listIndicatorSlugs(visitorId: string): Promise<string[]> {
    const favorites = await this.database.favorite.findMany({
      where: { visitorId },
      select: {
        indicatorSlug: true,
      },
      orderBy: {
        indicatorSlug: 'asc',
      },
    });

    return favorites.map((favorite) => favorite.indicatorSlug);
  }

  async save(
    visitorId: string,
    indicatorSlug: string,
  ): Promise<SaveFavoriteResult> {
    return this.database.$transaction(async (transaction) => {
      const indicator = await transaction.indicator.findUnique({
        where: { slug: indicatorSlug },
        select: { slug: true },
      });

      if (!indicator) {
        return 'indicator-not-found';
      }

      await transaction.favorite.upsert({
        where: {
          visitorId_indicatorSlug: {
            visitorId,
            indicatorSlug,
          },
        },
        create: {
          visitorId,
          indicatorSlug,
        },
        update: {},
      });

      return 'saved';
    });
  }

  async remove(
    visitorId: string,
    indicatorSlug: string,
  ): Promise<void> {
    await this.database.favorite.deleteMany({
      where: {
        visitorId,
        indicatorSlug,
      },
    });
  }
}