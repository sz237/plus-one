import type { AxiosInstance } from 'axios';

// We stub the shared axios instance that connectionService uses
const getMock = jest.fn();
const postMock = jest.fn();

jest.mock('../services/http', () => {
  const api = { get: getMock, post: postMock } as unknown as AxiosInstance;
  return { __esModule: true, api };
});

// re-require service fresh each test to avoid cache
const loadService = () =>
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('../services/connectionService') as typeof import('../services/connectionService');
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('connectionService', () => {
  test('getRecentUsers (default limit)', async () => {
    const { connectionService } = loadService();
    const data = [{ userId: '1', firstName: 'A', lastName: 'B', email: 'a@b', profile:{location:{city:'',state:'',country:''},job:{title:'',companiesName:''},interests:[],profilePhoto:{}}, createdAt: 'now'}];
    getMock.mockResolvedValueOnce({ data });

    const res = await connectionService.getRecentUsers('me');
    expect(getMock).toHaveBeenCalledWith('/connections/recent-users', {
      params: { currentUserId: 'me', limit: 10000 },
    });
    expect(res).toBe(data);
  });

  test('getRecentUsers (custom limit) + error propagation', async () => {
    const { connectionService } = loadService();

    // custom limit success
    getMock.mockResolvedValueOnce({ data: [] });
    await connectionService.getRecentUsers('me', 25);
    expect(getMock).toHaveBeenCalledWith('/connections/recent-users', {
      params: { currentUserId: 'me', limit: 25 },
    });

    // error branch
    const err = new Error('fail');
    getMock.mockRejectedValueOnce(err);
    await expect(connectionService.getRecentUsers('me')).rejects.toThrow('fail');
  });

  test('getSuggestedUsers (default + custom)', async () => {
    const { connectionService } = loadService();

    getMock.mockResolvedValueOnce({ data: [] });
    await connectionService.getSuggestedUsers('me');
    expect(getMock).toHaveBeenCalledWith('/connections/suggested-users', {
      params: { currentUserId: 'me', limit: 10000 },
    });

    getMock.mockResolvedValueOnce({ data: [] });
    await connectionService.getSuggestedUsers('me', 5);
    expect(getMock).toHaveBeenCalledWith('/connections/suggested-users', {
      params: { currentUserId: 'me', limit: 5 },
    });
  });

  test('getSameCityUsers', async () => {
    const { connectionService } = loadService();
    const list = [{ userId: 'u1' }];
    getMock.mockResolvedValueOnce({ data: list });

    const res = await connectionService.getSameCityUsers('me');
    expect(getMock).toHaveBeenCalledWith('/connections/same-city', {
      params: { currentUserId: 'me' },
    });
    expect(res).toBe(list);
  });

  test('getFriends', async () => {
    const { connectionService } = loadService();
    const friends = [{ userId: 'f1' }];
    getMock.mockResolvedValueOnce({ data: friends });

    const res = await connectionService.getFriends('u1');
    expect(getMock).toHaveBeenCalledWith('/connections/friends', {
      params: { currentUserId: 'u1' },
    });
    expect(res).toBe(friends);
  });

  test('createConnectionRequest', async () => {
    const { connectionService } = loadService();
    const body = { toUserId: 'u2', message: 'hi' };
    const response = { id: 'r1', status: 'PENDING' };
    postMock.mockResolvedValueOnce({ data: response });

    const res = await connectionService.createConnectionRequest('u1', body);
    expect(postMock).toHaveBeenCalledWith('/connections/request', body, {
      params: { fromUserId: 'u1' },
    });
    expect(res).toBe(response);
  });

  test('acceptConnectionRequest', async () => {
    const { connectionService } = loadService();
    const response = { id: 'r1', status: 'ACCEPTED' };
    postMock.mockResolvedValueOnce({ data: response });

    const res = await connectionService.acceptConnectionRequest('r1', 'u1');
    expect(postMock).toHaveBeenCalledWith('/connections/accept/r1', null, {
      params: { userId: 'u1' },
    });
    expect(res).toBe(response);
  });

  test('rejectConnectionRequest', async () => {
    const { connectionService } = loadService();
    const response = { id: 'r1', status: 'REJECTED' };
    postMock.mockResolvedValueOnce({ data: response });

    const res = await connectionService.rejectConnectionRequest('r1', 'u1');
    expect(postMock).toHaveBeenCalledWith('/connections/reject/r1', null, {
      params: { userId: 'u1' },
    });
    expect(res).toBe(response);
  });

  test('getConnectionStatus', async () => {
    const { connectionService } = loadService();
    getMock.mockResolvedValueOnce({ data: 'CONNECTED' });

    const res = await connectionService.getConnectionStatus('a', 'b');
    expect(getMock).toHaveBeenCalledWith('/connections/status', {
      params: { fromUserId: 'a', toUserId: 'b' },
    });
    expect(res).toBe('CONNECTED');
  });

  test('getPendingRequests', async () => {
    const { connectionService } = loadService();
    const list = [{ id: 'r1' }];
    getMock.mockResolvedValueOnce({ data: list });

    const res = await connectionService.getPendingRequests('me');
    expect(getMock).toHaveBeenCalledWith('/connections/pending-requests', {
      params: { userId: 'me' },
    });
    expect(res).toBe(list);
  });
});
