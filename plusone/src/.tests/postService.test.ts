/// <reference types="jest" />

const apiMock = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../services/http', () => ({
  __esModule: true,
  api: apiMock,
}));

import { postService } from '../services/postService';

describe('postService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getProfile -> GET /users/:id/profile returns data', async () => {
    const resp = { userId: 'u1', profile: {} };
    (apiMock.get as jest.Mock).mockResolvedValueOnce({ data: resp });

    const out = await postService.getProfile('u1');
    expect(apiMock.get).toHaveBeenCalledWith('/users/u1/profile');
    expect(out).toEqual(resp);
  });

  it('list -> GET /posts with userId param returns posts', async () => {
    const resp = [{ id: 'p1', title: 't' }];
    (apiMock.get as jest.Mock).mockResolvedValueOnce({ data: resp });

    const out = await postService.list('u1');
    expect(apiMock.get).toHaveBeenCalledWith('/posts', { params: { userId: 'u1' } });
    expect(out).toEqual(resp);
  });

  it('create -> POST /posts returns created post', async () => {
    const payload = { id: 'p1', title: 't' } as any;
    (apiMock.post as jest.Mock).mockResolvedValueOnce({ data: payload });

    const out = await postService.create(payload);
    expect(apiMock.post).toHaveBeenCalledWith('/posts', payload);
    expect(out).toEqual(payload);
  });

  it('update -> PUT /posts/:id returns updated post', async () => {
    const payload = { id: 'p1', title: 'updated' } as any;
    (apiMock.put as jest.Mock).mockResolvedValueOnce({ data: payload });

    const out = await postService.update('p1', payload);
    expect(apiMock.put).toHaveBeenCalledWith('/posts/p1', payload);
    expect(out).toEqual(payload);
  });

  it('remove -> DELETE /posts/:id resolves void', async () => {
    (apiMock.delete as jest.Mock).mockResolvedValueOnce(undefined);

    await postService.remove('p1');
    expect(apiMock.delete).toHaveBeenCalledWith('/posts/p1');
  });

  it('propagates errors from api', async () => {
    const err = new Error('boom');
    (apiMock.get as jest.Mock).mockRejectedValueOnce(err);
    await expect(postService.list('u1')).rejects.toBe(err);
  });
});