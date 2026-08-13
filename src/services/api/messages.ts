import { apiClient } from '../../lib/api-client';
import type { Message, ApiResponse, PaginatedResponse, Conversation } from '../../types';

export const messagesAPI = {
  getConversationMessages: async (
    conversationId: string,
    limit = 50,
    offset = 0
  ): Promise<ApiResponse<PaginatedResponse<Message>>> => {
    return apiClient.get(`/conversations/${conversationId}/messages`, {
      limit,
      offset,
    });
  },

  sendMessage: async (
    conversationId: string,
    content: string
  ): Promise<ApiResponse<Message>> => {
    return apiClient.post(`/conversations/${conversationId}/messages`, { content });
  },

  editMessage: async (
    messageId: string,
    content: string
  ): Promise<ApiResponse<Message>> => {
    return apiClient.patch(`/messages/${messageId}/edit`, { content });
  },

  deleteMessage: async (messageId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/messages/${messageId}`);
  },

  markAsRead: async (messageId: string): Promise<ApiResponse<void>> => {
    return apiClient.post(`/messages/${messageId}/read`);
  },

  getConversations: async (): Promise<ApiResponse<Conversation[]>> => {
    return apiClient.get('/conversations');
  },

  startConversation: async (userId: string): Promise<ApiResponse<Conversation>> => {
    return apiClient.post('/conversations', { userId });
  },

  deleteConversation: async (conversationId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/conversations/${conversationId}`);
  }
};