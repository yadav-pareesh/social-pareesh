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

  verifyRegistration: async (email: string, otp: string): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post('/auth/verify-registration', { email, otp });
  },

  resendVerification: async (email: string): Promise<ApiResponse<void>> => {
    return apiClient.post('/auth/resend-verification', { email });
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

  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (data: {
    email: string;
    otp: string;
    password: string;
  }): Promise<ApiResponse<void>> => {
    return apiClient.patch('/auth/reset-password', data);
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiClient.get('/auth/me');
  },
};