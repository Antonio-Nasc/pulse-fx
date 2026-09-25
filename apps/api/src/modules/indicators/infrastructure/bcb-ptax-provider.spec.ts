import { describe, expect, it, vi } from "vitest";

import { BcbPtaxProvider } from "./bcb-ptax-provider.js";

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

describe("BcbPtaxProvider", () => {
  it("requests the period and normalizes sale quotations", async () => {
    const httpClient = createHttpClient({
      value: [
        {
          cotacaoCompra: 5.49,
          cotacaoVenda: 5.5,
          dataHoraCotacao: "2026-09-23 13:05:00.000",
        },
        {
          cotacaoCompra: 4.99,
          cotacaoVenda: 5,
          dataHoraCotacao: "2026-09-01 13:05:00.000",
        },
      ],
    });

    const provider = new BcbPtaxProvider(httpClient);

    await expect(provider.fetchObservations(period)).resolves.toEqual([
      { referenceDate: "2026-09-01", value: "5" },
      { referenceDate: "2026-09-23", value: "5.5" },
    ]);

    expect(httpClient).toHaveBeenCalledTimes(1);

    const call = httpClient.mock.calls[0];
    expect(call).toBeDefined();

    const url = call![0];
    const options = call![1];

    expect(url.origin).toBe("https://olinda.bcb.gov.br");
    expect(url.href).toContain("dataHoraCotacao%20asc");
    expect(url.href).not.toContain("+");
    expect(url.pathname).toContain("CotacaoDolarPeriodo");
    expect(url.searchParams.get("@dataInicial")).toBe("'09-01-2026'");
    expect(url.searchParams.get("@dataFinalCotacao")).toBe("'09-23-2026'");
    expect(url.searchParams.get("$select")).toBe(
      "cotacaoVenda,dataHoraCotacao",
    );
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns an empty list for a period without published observations", async () => {
    const provider = new BcbPtaxProvider(createHttpClient({ value: [] }));

    await expect(provider.fetchObservations(period)).resolves.toEqual([]);
  });

  it("rejects an HTTP failure", async () => {
    const provider = new BcbPtaxProvider(
      createHttpClient({ error: "Unavailable" }, 503),
    );

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "BCB PTAX request failed: HTTP 503",
    );
  });

  it("propagates network failures", async () => {
    const provider = new BcbPtaxProvider(async () => {
      throw new Error("Network unavailable");
    });

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "Network unavailable",
    );
  });

  it("rejects an unexpected response structure", async () => {
    const provider = new BcbPtaxProvider(createHttpClient({ results: [] }));

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "Invalid BCB PTAX response",
    );
  });

  it.each([null, "5.50", 0, -1])(
    "rejects an invalid sale quotation: %s",
    async (value) => {
      const provider = new BcbPtaxProvider(
        createHttpClient({
          value: [
            {
              cotacaoVenda: value,
              dataHoraCotacao: "2026-09-23 13:05:00.000",
            },
          ],
        }),
      );

      await expect(provider.fetchObservations(period)).rejects.toThrow(
        "Invalid BCB PTAX observation",
      );
    },
  );

  it("rejects duplicate reference dates", async () => {
    const row = {
      cotacaoVenda: 5.5,
      dataHoraCotacao: "2026-09-23 13:05:00.000",
    };

    const provider = new BcbPtaxProvider(
      createHttpClient({ value: [row, row] }),
    );

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "Duplicate BCB PTAX reference date",
    );
  });

  it("rejects observations outside the requested period", async () => {
    const provider = new BcbPtaxProvider(
      createHttpClient({
        value: [
          {
            cotacaoVenda: 5.5,
            dataHoraCotacao: "2026-08-31 13:05:00.000",
          },
        ],
      }),
    );

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "BCB PTAX observation outside requested period",
    );
  });

  it("does not accept a partial paginated response", async () => {
    const provider = new BcbPtaxProvider(
      createHttpClient({
        value: [],
        "@odata.nextLink": "https://example.com/next",
      }),
    );

    await expect(provider.fetchObservations(period)).rejects.toThrow(
      "BCB PTAX response requires pagination",
    );
  });

  it.each([
    { from: "2026-02-30", to: "2026-03-01" },
    { from: "2026-09-23", to: "2026-09-01" },
    { from: "2024-01-01", to: "2026-09-23" },
  ])("rejects invalid periods before making a request: %j", async (input) => {
    const httpClient = createHttpClient({ value: [] });
    const provider = new BcbPtaxProvider(httpClient);

    await expect(provider.fetchObservations(input)).rejects.toThrow();
    expect(httpClient).not.toHaveBeenCalled();
  });
});
