import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { friendsAPI } from '../services/api/friends';
import { useFriendStore } from '../stores/friendStore';

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  const { addSentRequest } = useFriendStore();

  return useMutation({
    mutationFn: (receiverId: string) => friendsAPI.sendRequest(receiverId),
    onSuccess: (response) => {
      if (response.data) {
        addSentRequest(response.data);
      }
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
    },
  });
};

export const useGetPendingRequests = () => {
  const { setPendingRequests } = useFriendStore();

  return useQuery({
    queryKey: ['friends', 'requests', 'pending'],
    queryFn: async () => {
      const response = await friendsAPI.getPendingRequests();
      if (response.data) {
        setPendingRequests(response.data);
      }
      return response.data || [];
    },
  });
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();
  const { removePendingRequest, addFriend } = useFriendStore();

  return useMutation({
    mutationFn: (requestId: string) => friendsAPI.acceptRequest(requestId),
    onSuccess: (response) => {
      if (response.data) {
        removePendingRequest(response.data.id);
        // Optionally add as friend
      }
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
};

export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();
  const { removePendingRequest } = useFriendStore();

  return useMutation({
    mutationFn: (requestId: string) => friendsAPI.rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
    },
  });
};

export const useGetFriends = () => {
  const { setFriends } = useFriendStore();

  return useQuery({
    queryKey: ['friends', 'list'],
    queryFn: async () => {
      const response = await friendsAPI.getFriends();
      if (response.data) {
        setFriends(response.data);
      }
      return response.data || [];
    },
  });
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();
  const { removeFriend } = useFriendStore();

  return useMutation({
    mutationFn: (friendId: string) => friendsAPI.removeFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
};