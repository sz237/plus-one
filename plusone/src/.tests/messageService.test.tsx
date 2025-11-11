/**
 * @file src/.tests/messageService.test.ts
 */
import { messageService } from '@/services/messageService';

const get = jest.fn();
const post = jest.fn();
const patch = jest.fn();

jest.mock('@/services/http', () => ({
  api: {
    get: (...a: any[]) => get(...a),
    post: (...a: any[]) => post(...a),
    patch: (...a: any[]) => patch(...a),
  },
}));

describe('messageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listConversations GETs with X-User-Id header', async () => {
    get.mockResolvedValueOnce({ data: [{ conversationId: 'c1' }] });
    const data = await messageService.listConversations('me');
    expect(get).toHaveBeenCalledWith('/messages/conversations', { headers: { 'X-User-Id': 'me' } });
    expect(data[0].conversationId).toBe('c1');
  });

  it('openConversation POSTs to otherUserId path with header', async () => {
    post.mockResolvedValueOnce({ data: { conversationId: 'newC' } });
    const data = await messageService.openConversation('me', 'u2');
    expect(post).toHaveBeenCalledWith('/messages/conversations/u2', null, { headers: { 'X-User-Id': 'me' } });
    expect(data.conversationId).toBe('newC');
  });

  it('fetchMessages GETs messages for a conversation with header', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 'm1' }] });
    const data = await messageService.fetchMessages('me', 'c1');
    expect(get).toHaveBeenCalledWith('/messages/conversations/c1/messages', { headers: { 'X-User-Id': 'me' } });
    expect(data[0].id).toBe('m1');
  });

  it('sendMessage POSTs payload with header', async () => {
    post.mockResolvedValueOnce({ data: { id: 'm2', body: 'hi' } });
    const data = await messageService.sendMessage('me', { conversationId: 'c1', recipientId: 'u2', body: 'hi' });
    expect(post).toHaveBeenCalledWith('/messages', { conversationId: 'c1', recipientId: 'u2', body: 'hi' }, { headers: { 'X-User-Id': 'me' } });
    expect(data.id).toBe('m2');
  });

  it('markConversationRead PATCHes with header', async () => {
    patch.mockResolvedValueOnce({});
    await messageService.markConversationRead('me', 'c1');
    expect(patch).toHaveBeenCalledWith('/messages/conversations/c1/read', null, { headers: { 'X-User-Id': 'me' } });
  });
});