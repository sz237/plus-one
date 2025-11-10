/**
 * @file src/.tests/Signup.test.tsx
 */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';

const authServiceMock = {
  signup: jest.fn(),
};
jest.mock('@/services/authService', () => ({
  isVanderbiltEmail: (email: string) => /@vanderbilt\.edu$/i.test(email.trim()),
  authService: authServiceMock,
}));

const navigateMock = jest.fn();
jest.mock('react-router-dom', () => {
  const real = jest.requireActual('react-router-dom');
  return {
    ...real,
    useNavigate: () => navigateMock,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

import Signup from '@/pages/Signup';

describe('Signup page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const fillAndSubmit = (overrides?: Partial<Record<string, string>>) => {
    const vals = {
      firstName: 'A',
      lastName: 'B',
      email: 'user@vanderbilt.edu',
      password: 'secret1',
      confirmPassword: 'secret1',
      ...overrides,
    };
    fireEvent.change(screen.getByPlaceholderText(/first name/i), { target: { value: vals.firstName } });
    fireEvent.change(screen.getByPlaceholderText(/last name/i), { target: { value: vals.lastName } });
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: vals.email } });
    fireEvent.change(screen.getByPlaceholderText(/password \(min 6 characters\)/i), { target: { value: vals.password } });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: vals.confirmPassword } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    return vals;
  };

  it('validates Vanderbilt email and matching passwords', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    // wrong domain
    fillAndSubmit({ email: 'x@gmail.com' });
    expect(screen.getByText(/please use your vanderbilt email/i)).toBeInTheDocument();

    // mismatch
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'x@vanderbilt.edu' } });
    fireEvent.change(screen.getByPlaceholderText(/password \(min 6 characters\)/i), { target: { value: 'abcdef' } });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), { target: { value: 'ghijkl' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('successful signup navigates to onboarding and stores user', async () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    authServiceMock.signup.mockResolvedValueOnce({
      message: 'Signup successful',
      userId: 'u1',
      email: 'user@vanderbilt.edu',
      firstName: 'A',
      lastName: 'B',
    });

    await act(async () => {
      fillAndSubmit();
    });

    expect(authServiceMock.signup).toHaveBeenCalledWith({
      email: 'user@vanderbilt.edu',
      password: 'secret1',
      firstName: 'A',
      lastName: 'B',
    });

    const saved = JSON.parse(localStorage.getItem('user') || 'null');
    expect(saved?.userId).toBe('u1');

    expect(navigateMock).toHaveBeenCalledWith('/onboarding', { replace: true });
  });

  it('shows backend error message from response', async () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    authServiceMock.signup.mockResolvedValueOnce({
      message: 'Email already used',
    });

    await act(async () => {
      fillAndSubmit();
    });

    expect(screen.getByText(/email already used/i)).toBeInTheDocument();
  });
});