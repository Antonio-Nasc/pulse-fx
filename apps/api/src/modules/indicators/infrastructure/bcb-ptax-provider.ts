import type {
  IndicatorProvider,
  ObservationPeriod,
  ProviderObservation,
} from "../application/indicator-provider.js";

type HttpClient = (url: URL, options: RequestInit) => Promise<Response>;

const endpoint =
  "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/" +
  "CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)";

function parseDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error("Expected a valid YYYY-MM-DD date");
  }

  return date;
}

function toBcbDate(value: string): string {
  return `${value.slice(5, 7)}-${value.slice(8, 10)}-${value.slice(0, 4)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class BcbPtaxProvider implements IndicatorProvider {
  constructor(private readonly httpClient: HttpClient = fetch) {}

  async fetchObservations(
    period: ObservationPeriod,
  ): Promise<ProviderObservation[]> {
    const from = parseDate(period.from);
    const to = parseDate(period.to);
    const days = (to.getTime() - from.getTime()) / 86_400_000;

    if (days < 0 || days > 366) {
      throw new Error("PTAX period must be ordered and span at most 366 days");
    }

    const url = new URL(endpoint);

    url.searchParams.set("@dataInicial", `'${toBcbDate(period.from)}'`);
    url.searchParams.set("@dataFinalCotacao", `'${toBcbDate(period.to)}'`);
    url.searchParams.set("$format", "json");
    url.searchParams.set("$select", "cotacaoVenda,dataHoraCotacao");
    url.searchParams.set("$orderby", "dataHoraCotacao asc");
    url.searchParams.set("$top", "1000");
    // O serviço OData do BCB exige espaços como %20, não "+".
    url.search = url.search.replaceAll("+", "%20");

    const response = await this.httpClient(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`BCB PTAX request failed: HTTP ${response.status}`);
    }

    const payload: unknown = await response.json();

    if (!isRecord(payload) || !Array.isArray(payload.value)) {
      throw new Error("Invalid BCB PTAX response");
    }

    // Não aceitar silenciosamente um histórico incompleto.
    if (payload["@odata.nextLink"] || payload.value.length >= 1000) {
      throw new Error("BCB PTAX response requires pagination");
    }

    const observations: ProviderObservation[] = [];
    const seenDates = new Set<string>();

    for (const row of payload.value) {
      if (
        !isRecord(row) ||
        typeof row.cotacaoVenda !== "number" ||
        !Number.isFinite(row.cotacaoVenda) ||
        row.cotacaoVenda <= 0 ||
        typeof row.dataHoraCotacao !== "string" ||
        !/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(row.dataHoraCotacao)
      ) {
        throw new Error("Invalid BCB PTAX observation");
      }

      // Preserva a data publicada pelo BCB, sem conversão de fuso.
      const referenceDate = row.dataHoraCotacao.slice(0, 10);
      parseDate(referenceDate);

      if (referenceDate < period.from || referenceDate > period.to) {
        throw new Error("BCB PTAX observation outside requested period");
      }

      if (seenDates.has(referenceDate)) {
        throw new Error("Duplicate BCB PTAX reference date");
      }

      seenDates.add(referenceDate);

      observations.push({
        referenceDate,
        value: String(row.cotacaoVenda),
      });
    }

    return observations.sort((a, b) =>
      a.referenceDate.localeCompare(b.referenceDate),
    );
  }
}
