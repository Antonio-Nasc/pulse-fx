import type {
  IndicatorProvider,
  ObservationPeriod,
  ProviderObservation,
} from "../application/indicator-provider.js";

type HttpClient = (url: URL, options: RequestInit) => Promise<Response>;

const endpoint =
  "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados";

function parseIsoDate(value: string): Date {
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
  return `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;
}

function fromBcbDate(value: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);

  if (!match) {
    throw new Error("Invalid BCB Selic observation");
  }

  const [, day, month, year] = match;
  const isoDate = `${year}-${month}-${day}`;

  try {
    parseIsoDate(isoDate);
  } catch {
    throw new Error("Invalid BCB Selic observation");
  }

  return isoDate;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class BcbSelicProvider implements IndicatorProvider {
  constructor(private readonly httpClient: HttpClient = fetch) {}

  async fetchObservations(
    period: ObservationPeriod,
  ): Promise<ProviderObservation[]> {
    const from = parseIsoDate(period.from);
    const to = parseIsoDate(period.to);
    const days = (to.getTime() - from.getTime()) / 86_400_000;

    if (days < 0 || days > 366) {
      throw new Error("BCB Selic period must be ordered and span at most 366 days");
    }

    const url = new URL(endpoint);

    url.searchParams.set("formato", "json");
    url.searchParams.set("dataInicial", toBcbDate(period.from));
    url.searchParams.set("dataFinal", toBcbDate(period.to));

    const response = await this.httpClient(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`BCB Selic request failed: HTTP ${response.status}`);
    }

    const payload: unknown = await response.json();

    if (!Array.isArray(payload)) {
      throw new Error("Invalid BCB Selic response");
    }

    const observations: ProviderObservation[] = [];
    const seenDates = new Set<string>();

    for (const row of payload) {
      if (
        !isRecord(row) ||
        typeof row.data !== "string" ||
        typeof row.valor !== "string" ||
        row.valor.trim() === "" ||
        !Number.isFinite(Number(row.valor))
      ) {
        throw new Error("Invalid BCB Selic observation");
      }

      const referenceDate = fromBcbDate(row.data);
      const value = row.valor.trim();

      if (referenceDate < period.from || referenceDate > period.to) {
        throw new Error("BCB Selic observation outside requested period");
      }

      if (seenDates.has(referenceDate)) {
        throw new Error("Duplicate BCB Selic reference date");
      }

      seenDates.add(referenceDate);

      observations.push({
        referenceDate,
        value,
      });
    }

    return observations.sort((a, b) =>
      a.referenceDate.localeCompare(b.referenceDate),
    );
  }
}