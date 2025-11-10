import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfileCard from '@/components/UserProfileCard';

const getStatusMock = jest.fn();
jest.mock('@/services/connectionService', () => ({
  connectionService: {
    getConnectionStatus: (...args: any[]) => getStatusMock(...args),
  },
}));

// TIP: If the full ConnectPopup UI is heavy for your runner, you can stub it:
// jest.mock('@/components/ConnectPopup', () => () => <div data-testid="connect-popup" />);

const user = {
  userId: 'u2',
  firstName: 'Grace',
  lastName: 'Hopper',
  email: 'g@v.edu',
  profile: {
    gender: null,
    age: null,
    location: { city: 'NYC', state: 'NY', country: 'US' },
    job: { title: 'Eng', companiesName: 'Navy' },
    interests: ['Art & Museums', 'Game Nights', 'Coffee Chats', 'Sports & Intramurals'],
    profilePhoto: { url: '' },
  },
  createdAt: '2025-01-01',
};

describe('UserProfileCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads status and shows proper button text/styles', async () => {
    getStatusMock.mockResolvedValueOnce('CONNECT');
    render(<UserProfileCard user={user as any} currentUserId="u1" onConnectionUpdate={jest.fn()} />);

    await waitFor(() => expect(getStatusMock).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();

    // click connect → opens popup (since we didn’t stub, it renders real component)
    fireEvent.click(screen.getByRole('button', { name: /connect/i }));
    expect(screen.getByText(/connect with grace hopper/i)).toBeInTheDocument();
  });

  it('handles FRIENDS/PENDING states', async () => {
    getStatusMock.mockResolvedValueOnce('FRIENDS');
    const { rerender } = render(<UserProfileCard user={user as any} currentUserId="u1" onConnectionUpdate={jest.fn()} />);
    await screen.findByRole('button', { name: /friends/i });

    getStatusMock.mockResolvedValueOnce('PENDING');
    rerender(<UserProfileCard user={{ ...user, userId: 'u3' } as any} currentUserId="u1" onConnectionUpdate={jest.fn()} />);
    await screen.findByRole('button', { name: /pending/i });
  });
});