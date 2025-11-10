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

import { profileService } from '../services/profileService';

describe('profileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getProfile -> GET /users/:id/profile returns data', async () => {
    const resp = { userId: 'u1', profile: { firstName: 'A' } };
    (apiMock.get as jest.Mock).mockResolvedValueOnce({ data: resp });

    const out = await profileService.getProfile('u1');
    expect(apiMock.get).toHaveBeenCalledWith('/users/u1/profile');
    expect(out).toEqual(resp);
  });

  it('updateProfile -> PUT /users/:id/profile with payload returns data', async () => {
    const payload = { profile: { firstName: 'B' } } as any;
    const resp = { userId: 'u1', profile: { firstName: 'B' } };
    (apiMock.put as jest.Mock).mockResolvedValueOnce({ data: resp });

    const out = await profileService.updateProfile('u1', payload);
    expect(apiMock.put).toHaveBeenCalledWith('/users/u1/profile', payload);
    expect(out).toEqual(resp);
  });

  it('propagates errors from api', async () => {
    const err = new Error('boom');
    (apiMock.put as jest.Mock).mockRejectedValueOnce(err);
    await expect(profileService.updateProfile('u1', {} as any)).rejects.toBe(err);
  });
});