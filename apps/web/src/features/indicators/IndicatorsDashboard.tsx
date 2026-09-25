import { useState } from "react";

import { useFavorites } from "../favorites/use-favorites";
import { IndicatorCard } from "./IndicatorCard";
import { useIndicators } from "./use-indicators";

type DashboardView = "all" | "favorites";
type IndicatorsDashboardProps = {
  onSelectIndicator: (slug: string) => void;
};

export function IndicatorsDashboard({
  onSelectIndicator,
}: IndicatorsDashboardProps) {
  const {
    indicators,
    loading: indicatorsLoading,
    error: indicatorsError,
    reload,
  } = useIndicators();

  const {
    favoriteSlugs,
    loading: favoritesLoading,
    error: favoritesError,
    isFavorite,
    isPending,
    toggleFavorite,
  } = useFavorites();

  const [view, setView] = useState<DashboardView>("all");

  const visibleIndicators =
    view === "favorites"
      ? indicators.filter((indicator) => isFavorite(indicator.slug))
      : indicators;

  return (
    <main>
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-hero__eyebrow">
            Câmbio e macroeconomia
          </span>
          <h1>O pulso dos mercados em um só lugar.</h1>
          <p>
            Acompanhe referências do Brasil e dos Estados Unidos com dados
            persistidos de fontes oficiais.
          </p>
        </div>

        <div className="dashboard-hero__summary">
          <strong>{indicators.length}</strong>
          <span>indicadores acompanhados</span>
        </div>
      </section>

      <section className="dashboard-content" aria-labelledby="indicators-title">
        <div className="dashboard-content__header">
          <div>
            <span className="section-label">Visão geral</span>
            <h2 id="indicators-title">Indicadores</h2>
          </div>

          <div className="dashboard-actions">
            <div className="dashboard-filter" aria-label="Filtrar indicadores">
              <button
                className={
                  view === "all"
                    ? "dashboard-filter__button dashboard-filter__button--active"
                    : "dashboard-filter__button"
                }
                type="button"
                aria-pressed={view === "all"}
                onClick={() => setView("all")}
              >
                Todos
              </button>

              <button
                className={
                  view === "favorites"
                    ? "dashboard-filter__button dashboard-filter__button--active"
                    : "dashboard-filter__button"
                }
                type="button"
                aria-pressed={view === "favorites"}
                disabled={favoritesLoading}
                onClick={() => setView("favorites")}
              >
                Meus indicadores
                {!favoritesLoading && <span>{favoriteSlugs.length}</span>}
              </button>
            </div>

            {!indicatorsLoading && (
              <button
                className="secondary-button"
                type="button"
                onClick={reload}
              >
                Atualizar painel
              </button>
            )}
          </div>
        </div>

        {favoritesError && (
          <div className="favorites-error" role="alert">
            {favoritesError}
          </div>
        )}

        {indicatorsLoading && (
          <div className="indicator-grid" aria-label="Carregando indicadores">
            {[0, 1, 2].map((item) => (
              <div
                className="indicator-card indicator-card--loading"
                key={item}
              />
            ))}
          </div>
        )}

        {!indicatorsLoading && indicatorsError && (
          <div className="dashboard-message" role="alert">
            <strong>Não conseguimos carregar o painel.</strong>
            <p>{indicatorsError}</p>
            <button type="button" onClick={reload}>
              Tentar novamente
            </button>
          </div>
        )}

        {!indicatorsLoading && !indicatorsError && indicators.length === 0 && (
          <div className="dashboard-message">
            <strong>Nenhum indicador disponível.</strong>
            <p>Execute a sincronização da API e tente novamente.</p>
          </div>
        )}

        {!indicatorsLoading &&
          !indicatorsError &&
          indicators.length > 0 &&
          visibleIndicators.length === 0 && (
            <div className="dashboard-message">
              <strong>Você ainda não possui favoritos.</strong>
              <p>
                Volte para “Todos” e marque os indicadores que deseja
                acompanhar.
              </p>
            </div>
          )}

        {!indicatorsLoading &&
          !indicatorsError &&
          visibleIndicators.length > 0 && (
            <div className="indicator-grid">
              {visibleIndicators.map((indicator) => (
                <IndicatorCard
                  indicator={indicator}
                  favorite={isFavorite(indicator.slug)}
                  favoriteDisabled={
                    favoritesLoading || isPending(indicator.slug)
                  }
                  onToggleFavorite={() => {
                    void toggleFavorite(indicator.slug);
                  }}
                  onOpenDetails={() => {
                    onSelectIndicator(indicator.slug);
                  }}
                  key={indicator.slug}
                />
              ))}
            </div>
          )}
      </section>
    </main>
  );
}
