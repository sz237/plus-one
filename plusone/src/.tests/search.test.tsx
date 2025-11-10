/**
 * @file src/.tests/search.test.tsx
 */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Avoid pulling the real http.ts (which references import.meta/process.env)
jest.mock('@/services/http', () => ({
  API_BASE_URL: 'http://test-api.local/api',
}));

// If PageTemplate causes heavy layout noise for the test, stub it lightly.
// Comment this block out if you prefer to render the real shell.
// jest.mock('@/components/PageTemplate', () => ({
//   __esModule: true,
//   default: ({ title, children }: { title: string; children: React.ReactNode }) => (
//     <div data-testid="page-template">
//       <h1>{title}</h1>
//       <div>{children}</div>
//     </div>
//   ),
// }));

import Search from '@/pages/Search';

describe('Search page', () => {
  const originalFetch = global.fetch as unknown;

  beforeEach(() => {
    jest.clearAllMocks();
    // fresh fetch mock for each test
    global.fetch = jest.fn();
  });

  afterEach(() => {
    // restore for safety
    // @ts-expect-error restoring any
    global.fetch = originalFetch;
  });

  const renderSearch = () =>
    render(
      <MemoryRouter initialEntries={['/search']}>
        <Search />
      </MemoryRouter>
    );

  it('submits a query and renders results (happy path)', async () => {
    const data = [
      {
        id: 'u1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        job: { title: 'Engineer', companyName: 'Vanderbilt' },
        numConnections: 7,
        profilePhotoUrl: 'https://img/u1.png',
        interests: ['Coffee Chats', 'Game Nights'],
      },
      {
        id: 'u2',
        firstName: 'Grace',
        lastName: 'Hopper',
        job: { title: 'Scientist', companyName: 'Navy' },
        numConnections: 3,
        profilePhotoUrl: '',
        interests: [],
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => data,
    });

    renderSearch();

    const input = screen.getByPlaceholderText(/search people, posts, events/i);
    fireEvent.change(input, { target: { value: 'Ada Lovelace' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    // Called with encoded URL
    expect(global.fetch).toHaveBeenCalledWith(
      'http://test-api.local/api/users/search?q=Ada%20Lovelace'
    );

    // Cards render names
    expect(await screen.findByText(/ada lovelace/i)).toBeInTheDocument();
    expect(screen.getByText(/grace hopper/i)).toBeInTheDocument();

    // Job line shows "title @ company"
    expect(screen.getByText(/engineer @ vanderbilt/i)).toBeInTheDocument();
    expect(screen.getByText(/scientist @ navy/i)).toBeInTheDocument();

    // Connections count appears
    expect(screen.getByText(/connections:\s*7/i)).toBeInTheDocument();
    expect(screen.getByText(/connections:\s*3/i)).toBeInTheDocument();

    // Interest badges appear for first result
    expect(screen.getByText(/coffee chats/i)).toBeInTheDocument();
    expect(screen.getByText(/game nights/i)).toBeInTheDocument();

    // Image alt text uses full name
    expect(
      screen.getByAltText(/ada lovelace/i)
    ).toBeInTheDocument();
  });

  it('does nothing on empty/whitespace query (no fetch call)', async () => {
    renderSearch();

    const input = screen.getByPlaceholderText(/search people, posts, events/i);

    // empty
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });
    // whitespace
    fireEvent.change(input, { target: { value: '   ' } });
    await act(async () => {
      fireEvent.submit(input.closest('form')!);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('encodes special characters in the query string', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderSearch();

    const input = screen.getByPlaceholderText(/search people, posts, events/i);
    fireEvent.change(input, { target: { value: 'A&B ?' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    // A&B ? -> A%26B%20%3F
    expect(global.fetch).toHaveBeenCalledWith(
      'http://test-api.local/api/users/search?q=A%26B%20%3F'
    );
  });
});