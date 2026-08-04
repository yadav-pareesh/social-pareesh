import { apiClient } from '../../lib/api-client';
import type { User, AuthResponse, ApiResponse } from '../../types';

export const authAPI = {
  register: async (data: {
    username: string;
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post('/auth/register', data);
  },

  login: async (data: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post('/auth/login', data);
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return apiClient.post('/auth/logout');
  },

  refresh: async (): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post('/auth/refresh');
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiClient.get('/auth/me');
  },
};