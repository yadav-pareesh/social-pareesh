import { 
  useInfiniteQuery, 
  useMutation, 
  useQueryClient, 
  type InfiniteData 
} from '@tanstack/react-query';
import type { CallRecord } from '../types';
import { callsAPI } from '@/services/api/calls';

// 1. Define the exact shape of a single page of data
export interface CallHistoryPage {
  items: CallRecord[];
  total: number;
  page: number;
  limit: number;
}

// 2. Define a flexible type for the raw API response to replace 'any'
interface RawApiResponse {
  data?: CallRecord[] | { items?: CallRecord[]; total?: number; page?: number };
  items?: CallRecord[];
  total?: number;
  page?: number;
}

export const useCallHistory = () => {
  // Explicitly type the query: <ReturnData, Error, InfiniteDataShape, QueryKey, PageParamType>
  return useInfiniteQuery<CallHistoryPage, Error, InfiniteData<CallHistoryPage, number>, string[], number>({
    queryKey: ['callHistory'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 20;
      const rawResponse = await callsAPI.getCallHistory(limit, pageParam);
      const response = rawResponse as unknown as RawApiResponse;

      let callList: CallRecord[] = [];
      
      // Type-safe extraction without 'any'
      if (Array.isArray(response.data)) {
        callList = response.data;
      } else if (response.data && !Array.isArray(response.data) && Array.isArray(response.data.items)) {
        callList = response.data.items;
      } else if (Array.isArray(response.items)) {
        callList = response.items;
      }

      // Safely extract pagination metadata
      const responseDataObj = (response.data && !Array.isArray(response.data)) ? response.data : {};
      
      const total = responseDataObj.total ?? response.total ?? callList.length;
      const page = responseDataObj.page ?? response.page ?? Math.floor(pageParam / limit) + 1;

      return {
        items: callList,
        total,
        page,
        limit,
      };
    },
    getNextPageParam: (lastPage) => {
      const currentOffset = (lastPage.page - 1) * lastPage.limit;
      const nextOffset = currentOffset + lastPage.limit;
      
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });
};

export const useDeleteCallLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { callId: string }) => callsAPI.deleteCallLog(data.callId),
    onSuccess: (_response, variables) => {
      // 3. Strongly type the cache update to match the InfiniteData structure exactly
      queryClient.setQueryData<InfiniteData<CallHistoryPage, number>>(
        ['callHistory'],
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.filter((call) => call.id !== variables.callId),
            })),
          };
        }
      );
    },
  });
};