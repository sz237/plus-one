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

// 2) Import the service under test
import { connectionService } from '../services/connectionService';

describe('connectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecentUsers', () => {
    it('calls the right endpoint with params and returns data', async () => {
      const currentUserId = 'u1';
      const resp = [{ userId: 'u2', firstName: 'A', lastName: 'B', email: 'a@b.com', profile: { location: { city: '', state: '', country: '' }, job: { title: '', companiesName: '' }, interests: [], profilePhoto: {} }, createdAt: '2024-01-01' }];
      (apiMock.get as jest.Mock).mockResolvedValueOnce({ data: resp });

      const out = await connectionService.getRecentUsers(currentUserId);
      expect(apiMock.get).toHaveBeenCalledWith('/connections/recent-users', { params: { currentUserId } });
      expect(out).toEqual(resp);
    });
  });

  describe('createConnectionRequest', () => {
    it('posts request with fromUserId as query param and returns data', async () => {
      const fromUserId = 'u1';
      const req = { toUserId: 'u2', message: 'hi' };
      const resp = { id: 'r1', fromUserId, toUserId: 'u2', message: 'hi', status: 'PENDING', createdAt: 'now' };
      (apiMock.post as jest.Mock).mockResolvedValueOnce({ data: resp });

      const out = await connectionService.createConnectionRequest(fromUserId, req as any);
      expect(apiMock.post).toHaveBeenCalledWith('/connections/request', req, { params: { fromUserId } });
      expect(out).toEqual(resp);
    });
  });

  describe('acceptConnectionRequest', () => {
    it('posts accept with userId param and returns data', async () => {
      const requestId = 'r1', userId = 'u2';
      const resp = { id: requestId, status: 'ACCEPTED' };
      (apiMock.post as jest.Mock).mockResolvedValueOnce({ data: resp });

      const out = await connectionService.acceptConnectionRequest(requestId, userId);
      expect(apiMock.post).toHaveBeenCalledWith(`/connections/accept/${requestId}`, null, { params: { userId } });
      expect(out).toEqual(resp);
    });
  });

  describe('getConnectionStatus', () => {
    it('gets status with from/to params and returns string data', async () => {
      (apiMock.get as jest.Mock).mockResolvedValueOnce({ data: 'CONNECTED' });
      const out = await connectionService.getConnectionStatus('u1', 'u2');
      expect(apiMock.get).toHaveBeenCalledWith('/connections/status', { params: { fromUserId: 'u1', toUserId: 'u2' } });
      expect(out).toBe('CONNECTED');
    });
  });

  describe('getPendingRequests', () => {
    it('gets pending-requests with userId param and returns data', async () => {
      const resp = [{ id: 'r1', fromUserId: 'u2', toUserId: 'u1', status: 'PENDING' }];
      (apiMock.get as jest.Mock).mockResolvedValueOnce({ data: resp });

      const out = await connectionService.getPendingRequests('u1');
      expect(apiMock.get).toHaveBeenCalledWith('/connections/pending-requests', { params: { userId: 'u1' } });
      expect(out).toEqual(resp);
    });
  });

  describe('rejectConnectionRequest', () => {
    it('posts reject with userId param and returns data', async () => {
      const resp = { id: 'r1', status: 'REJECTED' };
      (apiMock.post as jest.Mock).mockResolvedValueOnce({ data: resp });

      const out = await connectionService.rejectConnectionRequest('r1', 'u1');
      expect(apiMock.post).toHaveBeenCalledWith('/connections/reject/r1', null, { params: { userId: 'u1' } });
      expect(out).toEqual(resp);
    });
  });

  // Optional: error propagation checks (service does not catch)
  it('propagates errors from api', async () => {
    const err = new Error('boom');
    (apiMock.get as jest.Mock).mockRejectedValueOnce(err);
    await expect(connectionService.getRecentUsers('u1')).rejects.toBe(err);
  });
});