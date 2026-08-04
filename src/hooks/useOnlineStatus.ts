import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '../services/api/users';

export const useOnlineStatus = (userId: string) => {
  return useQuery({
    queryKey: ['onlineStatus', userId],
    queryFn: () => usersAPI.getUserStatus(userId),
    refetchInterval: 30000, // 30 seconds
  });
};