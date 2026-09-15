import { apiClient } from '../../lib/api-client';
import type { FriendRequest, User, ApiResponse, BlockedUser } from '../../types';

export const friendsAPI = {
  sendRequest: async (receiverId: string): Promise<ApiResponse<FriendRequest>> => {
    return apiClient.post('/friends/request', { receiverId });
  },

  getPendingRequests: async (): Promise<ApiResponse<FriendRequest[]>> => {
    return apiClient.get('/friends/requests');
  },

  getSentRequests: async (): Promise<ApiResponse<FriendRequest[]>> => {
    return apiClient.get('/friends/requests/sent');
  },

  cancelRequest: async (requestId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/friends/requests/${requestId}/cancel`);
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

  getBlockedUsers: async (): Promise<ApiResponse<BlockedUser[]>> => {
    return apiClient.get('/friends/blocked');
  },

  blockUser: async (userId: string): Promise<ApiResponse<void>> => {
    return apiClient.post('/friends/block', { userId });
  },

  unblockUser: async (userId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/friends/block/${userId}`);
  },
};