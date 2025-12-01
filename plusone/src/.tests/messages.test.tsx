import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Messages from '@/pages/Messages';
import type { ChatMessage, ConversationSummary } from '@/types/message';

// Lightweight PageTemplate stub
jest.mock('@/components/PageTemplate', () => ({
  __esModule: true,
  default: ({ title, children }: any) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

const listConversations = jest.fn();
const openConversation = jest.fn();
const fetchMessagesWithUser = jest.fn();
const sendMessage = jest.fn();
const markConversationRead = jest.fn();

jest.mock('@/services/messageService', () => ({
  messageService: {
    listConversations: (...args: any[]) => listConversations(...args),
    openConversation: (...args: any[]) => openConversation(...args),
    fetchMessagesWithUser: (...args: any[]) => fetchMessagesWithUser(...args),
    sendMessage: (...args: any[]) => sendMessage(...args),
    markConversationRead: (...args: any[]) => markConversationRead(...args),
  },
}));

const getRecentUsers = jest.fn();
jest.mock('@/services/connectionService', () => ({
  connectionService: {
    getRecentUsers: (...args: any[]) => getRecentUsers(...args),
  },
}));

const navigateMock = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const ME = { userId: 'me', email: 'me@x.com', firstName: 'Ada', lastName: 'Lovelace' };

const convo = (id: string, overrides: Partial<ConversationSummary> = {}): ConversationSummary => ({
  conversationId: id,
  otherUserId: `user-${id}`,
  otherUserName: `User ${id}`,
  lastMessagePreview: `preview ${id}`,
  lastMessageAt: new Date('2025-01-01T10:00:00Z').toISOString(),
  hasUnread: true,
  otherUserPhotoUrl: '',
  ...overrides,
});

const msg = (id: string, body: string, from: 'me' | 'them'): ChatMessage => ({
  id,
  conversationId: 'c1',
  senderId: from === 'me' ? ME.userId : 'them',
  senderName: from === 'me' ? 'Ada' : 'User X',
  recipientId: from === 'me' ? 'them' : ME.userId,
  body,
  sentAt: new Date('2025-01-01T10:00:00Z').toISOString(),
  senderProfilePicUrl: '',
});

const setUser = (u?: any) => {
  if (u) localStorage.setItem('user', JSON.stringify(u));
  else localStorage.removeItem('user');
};

describe('Messages page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('redirects to login when no user is stored', () => {
    setUser(undefined);
    render(<Messages />);
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
    expect(screen.queryByText('Messages')).not.toBeInTheDocument();
  });

  it('loads conversations, renders first thread, and marks it read', async () => {
    setUser(ME);
    getRecentUsers.mockResolvedValueOnce([]);
    const conversations = [convo('c1'), convo('c2')];
    listConversations.mockResolvedValueOnce(conversations);
    fetchMessagesWithUser.mockResolvedValueOnce([msg('m1', 'hello', 'them')]);
    markConversationRead.mockResolvedValueOnce();

    render(<Messages />);

    expect(await screen.findByText('Messages')).toBeInTheDocument();
    await waitFor(() => expect(listConversations).toHaveBeenCalled());
    await waitFor(() => expect(fetchMessagesWithUser).toHaveBeenCalledWith('user-c1'));
    expect(markConversationRead).toHaveBeenCalledWith('c1');
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText(/user c1/i)).toBeInTheDocument();
  });

  it('switches conversations and fetches a new thread', async () => {
    setUser(ME);
    getRecentUsers.mockResolvedValueOnce([]);
    listConversations.mockResolvedValueOnce([convo('c1'), convo('c2')]);
    fetchMessagesWithUser
      .mockResolvedValueOnce([msg('m1', 'thread one', 'them')])
      .mockResolvedValueOnce([msg('m2', 'thread two', 'me')]);
    markConversationRead.mockResolvedValue(jest.fn());

    render(<Messages />);

    await waitFor(() => expect(fetchMessagesWithUser).toHaveBeenCalledWith('user-c1'));
    fireEvent.click(await screen.findByText(/user c2/i));
    await waitFor(() => expect(fetchMessagesWithUser).toHaveBeenCalledWith('user-c2'));
    expect(screen.getByText('thread two')).toBeInTheDocument();
  });

  it('sends a message and clears the composer', async () => {
    setUser(ME);
    getRecentUsers.mockResolvedValueOnce([]);
    listConversations.mockResolvedValueOnce([convo('c1')]);
    fetchMessagesWithUser.mockResolvedValueOnce([]);
    markConversationRead.mockResolvedValueOnce();
    const sent = msg('m-new', 'Hi there', 'me');
    sendMessage.mockResolvedValueOnce(sent);

    render(<Messages />);
    await waitFor(() => expect(fetchMessagesWithUser).toHaveBeenCalled());

    const composer = screen.getByPlaceholderText(/message in progress/i) as HTMLTextAreaElement;
    fireEvent.change(composer, { target: { value: 'Hi there' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send/i }));
    });

    expect(sendMessage).toHaveBeenCalledWith({
      conversationId: 'c1',
      recipientId: 'user-c1',
      body: 'Hi there',
    });
    expect(screen.getByText('Hi there')).toBeInTheDocument();
    expect(composer.value).toBe('');
  });

  it('opens a new conversation via the search form', async () => {
    setUser(ME);
    getRecentUsers.mockResolvedValueOnce([
      { userId: 'u99', firstName: 'New', lastName: 'Friend', email: '', profile: {}, createdAt: '' },
    ]);
    listConversations.mockResolvedValueOnce([]);
    fetchMessagesWithUser.mockResolvedValueOnce([]); // for the newly opened conversation
    const created = convo('c-new', { otherUserId: 'u99', otherUserName: 'New Friend', hasUnread: false });
    openConversation.mockResolvedValueOnce(created);
    markConversationRead.mockResolvedValueOnce();

    render(<Messages />);
    expect(await screen.findByText('Messages')).toBeInTheDocument();
    await waitFor(() => expect(getRecentUsers).toHaveBeenCalledWith('me'));

    fireEvent.change(screen.getByPlaceholderText(/search by name/i), {
      target: { value: 'new friend' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^go$/i }));
    });

    await waitFor(() => expect(openConversation).toHaveBeenCalledWith('u99'));
    await waitFor(() => expect(fetchMessagesWithUser).toHaveBeenCalledWith('u99'));
  });
});
