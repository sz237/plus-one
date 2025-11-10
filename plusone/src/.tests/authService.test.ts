const apiMock = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../services/http', () => {
  return {
    __esModule: true,
    api: apiMock,
  };
});

import { authService, isVanderbiltEmail } from '../services/authService';

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const payload = {
      email: 'a@vanderbilt.edu',
      password: 'secret',
      firstName: 'A',
      lastName: 'B',
    };

    it('returns data on success', async () => {
      const resp = { message: 'Signed up', userId: 'u1' };
      (apiMock.post as jest.Mock).mockResolvedValueOnce({ data: resp });

      const out = await authService.signup(payload);
      expect(apiMock.post).toHaveBeenCalledWith('/auth/signup', payload);
      expect(out).toEqual(resp);
    });

    it('returns error.response.data when server sends body', async () => {
      const err = { response: { data: { message: 'Email in use' } } };
      (apiMock.post as jest.Mock).mockRejectedValueOnce(err);

      const out = await authService.signup(payload);
      expect(out).toEqual({ message: 'Email in use' });
    });

    it('throws friendly error on network failure', async () => {
      (apiMock.post as jest.Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'));
      await expect(authService.signup(payload)).rejects.toThrow(
        'Network error. Please try again.'
      );
    });
  });

  describe('login', () => {
    const payload = { email: 'a@vanderbilt.edu', password: 'secret' };

    it('returns data on success', async () => {
      const resp = { message: 'Logged in', email: payload.email };
      (apiMock.post as jest.Mock).mockResolvedValueOnce({ data: resp });

      const out = await authService.login(payload);
      expect(apiMock.post).toHaveBeenCalledWith('/auth/login', payload);
      expect(out).toEqual(resp);
    });

    it('returns error.response.data when server returns error', async () => {
      const err = { response: { data: { message: 'Invalid credentials' } } };
      (apiMock.post as jest.Mock).mockRejectedValueOnce(err);

      const out = await authService.login(payload);
      expect(out).toEqual({ message: 'Invalid credentials' });
    });

    it('throws friendly error on network failure', async () => {
      (apiMock.post as jest.Mock).mockRejectedValueOnce(new Error('timeout'));
      await expect(authService.login(payload)).rejects.toThrow(
        'Network error. Please try again.'
      );
    });
  });

  describe('test', () => {
    it('returns backend /test text on success', async () => {
      (apiMock.get as jest.Mock).mockResolvedValueOnce({ data: 'ok' });
      const out = await authService.test();
      expect(apiMock.get).toHaveBeenCalledWith('/auth/test');
      expect(out).toBe('ok');
    });

    it('throws a specific error when request fails', async () => {
      (apiMock.get as jest.Mock).mockRejectedValueOnce(new Error('boom'));
      await expect(authService.test()).rejects.toThrow('Failed to connect to backend');
    });
  });

  describe('isVanderbiltEmail', () => {
    it('accepts vanderbilt.edu (case-insensitive, trims)', () => {
      expect(isVanderbiltEmail('User@VANDERBILT.EDU')).toBe(true);
      expect(isVanderbiltEmail('  user@vanderbilt.edu  ')).toBe(true);
    });
    it('rejects non-vanderbilt domains', () => {
      expect(isVanderbiltEmail('user@vanderbilt.com')).toBe(false);
      expect(isVanderbiltEmail('user@gmail.com')).toBe(false);
      expect(isVanderbiltEmail('invalid')).toBe(false);
    });
  });
});