import { create } from 'zustand';
import type { FriendRequest, User, BlockedUser } from '../types';

interface FriendState {
  friends: User[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  blockedUsers: BlockedUser[];
  isLoading: boolean;

  setFriends: (friends: User[]) => void;
  addFriend: (friend: User) => void;
  removeFriend: (friendId: string) => void;

  setPendingRequests: (requests: FriendRequest[]) => void;
  addPendingRequest: (request: FriendRequest) => void;
  removePendingRequest: (requestId: string) => void;

  setSentRequests: (requests: FriendRequest[]) => void;
  addSentRequest: (request: FriendRequest) => void;
  removeSentRequest: (requestId: string) => void;

  setBlockedUsers: (users: BlockedUser[]) => void;
  addBlockedUser: (user: BlockedUser) => void;
  removeBlockedUser: (userId: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  blockedUsers: [],
  isLoading: false,

  setFriends: (friends) => set({ friends }),

  addFriend: (friend) =>
    set((state) => {
      const exists = state.friends.some((f) => f.id === friend.id);
      if (exists) {
        return {
          friends: state.friends.map((f) => (f.id === friend.id ? { ...f, ...friend } : f)),
        };
      }
      return { friends: [friend, ...state.friends] };
    }),

  removeFriend: (friendId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== friendId),
    })),

  setPendingRequests: (requests) => set({ pendingRequests: requests }),

  addPendingRequest: (request) =>
    set((state) => {
      const exists = state.pendingRequests.some((r) => r.id === request.id);
      if (exists) return state;
      return { pendingRequests: [request, ...state.pendingRequests] };
    }),

  removePendingRequest: (requestId) =>
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
    })),

  setSentRequests: (requests) => set({ sentRequests: requests }),

  addSentRequest: (request) =>
    set((state) => {
      const exists = state.sentRequests.some((r) => r.id === request.id);
      if (exists) return state;
      return { sentRequests: [request, ...state.sentRequests] };
    }),

  removeSentRequest: (requestId) =>
    set((state) => ({
      sentRequests: state.sentRequests.filter((r) => r.id !== requestId),
    })),

  setBlockedUsers: (users) => set({ blockedUsers: users }),

  addBlockedUser: (user) =>
    set((state) => {
      const exists = state.blockedUsers.some((u) => u.id === user.id);
      if (exists) return state;
      return {
        blockedUsers: [user, ...state.blockedUsers],
        friends: state.friends.filter((f) => f.id !== user.id),
      };
    }),

  removeBlockedUser: (userId) =>
    set((state) => ({
      blockedUsers: state.blockedUsers.filter((u) => u.id !== userId),
    })),

  setLoading: (isLoading) => set({ isLoading }),
}));