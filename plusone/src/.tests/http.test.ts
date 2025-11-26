/**
 * @file src/.tests/http.test.ts
 *
 * Covers all branches in http.ts:
 *  - Vite import.meta.env present
 *  - process.env fallback
 *  - precedence (import.meta.env over process.env)
 *  - default "http://localhost:8080/api"
 * Also verifies axios.create is called with expected options.
 */

import type { AxiosInstance } from 'axios';

// Mock axios to capture create options
let capturedRequestInterceptor: ((config: any) => any) | undefined;
const mockInterceptors = {
  request: {
    use: jest.fn((fn: (config: any) => any) => {
      capturedRequestInterceptor = fn;
      return fn;
    }),
  },
};

const createSpy = jest.fn(
  () =>
    ({
      interceptors: mockInterceptors,
    }) as unknown as AxiosInstance
) as unknown as jest.Mock<AxiosInstance>;
jest.mock('axios', () => ({
  __esModule: true,
  default: { create: createSpy },
  create: createSpy,
}));

/** Helper to (re)load the module with fresh globals */
const loadHttpModule = () =>
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@/services/http') as typeof import('@/services/http');
  });

/** Clean both env sources before each scenario */
const resetEnv = () => {
  delete (globalThis as any).import;
  delete (process as any).env?.VITE_API_BASE_URL;
};

describe('services/http.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedRequestInterceptor = undefined;
    mockInterceptors.request.use.mockClear();
    resetEnv();
    localStorage.clear();
  });

  test('uses Vite import.meta.env.VITE_API_BASE_URL when present', () => {
    // Define global "import.meta.env" like Vite does
    (globalThis as any).import = { meta: { env: { VITE_API_BASE_URL: 'https://vite-env.example/api' } } };

    const { API_BASE_URL, api } = loadHttpModule();

    expect(API_BASE_URL).toBe('https://vite-env.example/api');
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith({
      baseURL: 'https://vite-env.example/api',
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });

    // exported axios instance exists
    expect(api).toBeTruthy();
  });

  test('falls back to process.env.VITE_API_BASE_URL when import.meta.env is missing', () => {
    (process as any).env = { ...(process as any).env, VITE_API_BASE_URL: 'https://node-env.example/api' };

    const { API_BASE_URL } = loadHttpModule();

    expect(API_BASE_URL).toBe('https://node-env.example/api');
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://node-env.example/api', withCredentials: true })
    );
  });

  test('import.meta.env takes precedence over process.env when both exist', () => {
    (globalThis as any).import = { meta: { env: { VITE_API_BASE_URL: 'https://vite-wins.example/api' } } };
    (process as any).env = { ...(process as any).env, VITE_API_BASE_URL: 'https://node-loses.example/api' };

    const { API_BASE_URL } = loadHttpModule();

    expect(API_BASE_URL).toBe('https://vite-wins.example/api');
  });

  test('falls back to default when neither env is set', () => {
    const { API_BASE_URL } = loadHttpModule();

    expect(API_BASE_URL).toBe('http://localhost:8080/api');
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'http://localhost:8080/api' })
    );
  });

  test('sets JSON header & withCredentials=true on axios instance', () => {
    (globalThis as any).import = { meta: { env: { VITE_API_BASE_URL: 'https://check-opts.example/api' } } };
    loadHttpModule();

    const opts = createSpy.mock.calls[0][0];
    expect(opts.withCredentials).toBe(true);
    expect(opts.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  test('adds Authorization header when auth token is stored', () => {
    const { AUTH_TOKEN_KEY } = loadHttpModule();
    expect(mockInterceptors.request.use).toHaveBeenCalledTimes(1);
    localStorage.setItem(AUTH_TOKEN_KEY, 'jwt-123');

    const cfg = capturedRequestInterceptor?.({ headers: {} }) ?? {};
    expect(cfg.headers?.Authorization).toBe('Bearer jwt-123');
  });
});
