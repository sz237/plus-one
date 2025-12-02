/**
 * @file src/.tests/messageUtils.test.ts
 * Tests for message-related utility functions
 */

import type { ChatMessage, ConversationSummary, SendMessagePayload } from '../types/message';

describe('Message utilities', () => {
  describe('ChatMessage structure', () => {
    it('validates required ChatMessage fields', () => {
      const validMessage: ChatMessage = {
        id: 'msg1',
        conversationId: 'conv1',
        senderId: 'u1',
        senderName: 'John Doe',
        recipientId: 'u2',
        body: 'Hello!',
        sentAt: '2024-01-15T10:00:00Z',
      };

      expect(validMessage).toHaveProperty('id');
      expect(validMessage).toHaveProperty('conversationId');
      expect(validMessage).toHaveProperty('senderId');
      expect(validMessage).toHaveProperty('senderName');
      expect(validMessage).toHaveProperty('recipientId');
      expect(validMessage).toHaveProperty('body');
      expect(validMessage).toHaveProperty('sentAt');
    });

    it('handles optional readAt field', () => {
      const unreadMessage: ChatMessage = {
        id: 'msg1',
        conversationId: 'conv1',
        senderId: 'u1',
        senderName: 'John',
        recipientId: 'u2',
        body: 'Hello',
        sentAt: '2024-01-15T10:00:00Z',
        readAt: null,
      };

      const readMessage: ChatMessage = {
        ...unreadMessage,
        readAt: '2024-01-15T10:05:00Z',
      };

      expect(unreadMessage.readAt).toBeNull();
      expect(readMessage.readAt).toBeTruthy();
    });

    it('validates message body is not empty', () => {
      const validateMessageBody = (body: string): boolean => {
        return body.trim().length > 0;
      };

      expect(validateMessageBody('Hello!')).toBe(true);
      expect(validateMessageBody('   ')).toBe(false);
      expect(validateMessageBody('')).toBe(false);
    });
  });

  describe('ConversationSummary structure', () => {
    it('validates required ConversationSummary fields', () => {
      const validConversation: ConversationSummary = {
        conversationId: 'conv1',
        otherUserId: 'u2',
        otherUserName: 'Jane Doe',
        lastMessagePreview: 'Hey, how are you?',
        lastMessageAt: '2024-01-15T10:00:00Z',
        hasUnread: false,
      };

      expect(validConversation).toHaveProperty('conversationId');
      expect(validConversation).toHaveProperty('otherUserId');
      expect(validConversation).toHaveProperty('otherUserName');
      expect(validConversation).toHaveProperty('lastMessageAt');
      expect(validConversation).toHaveProperty('hasUnread');
    });

    it('handles optional fields in ConversationSummary', () => {
      const conversationWithoutOptional: ConversationSummary = {
        conversationId: 'conv1',
        otherUserId: 'u2',
        otherUserName: 'Jane',
        lastMessagePreview: null,
        otherUserPhotoUrl: null,
        lastMessageAt: '2024-01-15T10:00:00Z',
        hasUnread: false,
      };

      expect(conversationWithoutOptional.lastMessagePreview).toBeNull();
      expect(conversationWithoutOptional.otherUserPhotoUrl).toBeNull();
    });
  });

  describe('SendMessagePayload structure', () => {
    it('validates required SendMessagePayload fields', () => {
      const validPayload: SendMessagePayload = {
        recipientId: 'u2',
        body: 'Hello!',
      };

      expect(validPayload).toHaveProperty('recipientId');
      expect(validPayload).toHaveProperty('body');
    });

    it('handles optional conversationId in SendMessagePayload', () => {
      const newConversationPayload: SendMessagePayload = {
        recipientId: 'u2',
        body: 'Hello!',
      };

      const existingConversationPayload: SendMessagePayload = {
        conversationId: 'conv1',
        recipientId: 'u2',
        body: 'Hello!',
      };

      expect(newConversationPayload.conversationId).toBeUndefined();
      expect(existingConversationPayload.conversationId).toBe('conv1');
    });

    it('validates message payload', () => {
      const validatePayload = (payload: SendMessagePayload): boolean => {
        return (
          payload.recipientId.length > 0 &&
          payload.body.trim().length > 0
        );
      };

      expect(validatePayload({ recipientId: 'u2', body: 'Hello' })).toBe(true);
      expect(validatePayload({ recipientId: '', body: 'Hello' })).toBe(false);
      expect(validatePayload({ recipientId: 'u2', body: '' })).toBe(false);
      expect(validatePayload({ recipientId: 'u2', body: '   ' })).toBe(false);
    });
  });

  describe('Message sorting and filtering', () => {
    it('sorts messages by sentAt timestamp', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg3',
          conversationId: 'conv1',
          senderId: 'u1',
          senderName: 'John',
          recipientId: 'u2',
          body: 'Third',
          sentAt: '2024-01-15T10:02:00Z',
        },
        {
          id: 'msg1',
          conversationId: 'conv1',
          senderId: 'u1',
          senderName: 'John',
          recipientId: 'u2',
          body: 'First',
          sentAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'msg2',
          conversationId: 'conv1',
          senderId: 'u1',
          senderName: 'John',
          recipientId: 'u2',
          body: 'Second',
          sentAt: '2024-01-15T10:01:00Z',
        },
      ];

      const sorted = [...messages].sort((a, b) =>
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );

      expect(sorted[0].body).toBe('First');
      expect(sorted[1].body).toBe('Second');
      expect(sorted[2].body).toBe('Third');
    });
  });
});

