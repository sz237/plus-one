/**
 * @file src/.tests/Login.test.tsx
 */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';

const authServiceMock = { login: jest.fn() };
const profileServiceMock = { getProfile: jest.fn() };

jest.mock('@/services/authService', () => ({ authService: authServiceMock }));
jest.mock('@/services/profileService', () => ({ profileService: profileServiceMock }));

const navigateMock = jest.fn();
jest.mock('react-router-dom', () => {
  const real = jest.requireActual('react-router-dom');
  return {
    ...real,
    useNavigate: () => navigateMock,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

import Login from '@/pages/Login';

describe('Login page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const fillAndSubmit = (email = 'user@vanderbilt.edu', password = 'secret') => {
    fireEvent.change(screen.getByPlaceholderText(/^email$/i), { target: { value: email } });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: password } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
  };

  it('requires both fields', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    // submit without filling
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
  });

  it('successful login with onboarding completed -> navigates to /home', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    authServiceMock.login.mockResolvedValueOnce({
      message: 'Login successful',
      userId: 'u1',
      email: 'user@vanderbilt.edu',
      firstName: 'A',
      lastName: 'B',
    });
    profileServiceMock.getProfile.mockResolvedValueOnce({
      onboarding: { completed: true },
    });

    await act(async () => {
      fillAndSubmit();
    });

    const saved = JSON.parse(localStorage.getItem('user') || 'null');
    expect(saved?.userId).toBe('u1');
    expect(navigateMock).toHaveBeenCalledWith('/home');
  });

  it('successful login with onboarding NOT completed -> navigates to /onboarding', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    authServiceMock.login.mockResolvedValueOnce({
      message: 'Login successful',
      userId: 'u2',
      email: 'user@vanderbilt.edu',
      firstName: 'A',
      lastName: 'B',
    });
    profileServiceMock.getProfile.mockResolvedValueOnce({
      onboarding: { completed: false },
    });

    await act(async () => {
      fillAndSubmit();
    });

    expect(navigateMock).toHaveBeenCalledWith('/onboarding');
  });

  it('shows backend error response message', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    authServiceMock.login.mockResolvedValueOnce({
      message: 'Invalid credentials',
    });

    await act(async () => {
      fillAndSubmit();
    });

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});