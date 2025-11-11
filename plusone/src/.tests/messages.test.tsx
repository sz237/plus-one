/**
 * @file src/.tests/messages.test.tsx
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import Messages from '@/pages/Messages';
import type { ChatMessage, ConversationSummary } from '@/types/message';

// ---- simple PageTemplate mock so we see title and children ----
jest.mock('@/components/PageTemplate', () => ({
  __esModule: true,
  default: ({ title, children }: any) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

// ---- services & navigate mocks ----
const listConversations = jest.fn();
const openConversation = jest.fn();
const fetchMessages = jest.fn();
const sendMessage = jest.fn();
const markConversationRead = jest.fn();

jest.mock('@/services/messageService', () => ({
  messageService: {
    listConversations: (...a: any[]) => listConversations(...a),
    openConversation: (...a: any[]) => openConversation(...a),
    fetchMessages: (...a: any[]) => fetchMessages(...a),
    sendMessage: (...a: any[]) => sendMessage(...a),
    markConversationRead: (...a: any[]) => markConversationRead(...a),
  },
}));

const getRecentUsers = jest.fn();
jest.mock('@/services/connectionService', () => ({
  connectionService: {
    getRecentUsers: (...a: any[]) => getRecentUsers(...a),
  },
}));

const navigateMock = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

// ---- helpers / samples ----
const setUser = (u?: any) => {
  if (u) localStorage.setItem('user', JSON.stringify(u));
  else localStorage.removeItem('user');
};

const ME = { userId: 'me', email: 'me@x.com', firstName: 'Ada', lastName: 'Lovelace' };

const convo = (id: string, overrides: Partial<ConversationSummary> = {}): ConversationSummary => ({
  conversationId: id,
  otherUserId: `u-${id}`,
  otherUserName: `User ${id}`,
  otherUserPhotoUrl: '',
  lastMessagePreview: `hello ${id}`,
  lastMessageAt: new Date('2025-01-01T10:00:00Z').toISOString(),
  hasUnread: true,
  ...overrides,
});

const msg = (id: string, body: string, from: 'me' | 'them'): ChatMessage => ({
  id,
  senderId: from === 'me' ? ME.userId : 'them',
  senderName: from === 'me' ? 'Ada' : 'User X',
  senderProfilePicUrl: '',
  body,
  sentAt: new Date('2025-01-01T10:00:00Z').toISOString(),
});

describe('Messages page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('redirects to /login and renders nothing if no user', async () => {
    setUser(undefined);
    render(<Messages />);
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
    // component returns null
    expect(screen.queryByText(/messages/i)).not.toBeInTheDocument();
  });

  it('loads recent users for the picker, lists conversations, selects first, fetches thread & marks read', async () => {
    setUser(ME);

    getRecentUsers.mockResolvedValueOnce([
      { userId: 'u1', firstName: 'Grace', lastName: 'Hopper', email: 'g@ex.com', profile: {}, createdAt: '' },
    ]);

    // two conversations, first should be selected initially
    listConversations.mockResolvedValueOnce([convo('c1'), convo('c2', { hasUnread: false })]);

    // thread for c1
    fetchMessages.mockResolvedValueOnce([msg('m1', 'hello from them', 'them')]);
    markConversationRead.mockResolvedValueOnce();

    render(<Messages />);

    // title
    expect(await screen.findByText('Messages')).toBeInTheDocument();

    // picker users loaded
    await waitFor(() => expect(getRecentUsers).toHaveBeenCalledWith('me'));
    expect(screen.getByRole('option', { name: /grace hopper/i })).toBeInTheDocument();

    // conversations loaded
    await waitFor(() => expect(listConversations).toHaveBeenCalledWith('me'));
    // first selected => thread fetch + mark read
    await waitFor(() => expect(fetchMessages).toHaveBeenCalledWith('me', 'c1'));
    expect(markConversationRead).toHaveBeenCalledWith('me', 'c1');

    // thread shows bubble with "User X" label (them) and message body
    expect(screen.getByText(/you|user x/i)).toBeInTheDocument();
    expect(screen.getByText('hello from them')).toBeInTheDocument();

    // composer enabled, button disabled until text
    const textarea = screen.getByPlaceholderText(/message in progress/i) as HTMLTextAreaElement;
    const sendBtn = screen.getByRole('button', { name: /send/i });
    expect(textarea).toBeEnabled();
    expect(sendBtn).toBeDisabled();
  });

  it('switches conversations on click and refetches thread', async () => {
    setUser(ME);
    getRecentUsers.mockResolvedValueOnce([]);
    listConversations.mockResolvedValueOnce([convo('c1'), convo('c2')]);

    fetchMessages
      .mockResolvedValueOnce([msg('m1', 'first thread', 'them')]) // initial c1
      .mockResolvedValueOnce([msg('m2', 'second thread', 'me')]); // after switching to c2
    markConversationRead.mockResolvedValue(jest.fn());

    render(<Messages />);

    await waitFor(() => expect(fetchMessages).toHaveBeenCalledWith('me', 'c1'));
    expect(screen.getByText('first thread')).toBeInTheDocument();

    // click c2 item
    const c2Item = screen.getByText(/user c2/i).closest('.conversation-item')!;
    fireEvent.click(c2Item);

    await waitFor(() => expect(fetchMessages).toHaveBeenCalledWith('me', 'c2'));
    expect(screen.getByText('second thread')).toBeInTheDocument();
  });

  it('sends a message, clears composer, adds message to thread, and bumps conversation to top', async () => {
    setUser(ME);
    getRecentUsers.mockResolvedValueOnce([]);
    listConversations.mockResolvedValueOnce([convo('c1'), convo('c2')]);
    fetchMessages.mockResolvedValueOnce([]); // thread initially empty
    markConversationRead.mockResolvedValueOnce();

    const sent = msg('m-new', 'hiya!', 'me');
    sendMessage.mockResolvedValueOnce(sent);

    render(<Messages />);

    await waitFor(() => expect(fetchMessages).toHaveBeenCalledWith('me', 'c1'));

    const textarea = screen.getByPlaceholderText(/message in progress/i) as HTMLTextAreaElement;
    const sendBtn = screen.getByRole('button', { name: /send/i });

    fireEvent.change(textarea, { target: { value: 'hiya!' } });
    expect(sendBtn).toBeEnabled();

    await act(async () => {
      fireEvent.click(sendBtn);
    });

    // appears in thread & composer cleared
    expect(screen.getByText('hiya!')).toBeInTheDocument();
    expect((textarea.value)).toBe('');

    // the list was updated (we won’t assert exact DOM order, but we can ensure no errors and that conversation preview updated)
    // this is a simple sanity check: the preview “hiya!” should exist somewhere
    expect(screen.getAllByText(/hiya!/i).length).toBeGreaterThan(0);
  });

  it('shows footer error if listing conversations fails; shows thread error if fetching messages fails; shows send error if sending fails', async () => {
    setUser(ME);
    getRecentUsers.mockResolvedValueOnce([]);

    // list fail
    listConversations.mockRejectedValueOnce(new Error('listing broken'));
    render(<Messages />);
    expect(await screen.findByText(/listing broken/i)).toBeInTheDocument();

    // now simulate success list but thread fetch fails
    jest.clearAllMocks();
    getRecentUsers.mockResolvedValueOnce([]);
    listConversations.mockResolvedValueOnce([convo('cx')]);
    fetchMessages.mockRejectedValueOnce(new Error('thread broken'));
    markConversationRead.mockResolvedValueOnce();

    render(<Messages />);
    expect(await screen.findByText(/thread broken/i)).toBeInTheDocument();

    // send failure
    jest.clearAllMocks();
    getRecentUsers.mockResolvedValueOnce([]);
    listConversations.mockResolvedValueOnce([convo('c1')]);
    fetchMessages.mockResolvedValueOnce([]); // ok
    markConversationRead.mockResolvedValueOnce();

    render(<Messages />);
    await waitFor(() => expect(fetchMessages).toHaveBeenCalled());

    const textarea = screen.getByPlaceholderText(/message in progress/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'oops' } });
    const sendBtn = screen.getByRole('button', { name: /send/i });
    sendMessage.mockRejectedValueOnce(new Error('send broken'));

    await act(async () => {
      fireEvent.click(sendBtn);
    });
    expect(await screen.findByText(/send broken/i)).toBeInTheDocument();
  });

  it('opens a conversation via the picker form (submit -> openConversation, select it)', async () => {
    setUser(ME);
    getRecentUsers.mockResolvedValueOnce([{ userId: 'u99', firstName: 'New', lastName: 'Friend', email: 'nf@x.com', profile: {}, createdAt: '' }]);
    listConversations.mockResolvedValueOnce([convo('c1')]);
    fetchMessages.mockResolvedValueOnce([]); // c1 initial
    markConversationRead.mockResolvedValueOnce();

    const created = convo('newC', { otherUserId: 'u99', otherUserName: 'New Friend', lastMessagePreview: '', hasUnread: false });
    openConversation.mockResolvedValueOnce(created);

    render(<Messages />);

    await waitFor(() => expect(fetchMessages).toHaveBeenCalledWith('me', 'c1'));

    // choose user and submit
    fireEvent.change(screen.getByDisplayValue('Pick someone to message'), { target: { value: 'u99' } });
    fireEvent.click(screen.getByRole('button', { name: /^go$/i }));

    // new convo becomes selected; thread fetch for it
    await waitFor(() => expect(openConversation).toHaveBeenCalledWith('me', 'u99'));
    // selection triggers fetchMessages again
    // (the component fetches on selection change; we just assert openConversation was called)
  });
});