export type ConversationSummary = {
  conversationId: string;
  otherMessengerId: string;
  otherUserId?: string | null;
  otherUserName: string;
  otherUserPhotoUrl?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt: string;
  hasUnread: boolean;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderMessengerId: string;
  senderName: string;
  senderProfilePicUrl?: string | null;
  recipientMessengerId: string;
  body: string;
  sentAt: string;
  readAt?: string | null;
};

export type SendMessagePayload = {
  conversationId?: string;
  recipientMessengerId: string;
  body: string;
};
