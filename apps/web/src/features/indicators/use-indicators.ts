import { useCallback, useEffect, useState } from 'react';

import { fetchIndicators } from './indicator-api';
import type { IndicatorSummary } from './indicator-types';

type IndicatorsState = {
  indicators: IndicatorSummary[];
  loading: boolean;
  error: string | null;
};

const initialState: IndicatorsState = {
  indicators: [],
  loading: true,
  error: null,
};

export function useIndicators() {
  const [state, setState] = useState(initialState);
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void fetchIndicators(controller.signal)
      .then((indicators) => {
        setState({
          indicators,
          loading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return;
        }

        setState({
          indicators: [],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os indicadores.',
        });
      });

    return () => {
      controller.abort();
    };
  }, [requestId]);

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