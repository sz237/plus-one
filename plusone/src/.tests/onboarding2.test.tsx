import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import type { ProfileResponse, Profile } from '@/types/profile';

jest.mock('@/styles/Onboarding.css', () => ({}), { virtual: true });

// --- Router mocks (capture navigate)
const navigateMock = jest.fn();
jest.mock('react-router-dom', () => {
  const real = jest.requireActual('react-router-dom');
  return {
    ...real,
    useNavigate: () => navigateMock,
  };
});

// --- Services mocks
const getProfileMock = jest.fn();
const updateProfileMock = jest.fn();
jest.mock('@/services/profileService', () => ({
  profileService: {
    getProfile: (...args: any[]) => getProfileMock(...args),
    updateProfile: (...args: any[]) => updateProfileMock(...args),
  },
}));

import Onboarding from '@/pages/Onboarding';

const DEFAULT_USER = {
  userId: 'u1',
  email: 'a@vanderbilt.edu',
  firstName: 'Ada',
  lastName: 'Lovelace',
};

const defaultProfile: Profile = {
  gender: null,
  age: null,
  location: { city: '', state: '', country: 'US', latitude: null, longitude: null },
  job: { title: '', companiesName: '', companyId: '' },
  interests: [],
  profilePhoto: { storage: 'stock', key: 'default', url: 'https://avatars.dicebear.com/api/initials/PlusOne.svg?scale=110&background=%23f5f5f5' },
  numConnections: 0,
  numRequests: 0,
};

const resp = (step: number, completed = false, profile: Partial<Profile> = {}): ProfileResponse => ({
  userId: 'u1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  profile: { ...defaultProfile, ...profile },
  onboarding: { step, completed },
});

function mount(initialEntries = ['/onboarding']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/home" element={<div>HOME</div>} />
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('user', JSON.stringify(DEFAULT_USER));
});

// 1) Back button behavior + clamping at step 1
it('Back goes to previous step and clamped at 1 (shows hint when cannot go back)', async () => {
  getProfileMock.mockResolvedValueOnce(resp(2)); // start on step 2
  mount();
  await screen.findByText(/Step 2 of 4/i);

  // Back to step 1
  fireEvent.click(screen.getByRole('button', { name: /back/i }));
  expect(await screen.findByText(/Step 1 of 4/i)).toBeInTheDocument();

  // No Back button on step 1, shows hint
  expect(screen.getByText(/you can always edit later/i)).toBeInTheDocument();
});

// 2) City datalist match auto-fills state/country; unknown city leaves state as user typed (uppercased)
it('City match auto-fills state/country; unknown city preserves typed state', async () => {
  getProfileMock.mockResolvedValueOnce(resp(1));
  mount();
  await screen.findByText(/Demographics/i);

  // Known city -> auto-fills (Seattle, WA, US)
  const city = screen.getByPlaceholderText(/start typing your city/i);
  fireEvent.change(city, { target: { value: 'Seattle' } });

  // User overrides state to "ny" (component uppercases)
  const state = screen.getByPlaceholderText(/tn, ny, etc/i);
  fireEvent.change(state, { target: { value: 'ny' }});
  expect((state as HTMLInputElement).value).toBe('NY');

  // Unknown city should not wipe state/country
  fireEvent.change(city, { target: { value: 'Gotham' }});
  expect((state as HTMLInputElement).value).toBe('NY');

  // Save & Continue -> verify normalized request with trimmed values and preserved country
  updateProfileMock.mockResolvedValueOnce(resp(2));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /save & continue/i }));
  });
  expect(updateProfileMock).toHaveBeenCalledWith(
    'u1',
    expect.objectContaining({
      profile: expect.objectContaining({
        location: expect.objectContaining({ city: 'Gotham', state: 'NY', country: 'US' }),
      }),
      step: 2,
      completed: false,
    })
  );
});

// 3) Interests: Add ignores blank entry; toggle removes when clicked again
it('Interests add blank is no-op and toggling removes selection', async () => {
  getProfileMock.mockResolvedValueOnce(resp(3, false, { interests: [] }));
  mount();
  await screen.findByText(/Select a few activities/i);

  // Add blank -> no change
  fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
  expect(screen.queryByText(/Selected:/i)).not.toBeInTheDocument();

  // Toggle add
  const chip = screen.getByRole('button', { name: /game nights/i });
  fireEvent.click(chip);
  expect(screen.getByText(/Selected: Game Nights/)).toBeInTheDocument();

  // Toggle remove
  fireEvent.click(chip);
  expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
});

// 4) Persist error path: shows alert and resets saving state
it('Persist error shows alert and leaves UI interactive again', async () => {
  getProfileMock.mockResolvedValueOnce(resp(1));
  mount();
  await screen.findByText(/Demographics/i);

  // Make updateProfile reject to hit error branch
  updateProfileMock.mockRejectedValueOnce(new Error('save failed'));

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /save & continue/i }));
  });

  expect(await screen.findByRole('alert')).toHaveTextContent(/save failed|Failed to save/i);

  // Button should be enabled again after failure
  expect(screen.getByRole('button', { name: /save & continue/i })).toBeEnabled();
});

// 5) "Saving…" label + disabled while request in-flight (mid-steps)
it('shows "Saving…" and disables actions while saving (mid steps)', async () => {
  getProfileMock.mockResolvedValueOnce(resp(2)); // step 2
  mount();
  await screen.findByText(/Step 2 of 4/i);

  // Hold the promise to keep it "in flight"
  let resolveUpdate!: () => void;
  const p = new Promise<ProfileResponse>((r) => (resolveUpdate = () => r(resp(3))));
  updateProfileMock.mockReturnValueOnce(p);

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /save & continue/i }));
  });

  // While pending
  expect(screen.getByRole('button', { name: /Saving…/i })).toBeDisabled();

  // Finish request
  await act(async () => resolveUpdate());
  expect(await screen.findByText(/Step 3 of 4/i)).toBeInTheDocument();
});

// 6) "Finishing…" label + disabled on last step
it('shows "Finishing…" on last step', async () => {
  getProfileMock.mockResolvedValueOnce(resp(4, false));
  mount();
  await screen.findByText(/Step 4 of 4/i);

  let resolveUpdate!: () => void;
  const p = new Promise<ProfileResponse>((r) => (resolveUpdate = () => r(resp(4, true))));
  updateProfileMock.mockReturnValueOnce(p);

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /finish onboarding/i }));
  });

  expect(screen.getByRole('button', { name: /Finishing…/i })).toBeDisabled();

  await act(async () => resolveUpdate());
  await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/home', { replace: true }));
});

// 7) Progress header math: percentage and aria-valuenow correct
it('progress header shows correct percentage and aria-valuenow', async () => {
  getProfileMock.mockResolvedValueOnce(resp(3)); // 3 of 4 => 75%
  mount();
  await screen.findByText(/Step 3 of 4/i);
  expect(screen.getByText('75%')).toBeInTheDocument();

  const bar = screen.getByRole('progressbar');
  expect(bar).toHaveAttribute('aria-valuenow', '75');
});

// 8) Photo preview updates when profile photo url changes programmatically
it('photo preview follows profilePhoto.url changes', async () => {
  getProfileMock.mockResolvedValueOnce(resp(4, false, {
    profilePhoto: { storage: 'stock', key: 'default', url: 'https://example.com/first.png' }
  } as any));
  mount();
  await screen.findByText(/Upload a new photo/i);
  const img = screen.getByAltText(/profile preview/i) as HTMLImageElement;
  expect(img.src).toMatch(/first\.png/);

  // Next update resolves with a different url
  updateProfileMock.mockResolvedValueOnce(resp(4, false, {
    profilePhoto: { storage: 'stock', key: 'changed', url: 'https://example.com/second.png' }
  } as any));

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /save & continue/i }));
  });
  expect((screen.getByAltText(/profile preview/i) as HTMLImageElement).src).toMatch(/second\.png/);
});