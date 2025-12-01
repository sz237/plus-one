import { messageService } from '@/services/messageService';

const get = jest.fn();
const post = jest.fn();
const patch = jest.fn();

jest.mock('@/services/http', () => ({
  api: {
    get: (...args: any[]) => get(...args),
    post: (...args: any[]) => post(...args),
    patch: (...args: any[]) => patch(...args),
  },
}));

describe('messageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists conversations', async () => {
    const payload = [{ conversationId: 'c1' }];
    get.mockResolvedValueOnce({ data: payload });

    const out = await messageService.listConversations();

    expect(get).toHaveBeenCalledWith('/messages/conversations');
    expect(out).toEqual(payload);
  });

  it('opens a conversation with another user', async () => {
    const convo = { conversationId: 'new', otherUserId: 'u2' };
    post.mockResolvedValueOnce({ data: convo });

    const out = await messageService.openConversation('u2');

    expect(post).toHaveBeenCalledWith('/messages/conversations/u2');
    expect(out).toEqual(convo);
  });

  it('fetches, sends, and marks a thread as read', async () => {
    const messages = [{ id: 'm1' }];
    get.mockResolvedValueOnce({ data: messages });
    const newMessage = { id: 'm2', body: 'hi' };
    post.mockResolvedValueOnce({ data: newMessage });
    patch.mockResolvedValueOnce({});

    const fetched = await messageService.fetchMessagesWithUser('other');
    await messageService.markConversationRead('c1');
    const sent = await messageService.sendMessage({
      recipientId: 'other',
      body: 'hi',
    });

    expect(get).toHaveBeenCalledWith('/messages/with/other');
    expect(patch).toHaveBeenCalledWith('/messages/conversations/c1/read', null);
    expect(post).toHaveBeenCalledWith('/messages', {
      recipientId: 'other',
      body: 'hi',
    });
    expect(fetched).toEqual(messages);
    expect(sent).toEqual(newMessage);
  });
});
