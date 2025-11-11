import type {
  ChatMessage,
  ConversationSummary,
  SendMessagePayload,
} from "../types/message";
import { api } from "./http";

const withUser = (userId: string) => ({
  headers: {
    "X-User-Id": userId,
  },
});

export const messageService = {
  async listConversations(userId: string): Promise<ConversationSummary[]> {
    const { data } = await api.get<ConversationSummary[]>(
      "/messages/conversations",
      withUser(userId)
    );
    return data;
  },

  async openConversation(
    userId: string,
    otherUserId: string
  ): Promise<ConversationSummary> {
    const { data } = await api.post<ConversationSummary>(
      `/messages/conversations/${otherUserId}`,
      null,
      withUser(userId)
    );
    return data;
  },

  async fetchMessages(
    userId: string,
    conversationId: string
  ): Promise<ChatMessage[]> {
    const { data } = await api.get<ChatMessage[]>(
      `/messages/conversations/${conversationId}/messages`,
      withUser(userId)
    );
    return data;
  },

  async sendMessage(
    userId: string,
    payload: SendMessagePayload
  ): Promise<ChatMessage> {
    const { data } = await api.post<ChatMessage>(
      "/messages",
      payload,
      withUser(userId)
    );
    return data;
  },

  async markConversationRead(
    userId: string,
    conversationId: string
  ): Promise<void> {
    await api.patch(
      `/messages/conversations/${conversationId}/read`,
      null,
      withUser(userId)
    );
  },
};
