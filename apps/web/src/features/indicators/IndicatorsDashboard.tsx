import { IndicatorCard } from './IndicatorCard';
import { useIndicators } from './use-indicators';

export function IndicatorsDashboard() {
  const { indicators, loading, error, reload } = useIndicators();

  return (
    <main>
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-hero__eyebrow">
            Câmbio e macroeconomia
          </span>
          <h1>O pulso dos mercados em um só lugar.</h1>
          <p>
            Acompanhe referências do Brasil e dos Estados Unidos
            com dados persistidos de fontes oficiais.
          </p>
        </div>

        <div className="dashboard-hero__summary">
          <strong>{indicators.length}</strong>
          <span>indicadores acompanhados</span>
        </div>
      </section>

      <section
        className="dashboard-content"
        aria-labelledby="indicators-title"
      >
        <div className="dashboard-content__header">
          <div>
            <span className="section-label">Visão geral</span>
            <h2 id="indicators-title">Indicadores</h2>
          </div>

          {!loading && (
            <button
              className="secondary-button"
              type="button"
              onClick={reload}
            >
              Atualizar painel
            </button>
          )}
        </div>

        {loading && (
          <div
            className="indicator-grid"
            aria-label="Carregando indicadores"
          >
            {[0, 1, 2].map((item) => (
              <div
                className="indicator-card indicator-card--loading"
                key={item}
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="dashboard-message" role="alert">
            <strong>Não conseguimos carregar o painel.</strong>
            <p>{error}</p>
            <button type="button" onClick={reload}>
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && indicators.length === 0 && (
          <div className="dashboard-message">
            <strong>Nenhum indicador disponível.</strong>
            <p>
              Execute a sincronização da API e tente novamente.
            </p>
          </div>
        )}

        {!loading && !error && indicators.length > 0 && (
          <div className="indicator-grid">
            {indicators.map((indicator) => (
              <IndicatorCard
                indicator={indicator}
                key={indicator.slug}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}