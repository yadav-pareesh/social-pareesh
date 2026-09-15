import { apiClient } from '../../lib/api-client';
import type { User, ApiResponse, PaginatedResponse, PrivacySettings, ReportPayload } from '../../types';

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
    return apiClient.patch(`/users/${userId}/changePassword`, { currentPassword, newPassword });
  },

  getPrivacySettings: async (): Promise<ApiResponse<PrivacySettings>> => {
    return apiClient.get('/users/me/privacy');
  },

  updatePrivacySettings: async (settings: Partial<PrivacySettings>): Promise<ApiResponse<PrivacySettings>> => {
    return apiClient.patch('/users/me/privacy', settings);
  },

  reportUser: async (userId: string, payload: ReportPayload): Promise<ApiResponse<any>> => {
    return apiClient.post(`/users/${userId}/report`, payload);
  },

  deleteAccount: async (password?: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiClient.delete('/users/me', { data: { password } });
  },
};