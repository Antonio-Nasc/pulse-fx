import { IndicatorChart } from './IndicatorChart';
import {
  formatChangePercent,
  formatIndicatorValue,
  formatReferenceDate,
  getChangeTone,
} from './indicator-formatters';
import { useIndicatorDetail } from './use-indicator-detail';

type IndicatorDetailPageProps = {
  slug: string;
  onBack: () => void;
};

const sourceLabels = {
  BCB: 'Banco Central do Brasil',
  FRED: 'Federal Reserve Bank of St. Louis',
} as const;

const frequencyLabels = {
  DAILY: 'Série diária',
  MONTHLY: 'Série mensal',
} as const;

export function IndicatorDetailPage({
  slug,
  onBack,
}: IndicatorDetailPageProps) {
  const { detail, loading, error, reload } =
    useIndicatorDetail(slug);

  if (loading) {
    return (
      <main className="detail-page">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
        >
          ← Voltar ao painel
        </button>

        <div
          className="detail-loading"
          aria-label="Carregando indicador"
        />
      </main>
    );
  }

  if (error || !detail) {
    return (
      <main className="detail-page">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
        >
          ← Voltar ao painel
        </button>

        <div className="dashboard-message" role="alert">
          <strong>Não conseguimos carregar o indicador.</strong>
          <p>{error ?? 'Indicador não encontrado.'}</p>
          <button type="button" onClick={reload}>
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  const changeTone = getChangeTone(detail.changePercent);
  const recentObservations = [...detail.observations]
    .reverse()
    .slice(0, 12);

  return (
    <main className="detail-page">
      <button
        className="back-button"
        type="button"
        onClick={onBack}
      >
        ← Voltar ao painel
      </button>

      <section className="detail-hero">
        <div>
          <div className="detail-hero__tags">
            <span>{sourceLabels[detail.source]}</span>
            <span>{frequencyLabels[detail.frequency]}</span>
            {detail.stale && (
              <span className="detail-hero__stale">
                Atualização pendente
              </span>
            )}
          </div>

          <h1>{detail.name}</h1>
          <p>{detail.description}</p>
        </div>

        <div className="detail-current-value">
          <span>Último valor</span>
          <strong>
            {formatIndicatorValue(detail.latestValue)}
          </strong>
          <small>{detail.unit}</small>
        </div>
      </section>

      <section className="detail-metrics">
        <article>
          <span>Variação</span>
          <strong
            className={`detail-change detail-change--${changeTone}`}
          >
            {formatChangePercent(detail.changePercent)}
          </strong>
          <small>{detail.variationLabel}</small>
        </article>

        <article>
          <span>Data de referência</span>
          <strong>
            {formatReferenceDate(detail.referenceDate)}
          </strong>
          <small>Data da observação</small>
        </article>

        <article>
          <span>Histórico exibido</span>
          <strong>{detail.historyMonths} meses</strong>
          <small>{detail.observations.length} observações</small>
        </article>
      </section>

      <section
        className="detail-section"
        aria-labelledby="history-title"
      >
        <div className="detail-section__header">
          <div>
            <span className="section-label">Série temporal</span>
            <h2 id="history-title">Evolução histórica</h2>
          </div>

          <span className="detail-section__unit">
            Unidade: {detail.unit}
          </span>
        </div>

        <IndicatorChart
          observations={detail.observations}
          unit={detail.unit}
        />
      </section>

      <div className="detail-columns">
        <section
          className="detail-section"
          aria-labelledby="observations-title"
        >
          <div className="detail-section__header">
            <div>
              <span className="section-label">
                Dados recentes
              </span>
              <h2 id="observations-title">
                Últimas observações
              </h2>
            </div>
          </div>

          <div className="observation-table-wrapper">
            <table className="observation-table">
              <thead>
                <tr>
                  <th>Referência</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {recentObservations.map((observation) => (
                  <tr key={observation.referenceDate}>
                    <td>
                      {formatReferenceDate(
                        observation.referenceDate,
                      )}
                    </td>
                    <td>
                      {formatIndicatorValue(
                        observation.value,
                      )}{' '}
                      <span>{detail.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="detail-information">
          <section>
            <span className="section-label">Transparência</span>
            <h2>Limitações dos dados</h2>
            <p>{detail.limitationText}</p>
          </section>

          <section>
            <span className="section-label">Fonte oficial</span>
            <h2>{sourceLabels[detail.source]}</h2>
            <p>
              Consulte a documentação e os dados diretamente na
              fonte responsável.
            </p>
            <a
              href={detail.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Abrir fonte oficial ↗
            </a>
          </section>
        </aside>
      </div>
    </main>
  );
}