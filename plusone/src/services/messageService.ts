import type {
  ChatMessage,
  ConversationSummary,
  SendMessagePayload,
} from "../types/message";
import { api } from "./http";

export const messageService = {
  async listConversations(): Promise<ConversationSummary[]> {
    const { data } = await api.get<ConversationSummary[]>("/messages/conversations");
    return data;
  },

  async openConversation(otherUserId: string): Promise<ConversationSummary> {
    const { data } = await api.post<ConversationSummary>(`/messages/conversations/${otherUserId}`);
    return data;
  },

  async fetchMessagesWithUser(otherUserId: string): Promise<ChatMessage[]> {
    const { data } = await api.get<ChatMessage[]>(`/messages/with/${otherUserId}`);
    return data;
  },

  async sendMessage(payload: SendMessagePayload): Promise<ChatMessage> {
    const { data } = await api.post<ChatMessage>("/messages", payload);
    return data;
  },

  async markConversationRead(conversationId: string): Promise<void> {
    await api.patch(`/messages/conversations/${conversationId}/read`, null);
  },
};
