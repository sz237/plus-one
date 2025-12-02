/**
 * @file src/.tests/editProfile.test.tsx
 */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const profileServiceMock = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
};

jest.mock('@/services/profileService', () => ({
  profileService: profileServiceMock,
}));

const navigateMock = jest.fn();
jest.mock('react-router-dom', () => {
  const real = jest.requireActual('react-router-dom');
  return {
    ...real,
    useNavigate: () => navigateMock,
  };
});

// Mock Onboarding components and utilities
const mockProfile = {
  gender: 'MALE' as const,
  age: 25,
  location: { city: 'Nashville', state: 'TN', country: 'USA' },
  job: { title: 'Engineer', companiesName: 'Tech Corp' },
  interests: ['coding', 'reading'],
  lookingForRoommate: false,
  profilePhoto: { url: 'https://example.com/photo.jpg' },
  numConnections: 5,
  numRequests: 2,
};

jest.mock('@/pages/Onboarding', () => {
  const real = jest.requireActual('@/pages/Onboarding');
  return {
    ...real,
    normalizeProfile: (p: any) => p || mockProfile,
    normalizeProfileForRequest: (p: any) => p,
    DEFAULT_AVATAR: 'https://example.com/default.jpg',
    DemographicsStep: ({ profile, setProfile }: any) => (
      <div data-testid="demographics-step">
        <input
          data-testid="age-input"
          value={profile.age || ''}
          onChange={(e: any) => setProfile({ ...profile, age: parseInt(e.target.value) || null })}
        />
      </div>
    ),
    CareerStep: ({ profile, setProfile }: any) => (
      <div data-testid="career-step">
        <input
          data-testid="job-title-input"
          value={profile.job.title}
          onChange={(e: any) =>
            setProfile({ ...profile, job: { ...profile.job, title: e.target.value } })
          }
        />
      </div>
    ),
    InterestsStep: ({ profile, toggleInterest, customInterest, setCustomInterest, addCustomInterest }: any) => (
      <div data-testid="interests-step">
        <input
          data-testid="custom-interest-input"
          value={customInterest}
          onChange={(e: any) => setCustomInterest(e.target.value)}
        />
        <button data-testid="add-interest-btn" onClick={addCustomInterest}>
          Add
        </button>
        {profile.interests.map((i: string) => (
          <button key={i} data-testid={`interest-${i}`} onClick={() => toggleInterest(i)}>
            {i}
          </button>
        ))}
      </div>
    ),
    PhotoStep: ({ photoPreview, handleUpload, resetToDefault }: any) => (
      <div data-testid="photo-step">
        <img src={photoPreview} alt="preview" data-testid="photo-preview" />
        <input
          type="file"
          data-testid="photo-upload"
          onChange={(e: any) => handleUpload(e.target.files?.[0] || null)}
        />
        <button data-testid="reset-photo-btn" onClick={resetToDefault}>
          Reset
        </button>
      </div>
    ),
  };
});

import EditProfile from '@/pages/EditProfile';

describe('EditProfile page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const mockUser = {
    userId: 'u1',
    email: 'user@vanderbilt.edu',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockProfileResponse = {
    userId: 'u1',
    firstName: 'John',
    lastName: 'Doe',
    connectionsCount: 5,
    requestsCount: 2,
    postsCount: 3,
    posts: [],
    profile: mockProfile,
    onboarding: { completed: true, step: 4 },
  };

  it('redirects to login if no user is logged in', () => {
    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('loads and displays existing profile', async () => {
    localStorage.setItem('user', JSON.stringify(mockUser));
    profileServiceMock.getProfile.mockResolvedValueOnce(mockProfileResponse);

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    expect(profileServiceMock.getProfile).toHaveBeenCalledWith('u1');
    await waitFor(() => {
      expect(screen.getByText(/edit your profile/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('demographics-step')).toBeInTheDocument();
    expect(screen.getByTestId('career-step')).toBeInTheDocument();
    expect(screen.getByTestId('interests-step')).toBeInTheDocument();
    expect(screen.getByTestId('photo-step')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    localStorage.setItem('user', JSON.stringify(mockUser));
    profileServiceMock.getProfile.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading your profile/i)).toBeInTheDocument();
  });

  it('displays error message when profile fails to load', async () => {
    localStorage.setItem('user', JSON.stringify(mockUser));
    profileServiceMock.getProfile.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('saves profile changes successfully', async () => {
    localStorage.setItem('user', JSON.stringify(mockUser));
    profileServiceMock.getProfile.mockResolvedValueOnce(mockProfileResponse);
    profileServiceMock.updateProfile.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/edit your profile/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(profileServiceMock.updateProfile).toHaveBeenCalledWith('u1', {
        profile: expect.objectContaining({
          job: expect.objectContaining({ title: 'Engineer' }),
        }),
        step: 4,
        completed: true,
      });
    });

    expect(navigateMock).toHaveBeenCalledWith('/myPage', { replace: true });
  });

  it('shows error when save fails', async () => {
    localStorage.setItem('user', JSON.stringify(mockUser));
    profileServiceMock.getProfile.mockResolvedValueOnce(mockProfileResponse);
    profileServiceMock.updateProfile.mockRejectedValueOnce(new Error('Save failed'));

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/edit your profile/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/save failed/i)).toBeInTheDocument();
    });

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('cancels and navigates back to myPage', async () => {
    localStorage.setItem('user', JSON.stringify(mockUser));
    profileServiceMock.getProfile.mockResolvedValueOnce(mockProfileResponse);

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/edit your profile/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(navigateMock).toHaveBeenCalledWith('/myPage');
  });
});

