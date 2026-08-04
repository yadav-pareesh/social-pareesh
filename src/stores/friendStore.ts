import { create } from 'zustand';
import type { FriendRequest, User } from '../types';

interface FriendState {
  friends: User[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  blockedUsers: User[];

  setFriends: (friends: User[]) => void;
  addFriend: (friend: User) => void;
  removeFriend: (friendId: string) => void;

  setPendingRequests: (requests: FriendRequest[]) => void;
  addPendingRequest: (request: FriendRequest) => void;
  removePendingRequest: (requestId: string) => void;

  setSentRequests: (requests: FriendRequest[]) => void;
  addSentRequest: (request: FriendRequest) => void;
  removeSentRequest: (requestId: string) => void;

  setBlockedUsers: (users: User[]) => void;
  blockUser: (user: User) => void;
  unblockUser: (userId: string) => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  blockedUsers: [],

  setFriends: (friends) => set({ friends }),

  addFriend: (friend) =>
    set((state) => ({
      friends: Array.from(new Set([...state.friends, friend])),
    })),

  removeFriend: (friendId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== friendId),
    })),

  setPendingRequests: (requests) => set({ pendingRequests: requests }),

  addPendingRequest: (request) =>
    set((state) => ({
      pendingRequests: [...state.pendingRequests, request],
    })),

  removePendingRequest: (requestId) =>
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
    })),

  setSentRequests: (requests) => set({ sentRequests: requests }),

  addSentRequest: (request) =>
    set((state) => ({
      sentRequests: [...state.sentRequests, request],
    })),

  removeSentRequest: (requestId) =>
    set((state) => ({
      sentRequests: state.sentRequests.filter((r) => r.id !== requestId),
    })),

  setBlockedUsers: (users) => set({ blockedUsers: users }),

  blockUser: (user) =>
    set((state) => ({
      blockedUsers: [...state.blockedUsers, user],
    })),

  unblockUser: (userId) =>
    set((state) => ({
      blockedUsers: state.blockedUsers.filter((u) => u.id !== userId),
    })),
}));