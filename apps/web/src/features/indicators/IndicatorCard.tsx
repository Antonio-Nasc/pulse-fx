import {
  formatChangePercent,
  formatIndicatorValue,
  formatReferenceDate,
  getChangeTone,
} from './indicator-formatters';
import type { IndicatorSummary } from './indicator-types';

type IndicatorCardProps = {
  indicator: IndicatorSummary;
  favorite: boolean;
  favoriteDisabled: boolean;
  onToggleFavorite: () => void;
  onOpenDetails: () => void;
};

const sourceLabels = {
  BCB: 'Banco Central',
  FRED: 'Federal Reserve',
} as const;

export function IndicatorCard({
  indicator,
  favorite,
  favoriteDisabled,
  onToggleFavorite,
  onOpenDetails,
}: IndicatorCardProps) {
  const changeTone = getChangeTone(indicator.changePercent);

  return (
    <article className="indicator-card">
      <header className="indicator-card__header">
        <span className="indicator-card__source">
          {sourceLabels[indicator.source]}
        </span>

        <div className="indicator-card__actions">
          <span
            className={
              indicator.stale
                ? 'indicator-card__status indicator-card__status--stale'
                : 'indicator-card__status'
            }
          >
            {indicator.stale ? 'Atualização pendente' : 'Atualizado'}
          </span>

          <button
            className={
              favorite
                ? 'favorite-button favorite-button--active'
                : 'favorite-button'
            }
            type="button"
            aria-label={
              favorite
                ? `Remover ${indicator.name} dos favoritos`
                : `Adicionar ${indicator.name} aos favoritos`
            }
            aria-pressed={favorite}
            disabled={favoriteDisabled}
            onClick={onToggleFavorite}
          >
            <span aria-hidden="true">
              {favorite ? '★' : '☆'}
            </span>
          </button>
        </div>
      </header>

      <div className="indicator-card__content">
        <h2>{indicator.name}</h2>

        <div className="indicator-card__value">
          <strong>
            {formatIndicatorValue(indicator.latestValue)}
          </strong>
          <span>{indicator.unit}</span>
        </div>

        <div
          className={`indicator-card__change indicator-card__change--${changeTone}`}
        >
          <strong>
            {formatChangePercent(indicator.changePercent)}
          </strong>
          <span>em {indicator.variationLabel}</span>
        </div>
      </div>

      <footer className="indicator-card__footer">
        <div className="indicator-card__reference">
          <span>Referência</span>
          <strong>
            {formatReferenceDate(indicator.referenceDate)}
          </strong>
        </div>

        <button
          className="indicator-card__details"
          type="button"
          onClick={onOpenDetails}
        >
          Ver histórico →
        </button>
      </footer>
    </article>
  );
}
