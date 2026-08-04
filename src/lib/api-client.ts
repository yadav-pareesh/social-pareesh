import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private readonly client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError<ApiResponse<unknown>>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => this.client(originalRequest as AxiosRequestConfig))
              .catch((refreshError) => {
                throw refreshError;
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            this.clearAuth();
            throw new Error(typeof error.response?.data?.error === 'string' ? error.response.data.error : 'Session expired');
          }

          try {
            const response = await this.client.post('/auth/refresh', { refreshToken });
            const data = response.data as { token?: string; refreshToken?: string } | undefined;

            if (data?.token) {
              useAuthStore.getState().setToken(data.token);
              useAuthStore.getState().setRefreshToken(data.refreshToken ?? null);
              this.processQueue(null);
              originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: `Bearer ${data.token}`,
              };
              return this.client(originalRequest as AxiosRequestConfig);
            }

            throw new Error('Unable to refresh session');
          } catch (refreshError) {
            this.processQueue(refreshError);
            this.clearAuth();
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        if (error.response?.status === 401) {
          this.clearAuth();
        }

        throw new Error(typeof error.response?.data?.error === 'string' ? error.response.data.error : 'An error occurred');
      }
    );
  }

  private processQueue(error: unknown) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
    this.failedQueue = [];
  }

  private clearAuth() {
    useAuthStore.getState().logout();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  async get<T>(url: string, params?: Record<string, unknown> | URLSearchParams): Promise<ApiResponse<T>> {
    return this.client.get(url, { params });
  }

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.client.post(url, data);
  }

  async patch<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.client.patch(url, data);
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.client.delete(url);
  }
}

export const apiClient = new ApiClient();