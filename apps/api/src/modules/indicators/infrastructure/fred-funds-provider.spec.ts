import { describe, expect, it, vi } from "vitest";

import { FredFundsProvider } from "./fred-funds-provider.js";

const apiKey = "a".repeat(32);

const period = {
  from: "2026-01-01",
  to: "2026-09-01",
};

function createPayload(
  observations: unknown[],
  count = observations.length,
) {
  return {
    count,
    observations,
  };
}

function createHttpClient(payload: unknown, status = 200) {
  return vi.fn(async (_url: URL, _options: RequestInit) => {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
}

describe("FredFundsProvider", () => {
  it("requests FEDFUNDS and normalizes observations", async () => {
    const httpClient = createHttpClient(
      createPayload([
        { date: "2026-09-01", value: "3.63" },
        { date: "2026-01-01", value: "3.64" },
      ]),
    );

    const provider = new FredFundsProvider(apiKey, httpClient);

    await expect(provider.fetchObservations(period)).resolves.toEqual([
      { referenceDate: "2026-01-01", value: "3.64" },
      { referenceDate: "2026-09-01", value: "3.63" },
    ]);

    const call = httpClient.mock.calls[0];
    expect(call).toBeDefined();

    const url = call![0];
    const options = call![1];

    expect(url.origin).toBe("https://api.stlouisfed.org");
    expect(url.searchParams.get("series_id")).toBe("FEDFUNDS");
    expect(url.searchParams.get("api_key")).toBe(apiKey);
    expect(url.searchParams.get("file_type")).toBe("json");
    expect(url.searchParams.get("observation_start")).toBe("2026-01-01");
    expect(url.searchParams.get("observation_end")).toBe("2026-09-01");
    expect(url.searchParams.get("sort_order")).toBe("asc");
    expect(url.searchParams.get("limit")).toBe("1000");
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("skips the FRED missing-value marker", async () => {
    const provider = new FredFundsProvider(
      apiKey,
      createHttpClient(
        createPayload([
          { date: "2026-01-01", value: "." },
          { date: "2026-02-01", value: "3.64" },
        ]),
      ),
    );

    await expect(provider.fetchObservations(period)).resolves.toEqual([
      { referenceDate: "2026-02-01", value: "3.64" },
    ]);
  });

  it("returns an empty list when no observations exist", async () => {
    const provider = new FredFundsProvider(
      apiKey,
      createHttpClient(createPayload([])),
    );

    await expect(provider.fetchObservations(period)).resolves.toEqual([]);
  });

  it("rejects an HTTP failure", async () => {
    const provider = new FredFundsProvider(
      apiKey,
      createHttpClient({ error: "Unavailable" }, 503),
    );

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "FRED request failed: HTTP 503",
    );
  });

  it("propagates network failures", async () => {
    const provider = new FredFundsProvider(apiKey, async () => {
      throw new Error("Network unavailable");
    });

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "Network unavailable",
    );
  });

  it("rejects an unexpected response structure", async () => {
    const provider = new FredFundsProvider(
      apiKey,
      createHttpClient({ results: [] }),
    );

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "Invalid FRED response",
    );
  });

  it("rejects a partial paginated response", async () => {
    const provider = new FredFundsProvider(
      apiKey,
      createHttpClient(
        createPayload(
          [{ date: "2026-01-01", value: "3.64" }],
          2,
        ),
      ),
    );

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "FRED response requires pagination",
    );
  });

  it.each([
    { date: "01/01/2026", value: "3.64" },
    { date: "2026-02-30", value: "3.64" },
    { date: "2026-01-01", value: "" },
    { date: "2026-01-01", value: "not-a-number" },
    { date: "2026-01-01", value: 3.64 },
  ])("rejects an invalid observation: %j", async (row) => {
    const provider = new FredFundsProvider(
      apiKey,
      createHttpClient(createPayload([row])),
    );

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "Invalid FRED observation",
    );
  });

  it("rejects duplicate reference dates", async () => {
    const row = {
      date: "2026-01-01",
      value: "3.64",
    };

    const provider = new FredFundsProvider(
      apiKey,
      createHttpClient(createPayload([row, row])),
    );

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "Duplicate FRED reference date",
    );
  });

  it("rejects observations outside the requested period", async () => {
    const provider = new FredFundsProvider(
      apiKey,
      createHttpClient(
        createPayload([
          {
            date: "2025-12-01",
            value: "3.64",
          },
        ]),
      ),
    );

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "FRED observation outside requested period",
    );
  });

  it("rejects an inverted period before making a request", async () => {
    const httpClient = createHttpClient(createPayload([]));
    const provider = new FredFundsProvider(apiKey, httpClient);

    await expect(
      provider.fetchObservations({
        from: "2026-09-01",
        to: "2026-01-01",
      }),
    ).rejects.toThrow("FRED period must be ordered");

    expect(httpClient).not.toHaveBeenCalled();
  });

  it.each([
    "",
    "short-key",
    "A".repeat(32),
    "a".repeat(31),
    `${"a".repeat(31)}-`,
  ])("rejects an invalid API key", (invalidApiKey) => {
    expect(
      () => new FredFundsProvider(invalidApiKey),
    ).toThrow("A valid FRED API key is required");
  });
});