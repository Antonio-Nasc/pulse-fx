import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  fetchFavorites,
  removeFavorite,
  saveFavorite,
} from './favorite-api';
import { getVisitorId } from './visitor-id';

export function useFavorites() {
  const [visitorId] = useState(getVisitorId);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [pendingSlugs, setPendingSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void fetchFavorites(visitorId, controller.signal)
      .then((favorites) => {
        setFavoriteSlugs(favorites);
        setLoading(false);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === 'AbortError'
        ) {
          return;
        }

        setLoading(false);
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar os favoritos.',
        );
      });

    return () => {
      controller.abort();
    };
  }, [visitorId]);

  const favoriteSet = useMemo(
    () => new Set(favoriteSlugs),
    [favoriteSlugs],
  );

  const pendingSet = useMemo(
    () => new Set(pendingSlugs),
    [pendingSlugs],
  );

  const toggleFavorite = useCallback(
    async (indicatorSlug: string): Promise<void> => {
      if (pendingSet.has(indicatorSlug)) {
        return;
      }

      const wasFavorite = favoriteSet.has(indicatorSlug);

      setPendingSlugs((current) => [
        ...current,
        indicatorSlug,
      ]);
      setError(null);

      setFavoriteSlugs((current) =>
        wasFavorite
          ? current.filter((slug) => slug !== indicatorSlug)
          : [...current, indicatorSlug],
      );

      try {
        if (wasFavorite) {
          await removeFavorite(visitorId, indicatorSlug);
        } else {
          await saveFavorite(visitorId, indicatorSlug);
        }
      } catch (requestError) {
        setFavoriteSlugs((current) => {
          if (wasFavorite) {
            return current.includes(indicatorSlug)
              ? current
              : [...current, indicatorSlug];
          }

          return current.filter(
            (slug) => slug !== indicatorSlug,
          );
        });

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Não foi possível atualizar o favorito.',
        );
      } finally {
        setPendingSlugs((current) =>
          current.filter((slug) => slug !== indicatorSlug),
        );
      }
    },
    [favoriteSet, pendingSet, visitorId],
  );

  return {
    favoriteSlugs,
    loading,
    error,
    isFavorite: (slug: string) => favoriteSet.has(slug),
    isPending: (slug: string) => pendingSet.has(slug),
    toggleFavorite,
  };
}