/**
 * plusone/src/.tests/Search.test.tsx
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock PageTemplate to keep render simple
jest.mock('../components/PageTemplate', () => ({
  __esModule: true,
  default: ({ children, title }: any) => (
    <div data-testid="page" data-title={title}>{children}</div>
  ),
}));

// Lock API_BASE_URL so we can assert request URLs
jest.mock('../services/http', () => ({
  __esModule: true,
  API_BASE_URL: 'http://api.test',
}));

import Search from '../pages/Search';

const mockFetch = () => {
  const f = jest.fn();
  // @ts-expect-error
  global.fetch = f;
  return f;
};

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('Search page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('users by interests: requires non-empty query, shows results and header', async () => {
    const fetchSpy = mockFetch();

    render(<Search />);

    // initial: Users by interests
    // blank submit => should NOT call fetch
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    expect(fetchSpy).not.toHaveBeenCalled();

    // type a query and search
    fireEvent.change(screen.getByRole('textbox'), { target: { value: ' hiking ' } });

    const users = [
      { id: 'u1', firstName: 'Ana', lastName: 'Lee', numConnections: 3, job: { title: 'Dev', companyName: 'X' }, interests: ['hiking'] },
      { id: 'u2', firstName: 'Bob', lastName: 'R', numConnections: 0, interests: [] },
    ];

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => users,
    } as any);

    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // loading shows
    expect(await screen.findByText(/Searching…/)).toBeInTheDocument();
    await flush();

    // URL correctness (trimmed + mode=interests)
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://api.test/users/search?mode=interests&q=hiking&limit=24'
    );

    // Results rendered
    expect(await screen.findByText(/Ana Lee/)).toBeInTheDocument();
    expect(screen.getByText(/Dev @ X/)).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /ana lee/i })[0]).toBeInTheDocument();

    // Friendly header + counter
    expect(screen.getByText(/Users \(by interests\) • “hiking”/)).toBeInTheDocument();
    expect(screen.getByText(/2 results/)).toBeInTheDocument();
  });

  test('users by name path + placeholder swap', async () => {
    const fetchSpy = mockFetch();
    render(<Search />);

    // switch mode to "name"
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'name' } });
    // Placeholder should reflect "Search by name…"
    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alice' } });

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: '1', firstName: 'Alice', lastName: 'Smith' }],
    } as any);

    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://api.test/users/search?mode=name&q=Alice&limit=24'
      )
    );
    expect(await screen.findByText(/Alice Smith/)).toBeInTheDocument();
    expect(screen.getByText(/Users \(by name\) • “Alice”/)).toBeInTheDocument();
    expect(screen.getByText(/1 result/)).toBeInTheDocument();
  });

  test('posts: events category (empty allowed), renders post cards + header', async () => {
    const fetchSpy = mockFetch();
    render(<Search />);

    // switch target to events
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'events' } });

    const posts = [
      {
        id: 'p1',
        title: 'Jazz Night',
        category: 'EVENTS',
        author: { firstName: 'Mia', lastName: 'X' },
        coverImageUrl: 'https://example.com/j.jpg',
        createdAt: '2024-03-04T00:00:00.000Z',
        description: 'A cool event',
      },
    ];

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => posts,
    } as any);

    // query is optional for posts; submit blank
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://api.test/posts/search?category=EVENTS&q=&limit=24'
      )
    );

    expect(await screen.findByText(/Jazz Night/)).toBeInTheDocument();
    expect(screen.getByText(/EVENTS/)).toBeInTheDocument();
    expect(screen.getByText(/Posted by Mia X/)).toBeInTheDocument();
    expect(screen.getByText(/Events/)).toBeInTheDocument(); // header label
  });

  test('posts: jobs category branch mapping (JOB_OPPORTUNITIES)', async () => {
    const fetchSpy = mockFetch();
    render(<Search />);

    // switch target to jobs
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'jobs' } });

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as any);

    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://api.test/posts/search?category=JOB_OPPORTUNITIES&q=&limit=24'
      )
    );

    // empty state appears because no results
    expect(await screen.findByText(/No matches found/)).toBeInTheDocument();
  });

  test('error path shows alert and no header count', async () => {
    const fetchSpy = mockFetch();
    render(<Search />);

    // users mode requires a query
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'oops' } });

    fetchSpy.mockResolvedValueOnce({ ok: false, status: 500 } as any);

    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(await screen.findByText(/Search failed \(500\)/)).toBeInTheDocument();
    // header with count should NOT be shown when error
    expect(screen.queryByText(/results/)).not.toBeInTheDocument();
  });

  test('loading text appears then clears', async () => {
    // delay resolution to assert the loading state
    const fetchSpy = mockFetch();
    render(<Search />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } });

    let resolveJson!: () => void;
    const jsonPromise = new Promise<any>((r) => (resolveJson = r));

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => jsonPromise,
    } as any);

    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(await screen.findByText(/Searching…/)).toBeInTheDocument();

    resolveJson([{ id: 'x', firstName: 'T', lastName: 'U' }]);
    await waitFor(() => expect(screen.queryByText(/Searching…/)).not.toBeInTheDocument());
  });

  test('placeholders switch when toggling target + userMode', () => {
    render(<Search />);

    // users/interests (default)
    expect(screen.getByPlaceholderText(/Search interests/i)).toBeInTheDocument();

    // users/name
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'name' } });
    expect(screen.getByPlaceholderText(/Search by name/i)).toBeInTheDocument();

    // posts -> events
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'events' } });
    expect(screen.getByPlaceholderText(/Optional keywords/i)).toBeInTheDocument();
  });
});