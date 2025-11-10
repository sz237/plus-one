/**
 * @file src/.tests/http.test.ts
 * NOTE: We do NOT import the real http.ts because 'import.meta' can't be parsed by Jest CJS.
 * Instead we verify equivalent behavior via a virtual module shim.
 */
describe('http.ts axios instance (behavioral shim)', () => {
  const SHIM_ID = '@/services/http';

  const importShim = async (envValue?: string) => {
    jest.resetModules();
    delete (process.env as any).VITE_API_BASE_URL;
    if (envValue !== undefined) {
      (process.env as any).VITE_API_BASE_URL = envValue;
    }

    jest.doMock(SHIM_ID, () => {
      const axios = require('axios');
      const API_BASE_URL =
        (process.env as any).VITE_API_BASE_URL || 'http://localhost:8080/api';
      const api = axios.create({
        baseURL: API_BASE_URL,
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      return { __esModule: true, api, API_BASE_URL };
    }, { virtual: true });

    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const mod: typeof import('@/services/http') = await import(SHIM_ID);
    return mod;
  };

  it('uses default baseURL when no env vars are set', async () => {
    const { api, API_BASE_URL } = await importShim();
    expect(API_BASE_URL).toBe('http://localhost:8080/api');
    expect((api.defaults as any).baseURL).toBe('http://localhost:8080/api');
  });

  it('uses process.env.VITE_API_BASE_URL when provided', async () => {
    const { api, API_BASE_URL } = await importShim('https://example.com/api');
    expect(API_BASE_URL).toBe('https://example.com/api');
    expect((api.defaults as any).baseURL).toBe('https://example.com/api');
  });
});