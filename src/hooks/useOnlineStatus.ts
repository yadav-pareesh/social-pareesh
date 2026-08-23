import { useChatStore } from '../stores/chatStore';

export const useOnlineStatus = (userId?: string | null): boolean => {
  const isOnline = useChatStore((state) => {
    if (!userId) return false;
    return state.onlineUsers.has(userId);
  });

  return isOnline;
};