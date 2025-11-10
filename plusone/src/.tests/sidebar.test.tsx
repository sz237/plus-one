import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';

const navigateMock = jest.fn();
jest.mock('react-router-dom', () => {
  const real = jest.requireActual('react-router-dom');
  return {
    ...real,
    useNavigate: () => navigateMock,
    useLocation: () => ({ pathname: '/mypage' }),
  };
});

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('highlights active link and closes on link click', () => {
    const onClose = jest.fn();
    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );

    // active "My Page"
    const active = screen.getByRole('link', { name: /my page/i });
    expect(active.className).toMatch(/text-warning/);

    // clicking a link triggers onClose
    fireEvent.click(screen.getByRole('link', { name: /home/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('logs out -> clears storage and navigates to /login', () => {
    localStorage.setItem('user', JSON.stringify({ userId: 'u1' }));
    const onClose = jest.fn();
    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /log out/i }));
    expect(localStorage.getItem('user')).toBeNull();
    expect(onClose).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
});