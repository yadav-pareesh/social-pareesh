import { apiClient } from '../../lib/api-client';
import type { ApiResponse, PaginatedResponse, CallRecord } from '../../types';

export const callsAPI = {
  getCallHistory: async (
    limit = 20,
    offset = 0
  ): Promise<ApiResponse<PaginatedResponse<CallRecord>>> => {
    return apiClient.get('/calls/history', {
      limit,
      offset,
    });
  },

  deleteCallLog: async (callId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/calls/history/${callId}`);
  },
};