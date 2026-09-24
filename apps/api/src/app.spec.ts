import { describe, expect, it } from 'vitest';

import { buildApp } from './app.js';

describe('GET /health', () => {
  it('returns the API health status', async () => {
    const app = buildApp({ logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      service: 'pulse-fx-api',
      timestamp: expect.any(String),
    });

    await app.close();
  });
});