import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import type { ProfileResponse, Profile } from '@/types/profile';

// Optional: belt-and-suspenders for CSS (jest.config maps CSS already)
jest.mock('@/styles/Onboarding.css', () => ({}), { virtual: true });

// ---- Mocks (MUST be before importing Onboarding) ----
const navigateMock = jest.fn();
jest.mock('react-router-dom', () => {
  const real = jest.requireActual('react-router-dom');
  return {
    ...real,
    useNavigate: () => navigateMock,
  };
});

const getProfileMock = jest.fn();
const updateProfileMock = jest.fn();
jest.mock('@/services/profileService', () => ({
  profileService: {
    getProfile: (...args: any[]) => getProfileMock(...args),
    updateProfile: (...args: any[]) => updateProfileMock(...args),
  },
}));

// Now import the component-under-test AFTER mocks
import Onboarding from '@/pages/Onboarding';

// ---- FileReader mock for photo upload ----
class MockFileReader {
  public onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  public result: string | ArrayBuffer | null = null;
  readAsDataURL(_file: File) {
    this.result = 'data:image/png;base64,FAKE';
    if (this.onload) {
      // @ts-ignore
      this.onload({});
    }
  }
}
Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: MockFileReader,
});

const DEFAULT_USER = {
  userId: 'u1',
  email: 'a@vanderbilt.edu',
  firstName: 'Ada',
  lastName: 'Lovelace',
};

const baseProfile: Profile = {
  gender: null,
  age: null,
  location: { city: '', state: '', country: 'US', latitude: null, longitude: null },
  job: { title: '', companiesName: '', companyId: '' },
  interests: [],
  profilePhoto: { storage: 'stock', key: 'default', url: 'https://avatars.dicebear.com/api/initials/PlusOne.svg?scale=110&background=%23f5f5f5' },
  numConnections: 0,
  numRequests: 0,
};

const pendingResp: ProfileResponse = {
  userId: 'u1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  profile: baseProfile,
  onboarding: { step: 1, completed: false },
};

const completedResp: ProfileResponse = {
  userId: 'u1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  profile: baseProfile,
  onboarding: { step: 4, completed: true },
};

function withRouter(ui: React.ReactNode, initialEntries = ['/onboarding']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/onboarding" element={ui} />
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
        <Route path="/home" element={<div>HOME PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Onboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('redirects to /login when no user in localStorage', async () => {
    withRouter(<Onboarding />);
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('loads initial profile and shows step 1 UI', async () => {
    localStorage.setItem('user', JSON.stringify(DEFAULT_USER));
    getProfileMock.mockResolvedValueOnce(pendingResp);

    withRouter(<Onboarding />);

    expect(await screen.findByText(/loading your onboarding/i)).toBeInTheDocument();
    await screen.findByText(/welcome, ada!/i);
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
    expect(screen.getByText(/demographics/i)).toBeInTheDocument();
    expect(screen.getByText(/gender/i)).toBeInTheDocument();
    expect(screen.getByText(/age/i)).toBeInTheDocument();
    expect(screen.getByText(/city/i)).toBeInTheDocument();
  });

  it('shows error when getProfile fails', async () => {
    localStorage.setItem('user', JSON.stringify(DEFAULT_USER));
    getProfileMock.mockRejectedValueOnce(new Error('boom'));

    withRouter(<Onboarding />);

    expect(await screen.findByText(/loading your onboarding/i)).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(/boom|failed to load profile/i);
  });

  it('handleNext saves and advances step (not completed)', async () => {
    localStorage.setItem('user', JSON.stringify(DEFAULT_USER));
    getProfileMock.mockResolvedValueOnce(pendingResp);
    updateProfileMock.mockResolvedValueOnce({
      ...pendingResp,
      onboarding: { step: 2, completed: false },
    } satisfies ProfileResponse);

    withRouter(<Onboarding />);
    await screen.findByText(/demographics/i);

    const btn = screen.getByRole('button', { name: /save & continue/i });
    await act(async () => fireEvent.click(btn));

    expect(updateProfileMock).toHaveBeenCalledWith('u1', expect.objectContaining({
      step: 2,
      completed: false,
      profile: expect.any(Object),
    }));
    expect(await screen.findByText(/career/i)).toBeInTheDocument();
    expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument();
  });

  it('handleFinish saves and navigates to /home when completed', async () => {
    localStorage.setItem('user', JSON.stringify(DEFAULT_USER));
    getProfileMock.mockResolvedValueOnce({ ...pendingResp, onboarding: { step: 4, completed: false } });
    updateProfileMock.mockResolvedValueOnce(completedResp);

    withRouter(<Onboarding />);
    await screen.findByText(/step 4 of 4/i);

    await act(async () => fireEvent.click(screen.getByRole('button', { name: /finish onboarding/i })));

    expect(updateProfileMock).toHaveBeenCalledWith('u1', expect.objectContaining({ step: 4, completed: true }));
    expect(navigateMock).toHaveBeenCalledWith('/home', { replace: true });
  });

  it('completed response during hydrate navigates to /home immediately', async () => {
    localStorage.setItem('user', JSON.stringify(DEFAULT_USER));
    getProfileMock.mockResolvedValueOnce(completedResp);

    withRouter(<Onboarding />);
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/home', { replace: true });
    });
  });

  it('demographics: gender/age/city/state/country changes update profile', async () => {
    localStorage.setItem('user', JSON.stringify(DEFAULT_USER));
    getProfileMock.mockResolvedValueOnce(pendingResp);

    withRouter(<Onboarding />);
    await screen.findByText(/demographics/i);

    fireEvent.change(screen.getByLabelText(/gender/i).closest('select')!, { target: { value: 'FEMALE' }});
    fireEvent.change(screen.getByLabelText(/age/i).closest('select')!, { target: { value: '22' }});
    const cityInput = screen.getByPlaceholderText(/start typing your city/i);
    fireEvent.change(cityInput, { target: { value: 'Nashville' }});
    const stateInput = screen.getByPlaceholderText(/tn, ny, etc/i);
    fireEvent.change(stateInput, { target: { value: 'ny' }});
    expect((stateInput as HTMLInputElement).value).toBe('NY');
    fireEvent.change(screen.getByLabelText(/country/i).closest('select')!, { target: { value: 'CA' }});

    updateProfileMock.mockResolvedValueOnce({
      ...pendingResp,
      profile: {
        ...baseProfile,
        gender: 'FEMALE',
        age: 22,
        location: { city: 'Nashville', state: 'NY', country: 'CA', latitude: null, longitude: null },
      } as Profile,
      onboarding: { step: 2, completed: false },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save & continue/i }));
    });

    expect(updateProfileMock).toHaveBeenCalledWith('u1', expect.objectContaining({
      profile: expect.objectContaining({
        gender: 'FEMALE',
        age: 22,
        location: expect.objectContaining({ city: 'Nashville', state: 'NY', country: 'CA' }),
      }),
    }));
  });

  it('career: title/company/companyId updates', async () => {
    localStorage.setItem('user', JSON.stringify(DEFAULT_USER));
    getProfileMock.mockResolvedValueOnce({ ...pendingResp, onboarding: { step: 2, completed: false } });

    withRouter(<Onboarding />);
    await screen.findByText(/career/i);

    fireEvent.change(screen.getByPlaceholderText(/software engineer/i), { target: { value: 'SWE' }});
    fireEvent.change(screen.getByPlaceholderText(/search or type your company/i), { target: { value: 'Vanderbilt University' }});
    fireEvent.change(screen.getByPlaceholderText(/internal identifier/i), { target: { value: '42' }});

    updateProfileMock.mockResolvedValueOnce({ ...pendingResp, onboarding: { step: 3, completed: false } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save & continue/i }));
    });

    expect(updateProfileMock).toHaveBeenCalledWith('u1', expect.objectContaining({
      profile: expect.objectContaining({
        job: expect.objectContaining({
          title: 'SWE',
          companiesName: 'Vanderbilt University',
          companyId: '42',
        }),
      }),
      step: 3,
      completed: false,
    }));
  });

  it('interests: toggle built-in + add custom interest', async () => {
    localStorage.setItem('user', JSON.stringify(DEFAULT_USER));
    getProfileMock.mockResolvedValueOnce({ ...pendingResp, onboarding: { step: 3, completed: false } });

    withRouter(<Onboarding />);
    await screen.findByText(/select a few activities/i);

    fireEvent.click(screen.getByRole('button', { name: /game nights/i }));
    fireEvent.click(screen.getByRole('button', { name: /coffee chats/i }));

    const custom = screen.getByPlaceholderText(/intramural ultimate frisbee/i);
    fireEvent.change(custom, { target: { value: 'Chess' }});
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    updateProfileMock.mockResolvedValueOnce({
      ...pendingResp,
      profile: { ...baseProfile, interests: ['Game Nights', 'Coffee Chats', 'Chess'] } as Profile,
      onboarding: { step: 4, completed: false },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save & continue/i }));
    });

    expect(updateProfileMock).toHaveBeenCalledWith('u1', expect.objectContaining({
      profile: expect.objectContaining({
        interests: expect.arrayContaining(['Game Nights', 'Coffee Chats', 'Chess']),
      }),
      step: 4,
    }));
  });

  it('photo: upload via FileReader and reset to default', async () => {
    localStorage.setItem('user', JSON.stringify(DEFAULT_USER));
    getProfileMock.mockResolvedValueOnce({ ...pendingResp, onboarding: { step: 4, completed: false } });

    withRouter(<Onboarding />);
    await screen.findByText(/upload a new photo/i);

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText(/upload a new photo/i).parentElement!.querySelector('input[type="file"]')!;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } as any });
    });

    updateProfileMock.mockResolvedValueOnce({
      ...pendingResp,
      onboarding: { step: 4, completed: false },
      profile: {
        ...baseProfile,
        profilePhoto: { storage: 'inline-base64', key: expect.any(String), url: 'data:image/png;base64,FAKE' },
      } as Profile,
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save & continue/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /use stock image/i }));
    });

    updateProfileMock.mockResolvedValueOnce(completedResp);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /finish onboarding/i }));
    });

    expect(navigateMock).toHaveBeenCalledWith('/home', { replace: true });
  });
});