import { apiClient } from '../../lib/api-client';
import type { User, ApiResponse, PaginatedResponse } from '../../types';

export const usersAPI = {
  getUser: async (userId: string): Promise<ApiResponse<User>> => {
    return apiClient.get(`/users/${userId}`);
  },

  searchUsers: async (query: string, limit = 10): Promise<ApiResponse<PaginatedResponse<User>>> => {
    return apiClient.get('/users/search', { q: query, limit });
  },

  updateProfile: async (userId: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    return apiClient.patch(`/users/${userId}`, data);
  },

  getUserStatus: async (userId: string): Promise<ApiResponse<{ status: string; lastSeen?: Date }>> => {
    return apiClient.get(`/users/${userId}/status`);
  },

  getOnlineUsers: async (): Promise<ApiResponse<User[]>> => {
    return apiClient.get('/users/online');
  },

  changePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<ApiResponse<null>> => {
    console.log("userId: ", userId, "currentPassword: ", currentPassword, "newPassword: ", newPassword);
    return apiClient.patch(`/users/${userId}/changePassword`, { currentPassword, newPassword });
  }
};