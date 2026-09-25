import { useCallback, useEffect, useState } from 'react';

import { fetchIndicatorDetail } from './indicator-api';
import type { IndicatorDetail } from './indicator-types';

type IndicatorDetailState = {
  detail: IndicatorDetail | null;
  loading: boolean;
  error: string | null;
};

const initialState: IndicatorDetailState = {
  detail: null,
  loading: true,
  error: null,
};

export function useIndicatorDetail(slug: string) {
  const [state, setState] = useState(initialState);
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void fetchIndicatorDetail(slug, controller.signal)
      .then((detail) => {
        setState({
          detail,
          loading: false,
          error: null,
        });
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === 'AbortError'
        ) {
          return;
        }

        setState({
          detail: null,
          loading: false,
          error:
            requestError instanceof Error
              ? requestError.message
              : 'Não foi possível carregar o indicador.',
        });
      });

    return () => {
      controller.abort();
    };
  }, [requestId, slug]);

  const reload = useCallback(() => {
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));
    setRequestId((current) => current + 1);
  }, []);

  return {
    ...state,
    reload,
  };
}