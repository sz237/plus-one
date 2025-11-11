export type ConversationSummary = {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhotoUrl?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt: string;
  hasUnread: boolean;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderProfilePicUrl?: string | null;
  recipientId: string;
  body: string;
  sentAt: string;
  readAt?: string | null;
};

export type SendMessagePayload = {
  conversationId?: string;
  recipientId: string;
  body: string;
};
