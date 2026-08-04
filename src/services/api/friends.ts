import { apiClient } from '../../lib/api-client';
import type { FriendRequest, User, ApiResponse } from '../../types';

export const friendsAPI = {
  sendRequest: async (receiverId: string): Promise<ApiResponse<FriendRequest>> => {
    return apiClient.post('/friends/request', { receiverId });
  },

  getPendingRequests: async (): Promise<ApiResponse<FriendRequest[]>> => {
    return apiClient.get('/friends/requests');
  },

  acceptRequest: async (requestId: string): Promise<ApiResponse<FriendRequest>> => {
    return apiClient.patch(`/friends/requests/${requestId}`, { status: 'accepted' });
  },

  rejectRequest: async (requestId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/friends/requests/${requestId}`);
  },

  getFriends: async (): Promise<ApiResponse<User[]>> => {
    return apiClient.get('/friends');
  },

  removeFriend: async (friendId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/friends/${friendId}`);
  },
};