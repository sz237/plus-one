import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import App from '@/App';

// Mock each page so routing stays lightweight & deterministic
jest.mock('../pages/Landing', () => () => <div>Landing Page</div>);
jest.mock('../pages/Login', () => () => <div>Login Page</div>);
jest.mock('../pages/Signup', () => () => <div>Signup Page</div>);
jest.mock('../pages/Onboarding', () => () => <div>Onboarding Page</div>);
jest.mock('../pages/Home', () => () => <div>Home Page</div>);
jest.mock('../pages/MyPage', () => () => <div>MyPage Page</div>);
jest.mock('../pages/MakePost', () => () => <div>MakePost Page</div>);
jest.mock('../pages/Messages', () => () => <div>Messages Page</div>);
jest.mock('../pages/Search', () => () => <div>Search Page</div>);

// CSS/Bootstrap handled via jest config (identity-obj-proxy), but safe to stub too
//jest.mock('../App.css', () => ({}), { virtual: true });

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

describe('App routes', () => {
  test.each([
    ['/', /landing page/i],
    ['/login', /login page/i],
    ['/signup', /signup page/i],
    ['/onboarding', /onboarding page/i],
    ['/home', /home page/i],
    ['/mypage', /mypage page/i],
    ['/makepost', /makepost page/i],
    ['/messages', /messages page/i],
    ['/search', /search page/i],
  ])('renders %s -> %s', (path, expected) => {
    renderAt(path);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('wildcard redirects to "/" (Landing)', () => {
    renderAt('/definitely-not-a-real-route');
    // Because the wildcard route uses <Navigate to="/" replace />,
    // we should land on Landing’s content.
    expect(screen.getByText(/landing page/i)).toBeInTheDocument();
  });
});