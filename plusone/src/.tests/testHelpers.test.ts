/**
 * @file src/.tests/testHelpers.test.ts
 *
 * Purpose:
 *  - Verify mockAxios():
 *      * returns an axios instance with get/post/put/delete fns
 *      * sets axios.create().mockReturnValue(instance) so subsequent axios.create() returns that instance
 *      * resets direct axios method mocks (get/post/put/delete)
 */

import type axiosType from 'axios';
import { mockAxios } from '@/./.tests/testHelpers'; // path is already src/.tests/testHelpers.ts

// Fully mock axios default export with the methods we use
jest.mock('axios', () => {
  const create = jest.fn();
  const get = jest.fn();
  const post = jest.fn();
  const put = jest.fn();
  const del = jest.fn();
  // emulate default export object
  return {
    __esModule: true,
    default: { create, get, post, put, delete: del },
  };
});

const axios = jest.requireMock('axios') as unknown as jest.Mocked<typeof axiosType>;

describe('testHelpers.mockAxios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides an axios instance with stubbed methods and wires axios.create() to return it', () => {
    const { ax, instance } = mockAxios();

    // axios.create() should now return the same instance
    const created = ax.create();
    expect(created).toBe(instance);

    // instance should have the basic HTTP methods wired as jest.fn()
    expect(typeof instance.get).toBe('function');
    expect(typeof instance.post).toBe('function');
    expect(typeof instance.put).toBe('function');
    expect(typeof instance.delete).toBe('function');

    // instance also exposes interceptors with .use mocks
    expect(typeof instance.interceptors.request.use).toBe('function');
    expect(typeof instance.interceptors.response.use).toBe('function');
  });

  it('resets direct axios method mocks (get/post/put/delete)', () => {
    // dirty the mocks
    axios.get.mockResolvedValueOnce({ data: 1 });
    axios.post.mockResolvedValueOnce({ data: 2 });
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledTimes(1);

    // call mockAxios() -> should reset those direct mocks
    const { ax } = mockAxios();
    expect(ax.get).toHaveBeenCalledTimes(0);
    expect(ax.post).toHaveBeenCalledTimes(0);

    // they are still callable afterwards
    ax.get('/x');
    ax.post('/y');
    expect(ax.get).toHaveBeenCalledWith('/x');
    expect(ax.post).toHaveBeenCalledWith('/y');
  });

  it('returns a fresh instance each time, but you control what create() returns', () => {
    const first = mockAxios().instance;
    const second = mockAxios().instance;
    expect(first).not.toBe(second);

    // each call wires axios.create() to the *latest* instance it returned
    axios.create.mockClear();
    const { instance } = mockAxios();
    expect(axios.create()).toBe(instance);
  });
});