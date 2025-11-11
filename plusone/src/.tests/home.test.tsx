/**
 * @file src/.tests/home.test.tsx
 */
import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';

// --- Mocks ---
const getSuggestedUsers = jest.fn();
const getFriends = jest.fn();

jest.mock('@/services/connectionService', () => ({
  connectionService: {
    getSuggestedUsers: (...args: any[]) => getSuggestedUsers(...args),
    getFriends: (...args: any[]) => getFriends(...args),
  },
}));

// Mock Sidebar to avoid layout/portal complexity
jest.mock('@/components/Sidebar', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="sidebar" data-open={isOpen} />
  ),
}));

/**
 * We want to verify the props passed to UserProfileCard, and be able to
 * trigger onConnectionUpdate. This mock renders the user's name and an
 * "Update" button that calls onConnectionUpdate.
 */
const userProfileCardSpy = jest.fn();
jest.mock('@/components/UserProfileCard', () => ({
  __esModule: true,
  default: (props: any) => {
    userProfileCardSpy(props);
    const { user, onConnectionUpdate } = props;
    return (
      <div data-testid="user-card">
        <div>{user.firstName} {user.lastName}</div>
        <button
          type="button"
          onClick={() => onConnectionUpdate && onConnectionUpdate()}
        >
          Trigger Update
        </button>
      </div>
    );
  },
}));

import Home from '@/pages/Home';

// Helpers
const setUser = (u?: any) => {
  if (u) localStorage.setItem('user', JSON.stringify(u));
  else localStorage.removeItem('user');
};

const SAMPLES = {
  me: { userId: 'u0', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@vanderbilt.edu' },
  suggestions: [
    {
      userId: 'u1',
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      profile: {
        gender: null,
        age: null,
        location: { city: 'Arlington', state: 'VA', country: 'US' },
        job: { title: 'Scientist', companiesName: 'Navy' },
        interests: ['COBOL', 'Compilers'],
        profilePhoto: { url: 'https://img/u1.png' },
      },
      createdAt: new Date().toISOString(),
    },
    {
      userId: 'u2',
      firstName: 'Katherine',
      lastName: 'Johnson',
      email: 'kat@example.com',
      profile: {
        gender: null,
        age: null,
        location: { city: 'White Sulphur Springs', state: 'WV', country: 'US' },
        job: { title: 'Mathematician', companiesName: 'NASA' },
        interests: ['Orbital mechanics'],
        profilePhoto: { url: 'https://img/u2.png' },
      },
      createdAt: new Date().toISOString(),
    },
  ],
  friends: [
    {
      userId: 'u3',
      firstName: 'Alan',
      lastName: 'Turing',
      email: 'alan@example.com',
      profile: {
        gender: null,
        age: null,
        location: { city: 'Manchester', state: 'N/A', country: 'UK' },
        job: { title: 'Researcher', companiesName: 'NPL' },
        interests: ['Cryptanalysis'],
        profilePhoto: { url: 'https://img/u3.png' },
      },
      createdAt: new Date().toISOString(),
    },
  ],
};

describe('Home page', () => {
  const consoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // silence expected error logs in failure tests
    // (keep reference to restore after)
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = consoleError;
  });

  it('shows loading spinner first, then renders suggestions and friends', async () => {
    setUser(SAMPLES.me);
    getSuggestedUsers.mockResolvedValueOnce(SAMPLES.suggestions);
    getFriends.mockResolvedValueOnce(SAMPLES.friends);

    render(<Home />);

    // Initial loading UI
    expect(screen.getByText(/loading users/i)).toBeInTheDocument();
    // After the effects resolve, lists should show
    await waitFor(() => {
      expect(getSuggestedUsers).toHaveBeenCalledWith('u0');
      expect(getFriends).toHaveBeenCalledWith('u0');
    });

    // Greeting uses first name
    expect(screen.getByText(/hi ada, welcome to plusone/i)).toBeInTheDocument();

    // Two suggestion cards + one friend card rendered by our mock
    const cards = screen.getAllByTestId('user-card');
    expect(cards).toHaveLength(3);

    // Sidebar initially closed
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveAttribute('data-open', 'false');
  });

  it('hamburger toggles Sidebar open/closed and updates aria attributes', async () => {
    setUser(SAMPLES.me);
    getSuggestedUsers.mockResolvedValueOnce([]);
    getFriends.mockResolvedValueOnce([]);

    render(<Home />);

    // Wait for loading to finish
    await waitFor(() => expect(screen.queryByText(/loading users/i)).not.toBeInTheDocument());

    const button = screen.getByRole('button', { name: /toggle navigation/i });
    const sidebar = screen.getByTestId('sidebar');

    // Closed
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(sidebar).toHaveAttribute('data-open', 'false');

    // Open
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(sidebar).toHaveAttribute('data-open', 'true');

    // Close
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(sidebar).toHaveAttribute('data-open', 'false');
  });

  it('renders an empty suggestions message when there are none', async () => {
    setUser(SAMPLES.me);
    getSuggestedUsers.mockResolvedValueOnce([]); // no suggestions
    getFriends.mockResolvedValueOnce([]); // no friends

    render(<Home />);

    await waitFor(() => {
      expect(getSuggestedUsers).toHaveBeenCalledTimes(1);
      expect(getFriends).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByText(/you are already friends with everyone on the platform/i)
    ).toBeInTheDocument();

    // No friend section at all (since empty)
    expect(screen.queryByText(/your connections/i)).not.toBeInTheDocument();
  });

  it('partial failure: suggestions succeed, friends fail (no error banner)', async () => {
    setUser(SAMPLES.me);
    getSuggestedUsers.mockResolvedValueOnce(SAMPLES.suggestions);
    getFriends.mockRejectedValueOnce(new Error('friends down'));

    render(<Home />);

    await waitFor(() => {
      expect(getSuggestedUsers).toHaveBeenCalledTimes(1);
      expect(getFriends).toHaveBeenCalledTimes(1);
    });

    // No global error banner since at least one loaded
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Suggestions rendered
    const cards = screen.getAllByTestId('user-card');
    expect(cards).toHaveLength(2);

    // Friends section absent
    expect(screen.queryByText(/your connections/i)).not.toBeInTheDocument();
  });

  it('total failure: both lists fail -> show alert', async () => {
    setUser(SAMPLES.me);
    getSuggestedUsers.mockRejectedValueOnce(new Error('suggestions down'));
    getFriends.mockRejectedValueOnce(new Error('friends down'));

    render(<Home />);

    await waitFor(() => {
      expect(getSuggestedUsers).toHaveBeenCalledTimes(1);
      expect(getFriends).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByRole('alert', { name: '' })
    ).toHaveTextContent(/failed to load users/i);
  });

  it('clicking "Trigger Update" on a card calls loadUsers again (refetches)', async () => {
    setUser(SAMPLES.me);
    // First load
    getSuggestedUsers
      .mockResolvedValueOnce(SAMPLES.suggestions) // initial
      .mockResolvedValueOnce([]);                // after update
    getFriends
      .mockResolvedValueOnce(SAMPLES.friends)    // initial
      .mockResolvedValueOnce([]);                // after update

    render(<Home />);

    await waitFor(() => {
      expect(getSuggestedUsers).toHaveBeenCalledTimes(1);
      expect(getFriends).toHaveBeenCalledTimes(1);
    });

    // We rendered 3 cards (2 suggestions + 1 friend)
    const firstUpdateBtn = screen.getAllByRole('button', { name: /trigger update/i })[0];
    await act(async () => {
      fireEvent.click(firstUpdateBtn);
    });

    // Should refetch
    await waitFor(() => {
      expect(getSuggestedUsers).toHaveBeenCalledTimes(2);
      expect(getFriends).toHaveBeenCalledTimes(2);
    });

    // After second fetch, both lists empty -> shows empty suggestions message, no friends header
    expect(
      screen.getByText(/you are already friends with everyone on the platform/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/your connections/i)).not.toBeInTheDocument();
  });

  it('passes currentUserId and isFriend correctly to UserProfileCard (via mock spy)', async () => {
    setUser(SAMPLES.me);
    getSuggestedUsers.mockResolvedValueOnce(SAMPLES.suggestions);
    getFriends.mockResolvedValueOnce(SAMPLES.friends);

    render(<Home />);

    await waitFor(() => {
      expect(getSuggestedUsers).toHaveBeenCalled();
      expect(getFriends).toHaveBeenCalled();
    });

    // userProfileCardSpy was called for each card; inspect a couple calls
    // Find the call for a suggestion (no isFriend)
    const suggestionCall = userProfileCardSpy.mock.calls.find(
      ([props]) => props.user?.userId === 'u1'
    );
    expect(suggestionCall).toBeTruthy();
    expect(suggestionCall[0].currentUserId).toBe('u0');
    expect(suggestionCall[0].isFriend).toBeUndefined();

    // Friend call has isFriend === true
    const friendCall = userProfileCardSpy.mock.calls.find(
      ([props]) => props.user?.userId === 'u3'
    );
    expect(friendCall).toBeTruthy();
    expect(friendCall[0].currentUserId).toBe('u0');
    expect(friendCall[0].isFriend).toBe(true);
  });

  it('shows a generic username if localStorage user is missing', async () => {
    // no user
    setUser(undefined);

    // Even though Home won’t call loadUsers without a user,
    // make sure the greeting falls back to "User"
    render(<Home />);
    expect(screen.getByText(/hi user, welcome to plusone/i)).toBeInTheDocument();
  });
});