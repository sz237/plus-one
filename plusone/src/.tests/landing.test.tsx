/**
 * @file src/.tests/landing.test.tsx
 */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Landing from '@/pages/Landing';

describe('Landing page', () => {
  const renderLanding = () =>
    render(
      <MemoryRouter initialEntries={['/']}>
        <Landing />
      </MemoryRouter>
    );

  it('renders logo and primary actions', () => {
    renderLanding();

    expect(screen.getByAltText(/plusone logo/i)).toBeInTheDocument();
    const signup = screen.getByRole('link', { name: /sign up/i });
    const login = screen.getByRole('link', { name: /log in/i });

    expect(signup).toHaveAttribute('href', '/signup');
    expect(login).toHaveAttribute('href', '/login');
  });

  it('links are clickable (no navigation assertion needed here)', async () => {
    renderLanding();
    const user = userEvent.setup();

    await user.click(screen.getByRole('link', { name: /sign up/i }));
    await user.click(screen.getByRole('link', { name: /log in/i }));

    // Just ensure they exist and are interactive; actual routing is covered in App tests.
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
  });
});