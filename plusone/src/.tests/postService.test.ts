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

  it('rsvp/cancel rsvp -> hits RSVP endpoints with userId param and returns post', async () => {
    const post = { id: 'p1', title: 'Event' };
    (apiMock.post as jest.Mock).mockResolvedValueOnce({ data: post });
    const rsvpResult = await postService.rsvp('p1', 'u1');
    expect(apiMock.post).toHaveBeenCalledWith('/posts/p1/rsvp', null, {
      params: { userId: 'u1' },
    });
    expect(rsvpResult).toEqual(post);

    const updated = { id: 'p1', title: 'Event', rsvpUserIds: [] };
    (apiMock.delete as jest.Mock).mockResolvedValueOnce({ data: updated });
    const cancelResult = await postService.cancelRsvp('p1', 'u1');
    expect(apiMock.delete).toHaveBeenCalledWith('/posts/p1/rsvp', {
      params: { userId: 'u1' },
    });
    expect(cancelResult).toEqual(updated);
  });

  it('getRsvps -> GET /posts/:id/rsvps with requestingUserId', async () => {
    const attendees = [{ id: 'a1', firstName: 'Ada', lastName: 'Lovelace' }];
    (apiMock.get as jest.Mock).mockResolvedValueOnce({ data: attendees });

    const out = await postService.getRsvps('post-123', 'author-1');
    expect(apiMock.get).toHaveBeenCalledWith('/posts/post-123/rsvps', {
      params: { requestingUserId: 'author-1' },
    });
    expect(out).toEqual(attendees);
  });

  it('propagates errors from api', async () => {
    const err = new Error('boom');
    (apiMock.get as jest.Mock).mockRejectedValueOnce(err);
    await expect(postService.list('u1')).rejects.toBe(err);
  });
});
