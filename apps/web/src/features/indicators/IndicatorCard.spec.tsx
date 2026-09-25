// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { IndicatorCard } from './IndicatorCard';
import type { IndicatorSummary } from './indicator-types';

const indicator: IndicatorSummary = {
  slug: 'usd-brl-ptax',
  name: 'USD/BRL PTAX venda',
  source: 'BCB',
  frequency: 'DAILY',
  unit: 'BRL/USD',
  latestValue: 5.1795,
  referenceDate: '2026-09-24',
  changePercent: 0.5318,
  variationLabel: '5 observações',
  lastSyncedAt: '2026-09-25T11:24:36.189Z',
  stale: false,
};

afterEach(() => {
  cleanup();
});

describe('IndicatorCard', () => {
  it('renders the indicator summary', () => {
    render(
      <IndicatorCard
        indicator={indicator}
        favorite={false}
        favoriteDisabled={false}
        onToggleFavorite={() => {}}
        onOpenDetails={() => {}}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'USD/BRL PTAX venda',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('5,1795')).toBeInTheDocument();
    expect(screen.getByText('+0,53%')).toBeInTheDocument();
    expect(screen.getByText('Atualizado')).toBeInTheDocument();
  });

  it('requests favorite and detail actions', () => {
    const onToggleFavorite = vi.fn();
    const onOpenDetails = vi.fn();

    render(
      <IndicatorCard
        indicator={indicator}
        favorite={false}
        favoriteDisabled={false}
        onToggleFavorite={onToggleFavorite}
        onOpenDetails={onOpenDetails}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /adicionar .* aos favoritos/i,
      }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Ver histórico →',
      }),
    );

    expect(onToggleFavorite).toHaveBeenCalledOnce();
    expect(onOpenDetails).toHaveBeenCalledOnce();
  });

  it('exposes the active and disabled favorite state', () => {
    render(
      <IndicatorCard
        indicator={indicator}
        favorite
        favoriteDisabled
        onToggleFavorite={() => {}}
        onOpenDetails={() => {}}
      />,
    );

    const favoriteButton = screen.getByRole('button', {
      name: /remover .* dos favoritos/i,
    });

    expect(favoriteButton).toBeDisabled();
    expect(favoriteButton).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});