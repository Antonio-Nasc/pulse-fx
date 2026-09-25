import type {
  IndicatorProvider,
  ObservationPeriod,
  ProviderObservation,
} from "../application/indicator-provider.js";

type HttpClient = (url: URL, options: RequestInit) => Promise<Response>;

const endpoint =
  "https://api.stlouisfed.org/fred/series/observations";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class FredFundsProvider implements IndicatorProvider {
  private readonly apiKey: string;
  private readonly httpClient: HttpClient;

  constructor(apiKey: string, httpClient: HttpClient = fetch) {
    const normalizedApiKey = apiKey.trim();

    if (!/^[a-z0-9]{32}$/.test(normalizedApiKey)) {
      throw new Error("A valid FRED API key is required");
    }

    this.apiKey = normalizedApiKey;
    this.httpClient = httpClient;
  }

  async fetchObservations(
    period: ObservationPeriod,
  ): Promise<ProviderObservation[]> {
    const from = parseIsoDate(period.from);
    const to = parseIsoDate(period.to);

    if (to.getTime() < from.getTime()) {
      throw new Error("FRED period must be ordered");
    }

    const url = new URL(endpoint);

    url.searchParams.set("series_id", "FEDFUNDS");
    url.searchParams.set("api_key", this.apiKey);
    url.searchParams.set("file_type", "json");
    url.searchParams.set("observation_start", period.from);
    url.searchParams.set("observation_end", period.to);
    url.searchParams.set("sort_order", "asc");
    url.searchParams.set("limit", "1000");

    const response = await this.httpClient(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      throw new Error(`FRED request failed: HTTP ${response.status}`);
    }

    const payload: unknown = await response.json();

    if (
      !isRecord(payload) ||
      !Array.isArray(payload.observations) ||
      typeof payload.count !== "number" ||
      !Number.isInteger(payload.count) ||
      payload.count < 0
    ) {
      throw new Error("Invalid FRED response");
    }

    if (payload.count > payload.observations.length) {
      throw new Error("FRED response requires pagination");
    }

    const observations: ProviderObservation[] = [];
    const seenDates = new Set<string>();

    for (const row of payload.observations) {
      if (
        !isRecord(row) ||
        typeof row.date !== "string" ||
        typeof row.value !== "string"
      ) {
        throw new Error("Invalid FRED observation");
      }

      let referenceDate: string;

      try {
        parseIsoDate(row.date);
        referenceDate = row.date;
      } catch {
        throw new Error("Invalid FRED observation");
      }

      if (referenceDate < period.from || referenceDate > period.to) {
        throw new Error("FRED observation outside requested period");
      }

      if (seenDates.has(referenceDate)) {
        throw new Error("Duplicate FRED reference date");
      }

      seenDates.add(referenceDate);

      const value = row.value.trim();

      // A FRED usa "." para representar uma observação ausente.
      if (value === ".") {
        continue;
      }

      if (
        !/^-?\d+(?:\.\d+)?$/.test(value) ||
        !Number.isFinite(Number(value))
      ) {
        throw new Error("Invalid FRED observation");
      }

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