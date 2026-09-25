import { describe, expect, it, vi } from "vitest";

import { BcbSelicProvider } from "./bcb-selic-provider.js";

const period = {
  from: "2026-09-01",
  to: "2026-09-23",
};

function createHttpClient(payload: unknown, status = 200) {
  return vi.fn(async (_url: URL, _options: RequestInit) => {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
}

describe("BcbSelicProvider", () => {
  it("requests the period and normalizes Selic observations", async () => {
    const httpClient = createHttpClient([
      { data: "23/09/2026", valor: "14.25" },
      { data: "01/09/2026", valor: "13.75" },
    ]);

    const provider = new BcbSelicProvider(httpClient);

    await expect(provider.fetchObservations(period)).resolves.toEqual([
      { referenceDate: "2026-09-01", value: "13.75" },
      { referenceDate: "2026-09-23", value: "14.25" },
    ]);

    expect(httpClient).toHaveBeenCalledTimes(1);

    const call = httpClient.mock.calls[0];
    expect(call).toBeDefined();

    const url = call![0];
    const options = call![1];

    expect(url.origin).toBe("https://api.bcb.gov.br");
    expect(url.pathname).toContain("bcdata.sgs.432");
    expect(url.searchParams.get("formato")).toBe("json");
    expect(url.searchParams.get("dataInicial")).toBe("01/09/2026");
    expect(url.searchParams.get("dataFinal")).toBe("23/09/2026");
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns an empty list when the BCB has no observations", async () => {
    const provider = new BcbSelicProvider(createHttpClient([]));

    await expect(provider.fetchObservations(period)).resolves.toEqual([]);
  });

  it("rejects an HTTP failure", async () => {
    const provider = new BcbSelicProvider(
      createHttpClient({ error: "Unavailable" }, 503),
    );

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "BCB Selic request failed: HTTP 503",
    );
  });

  it("propagates network failures", async () => {
    const provider = new BcbSelicProvider(async () => {
      throw new Error("Network unavailable");
    });

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "Network unavailable",
    );
  });

  it("rejects an unexpected response structure", async () => {
    const provider = new BcbSelicProvider(
      createHttpClient({ results: [] }),
    );

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "Invalid BCB Selic response",
    );
  });

  it.each([
    { data: "2026-09-23", valor: "14.25" },
    { data: "31/02/2026", valor: "14.25" },
    { data: "23/09/2026", valor: "" },
    { data: "23/09/2026", valor: "not-a-number" },
    { data: "23/09/2026", valor: 14.25 },
  ])("rejects an invalid observation: %j", async (row) => {
    const provider = new BcbSelicProvider(createHttpClient([row]));

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "Invalid BCB Selic observation",
    );
  });

  it("rejects duplicate reference dates", async () => {
    const row = {
      data: "23/09/2026",
      valor: "14.25",
    };

    const provider = new BcbSelicProvider(
      createHttpClient([row, row]),
    );

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "Duplicate BCB Selic reference date",
    );
  });

  it("rejects observations outside the requested period", async () => {
    const provider = new BcbSelicProvider(
      createHttpClient([
        {
          data: "31/08/2026",
          valor: "14.25",
        },
      ]),
    );

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "BCB Selic observation outside requested period",
    );
  });

  it.each([
    { from: "2026-02-30", to: "2026-03-01" },
    { from: "2026-09-23", to: "2026-09-01" },
    { from: "2024-01-01", to: "2026-09-23" },
  ])("rejects invalid periods before making a request: %j", async (input) => {
    const httpClient = createHttpClient([]);
    const provider = new BcbSelicProvider(httpClient);

    await expect(provider.fetchObservations(input)).rejects.toThrow();
    expect(httpClient).not.toHaveBeenCalled();
  });
});