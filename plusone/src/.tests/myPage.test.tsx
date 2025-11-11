/**
 * @file src/.tests/MyPage.test.tsx
 */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';

const postServiceMock = {
  getProfile: jest.fn(),
  remove: jest.fn(),
};
const connectionServiceMock = {
  getPendingRequests: jest.fn(),
  acceptConnectionRequest: jest.fn(),
  rejectConnectionRequest: jest.fn(),
};
jest.mock('@/services/postService', () => ({ postService: postServiceMock }));
jest.mock('@/services/connectionService', () => ({ connectionService: connectionServiceMock }));

jest.mock('@/components/Sidebar', () => ({
  __esModule: true,
  default: () => <div data-testid="sidebar" />,
}));

const navigateMock = jest.fn();
jest.mock('react-router-dom', () => {
  const real = jest.requireActual('react-router-dom');
  return {
    ...real,
    useNavigate: () => navigateMock,
  };
});

import MyPage from '@/pages/MyPage';

const setUser = (user?: unknown) => {
  if (user) localStorage.setItem('user', JSON.stringify(user));
  else localStorage.removeItem('user');
};

const baseProfileResponse = {
  userId: 'u1',
  firstName: 'A',
  lastName: 'B',
  connectionsCount: 2,
  requestsCount: 1,
  postsCount: 1,
  posts: [
    {
      id: 'p1',
      userId: 'u1',
      title: 'Hello',
      description: 'World',
      category: 'Other',
      createdAt: new Date().toISOString(),
    },
  ],
};

const pendingRequests = [
  { id: 'r1', fromUserId: 'u2', toUserId: 'u1', message: 'connect?', createdAt: new Date().toISOString(), status: 'pending' },
];

describe('MyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('shows not logged in when no user in localStorage', () => {
    setUser(undefined);
    render(
      <MemoryRouter>
        <MyPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/you’re not logged in/i)).toBeInTheDocument();
  });

  it('loads profile & requests; allows ACCEPT and delete', async () => {
    setUser({ userId: 'u1' });

    // initial load returns 1 pending request
    postServiceMock.getProfile.mockResolvedValueOnce(baseProfileResponse);
    connectionServiceMock.getPendingRequests.mockResolvedValueOnce(pendingRequests);

    render(
      <MemoryRouter>
        <MyPage />
      </MemoryRouter>
    );

    // let effects settle
    await act(async () => {});

    // UI shows data
    expect(screen.getByText(/a b/i)).toBeInTheDocument();
    expect(screen.getByText(/connection requests/i)).toBeInTheDocument();

    // ACCEPT flow
    const acceptBtn = screen.getByRole('button', { name: /accept/i });
    connectionServiceMock.acceptConnectionRequest.mockResolvedValueOnce({});
    // after accept, component reloads requests -> empty
    postServiceMock.getProfile.mockResolvedValueOnce({ ...baseProfileResponse, connectionsCount: 3, requestsCount: 0 });
    connectionServiceMock.getPendingRequests.mockResolvedValueOnce([]);

    await act(async () => {
      fireEvent.click(acceptBtn);
    });

    await waitFor(() =>
      expect(connectionServiceMock.acceptConnectionRequest).toHaveBeenCalledWith('r1', 'u1')
    );
    // list is now empty
    expect(screen.getByText(/no pending connection requests/i)).toBeInTheDocument();

    // DELETE a post
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteBtn = screen.getAllByTitle(/delete/i)[0];

    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    expect(confirmSpy).toHaveBeenCalled();
    expect(postServiceMock.remove).toHaveBeenCalledWith('p1');
    confirmSpy.mockRestore();
  });

  it('loads profile & requests; allows REJECT', async () => {
    setUser({ userId: 'u1' });

    // fresh mount with a pending request
    postServiceMock.getProfile.mockResolvedValueOnce(baseProfileResponse);
    connectionServiceMock.getPendingRequests.mockResolvedValueOnce(pendingRequests);

    render(
      <MemoryRouter>
        <MyPage />
      </MemoryRouter>
    );

    await act(async () => {});

    // ensure we have the request visible
    expect(screen.getByText(/connection requests/i)).toBeInTheDocument();
    // REJECT flow
    connectionServiceMock.rejectConnectionRequest.mockResolvedValueOnce({});
    // after reject, component reloads -> no requests
    postServiceMock.getProfile.mockResolvedValueOnce(baseProfileResponse);
    connectionServiceMock.getPendingRequests.mockResolvedValueOnce([]);

    const denyBtn = screen.getByRole('button', { name: /deny/i });
    await act(async () => {
      fireEvent.click(denyBtn);
    });

    await waitFor(() =>
      expect(connectionServiceMock.rejectConnectionRequest).toHaveBeenCalledWith('r1', 'u1')
    );
    expect(screen.getByText(/no pending connection requests/i)).toBeInTheDocument();
  });
});