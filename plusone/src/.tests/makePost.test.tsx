/**
 * @file src/.tests/MakePost.test.tsx
 */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';

const postServiceMock = {
  create: jest.fn(),
  update: jest.fn(),
  getProfile: jest.fn(),
  list: jest.fn(),
  remove: jest.fn(),
};
jest.mock('@/services/postService', () => ({ postService: postServiceMock }));

// mock Sidebar to avoid unrelated complexity
jest.mock('@/components/Sidebar', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => <div data-testid="sidebar">{String(isOpen)}</div>,
}));

// mock navigate
const navigateMock = jest.fn();
jest.mock('react-router-dom', () => {
  const real = jest.requireActual('react-router-dom');
  return {
    ...real,
    useNavigate: () => navigateMock,
  };
});

import MakePost from '@/pages/MakePost';

const setLoggedInUser = (userId = 'u1') => {
  localStorage.setItem('user', JSON.stringify({ userId }));
};
const clearUser = () => localStorage.removeItem('user');

describe('MakePost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setLoggedInUser();
  });

  afterEach(() => {
    clearUser();
  });

  it('renders', () => {
    render(
      <MemoryRouter>
        <MakePost />
      </MemoryRouter>
    );
    expect(screen.getByText(/make a post/i)).toBeInTheDocument();
  });

  it('creates a new post with Events category and date', async () => {
    render(
      <MemoryRouter>
        <MakePost />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/title/i), { target: { value: 'My Event' } });
    fireEvent.change(screen.getByPlaceholderText(/description/i), { target: { value: 'Desc' } });

    // Ensure "Events" is selected by default; set date
    const label = screen.getByText(/event date/i);
    const dateInput = label.parentElement!.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput).toBeTruthy();
    fireEvent.change(dateInput, { target: { value: '2030-01-01' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(postServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'My Event',
        description: 'Desc',
        category: 'Events',
        eventDate: '2030-01-01',
      })
    );
    expect(navigateMock).toHaveBeenCalledWith('/mypage');
  });

  it('edits an existing post (calls update)', async () => {
    const existing = {
      id: 'p1',
      userId: 'u1',
      title: 'Old title',
      description: 'Old desc',
      category: 'Other',
      imageUrl: undefined,
      createdAt: new Date().toISOString(),
    };

    // pass route state with post
    render(
      <MemoryRouter initialEntries={[{ pathname: '/makepost', state: { post: existing } as any }]}>
        <MakePost />
      </MemoryRouter>
    );

    // header should say "Edit Post"
    expect(screen.getByText(/edit post/i)).toBeInTheDocument();

    // change title and submit
    const title = screen.getByPlaceholderText(/title/i);
    fireEvent.change(title, { target: { value: 'New title' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(postServiceMock.update).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({
        id: 'p1',
        title: 'New title',
        category: 'Other',
        eventDate: null,
      })
    );
    expect(navigateMock).toHaveBeenCalledWith('/mypage');
  });

  it('clears eventDate and removes requirement when category is not Events', () => {
    render(
      <MemoryRouter>
        <MakePost />
      </MemoryRouter>
    );

    // pick "Other" category
    fireEvent.click(screen.getByLabelText(/Other/i));

    // Event date input should disappear
    expect(screen.queryByLabelText(/event date/i)).not.toBeInTheDocument();

    // Fill required fields and submit should not complain about date
    fireEvent.change(screen.getByPlaceholderText(/title/i), { target: { value: 'Title' } });
    fireEvent.change(screen.getByPlaceholderText(/description/i), { target: { value: 'Desc' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(postServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'Other',
        eventDate: null,
      })
    );
  });
});