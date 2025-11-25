import type {
  ChatMessage,
  ConversationSummary,
  SendMessagePayload,
} from "../types/message";
import { api } from "./http";

const withMessenger = (messengerId?: string | null, userId?: string | null) => ({
  headers: {
    ...(messengerId ? { "X-Messenger-Id": messengerId } : {}),
    ...(userId ? { "X-User-Id": userId } : {}),
  },
});

export const messageService = {
  async listConversations(
    messengerId: string,
    userId?: string | null
  ): Promise<ConversationSummary[]> {
    const { data } = await api.get<ConversationSummary[]>(
      "/messages/conversations",
      withMessenger(messengerId, userId)
    );
    return data;
  },

  async openConversation(
    messengerId: string,
    otherMessengerId: string,
    userId?: string | null
  ): Promise<ConversationSummary> {
    const { data } = await api.post<ConversationSummary>(
      `/messages/conversations/${encodeURIComponent(otherMessengerId)}`,
      null,
      withMessenger(messengerId, userId)
    );
    return data;
  },

  async fetchMessages(
    messengerId: string,
    conversationId: string,
    userId?: string | null
  ): Promise<ChatMessage[]> {
    const { data } = await api.get<ChatMessage[]>(
      `/messages/conversations/${conversationId}/messages`,
      withMessenger(messengerId, userId)
    );
    return data;
  },

  async sendMessage(
    messengerId: string,
    payload: SendMessagePayload,
    userId?: string | null
  ): Promise<ChatMessage> {
    const { data } = await api.post<ChatMessage>(
      "/messages",
      payload,
      withMessenger(messengerId, userId)
    );
    return data;
  },

  async markConversationRead(
    messengerId: string,
    conversationId: string,
    userId?: string | null
  ): Promise<void> {
    await api.patch(
      `/messages/conversations/${conversationId}/read`,
      null,
      withMessenger(messengerId, userId)
    );
  },
};
