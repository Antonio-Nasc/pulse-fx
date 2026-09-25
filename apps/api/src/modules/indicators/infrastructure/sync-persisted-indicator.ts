import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { IndicatorProvider } from '../application/indicator-provider.js';

type SyncResult = {
  status: 'synced' | 'fresh' | 'already-running';
  observationsWritten: number;
};

export async function syncPersistedIndicator(
  database: PrismaClient,
  slug: string,
  provider: IndicatorProvider,
): Promise<SyncResult> {
  return database.$transaction(
    async (transaction): Promise<SyncResult> => {
      const locks = await transaction.$queryRaw<{ acquired: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(
          73142,
          hashtext(${slug})
        ) AS acquired
      `;

      if (!locks[0]?.acquired) {
        return {
          status: 'already-running',
          observationsWritten: 0,
        };
      }

      const indicator = await transaction.indicator.findUniqueOrThrow({
        where: { slug },
      });

      const now = new Date();
      const ttlMilliseconds = indicator.ttlMinutes * 60_000;

      if (
        indicator.lastSyncedAt !== null &&
        now.getTime() - indicator.lastSyncedAt.getTime() < ttlMilliseconds
      ) {
        return {
          status: 'fresh',
          observationsWritten: 0,
        };
      }

      if (
        !Number.isInteger(indicator.historyMonths) ||
        indicator.historyMonths < 1
      ) {
        throw new Error('Indicator historyMonths must be positive');
      }

      // Busca desde o início do mês para incluir uma margem de histórico.
      const from = new Date(now);
      from.setUTCDate(1);
      from.setUTCMonth(from.getUTCMonth() - indicator.historyMonths);

      const observations = await provider.fetchObservations({
        from: from.toISOString().slice(0, 10),
        to: now.toISOString().slice(0, 10),
      });

      if (observations.length === 0) {
        throw new Error(`Provider returned no observations for ${slug}`);
      }

      for (const observation of observations) {
        const referenceDate = new Date(
          `${observation.referenceDate}T00:00:00.000Z`,
        );

        await transaction.observation.upsert({
          where: {
            indicatorSlug_referenceDate: {
              indicatorSlug: slug,
              referenceDate,
            },
          },
          create: {
            indicatorSlug: slug,
            referenceDate,
            value: observation.value,
          },
          update: {
            value: observation.value,
          },
        });
      }

      await transaction.indicator.update({
        where: { slug },
        data: {
          lastSyncedAt: new Date(),
        },
      });

      return {
        status: 'synced',
        observationsWritten: observations.length,
      };
    },
    {
      maxWait: 5_000,
      timeout: 30_000,
    },
  );
}