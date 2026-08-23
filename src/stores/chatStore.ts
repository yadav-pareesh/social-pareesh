import { create } from 'zustand';
import type { Message, Conversation } from '../types';
import { useAuthStore } from './authStore';

interface ChatState {
  conversations: Map<string, Conversation>;
  messages: Map<string, Message[]>;
  activeConversationId: string | null;
  typingUsers: Record<string, string[]>;
  onlineUsers: Set<string>;

  // Conversations
  setConversations: (conversations: Conversation[]) => void;
  updateConversation: (conversation: Partial<Conversation> & { id: string }) => void;
  setActiveConversation: (conversationId: string | null) => void;
  hydrate: () => void;

  // Messages
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  editMessage: (conversationId: string, messageId: string, content: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  markConversationAsRead: (conversationId: string, userId: string) => void;
  markMessageAsRead: (conversationId: string, messageId: string, userId: string) => void;

  // Typing
  setTypingUser: (userId: string, conversationId: string, isTyping: boolean) => void;
  getTypingUsers: (conversationId: string) => string[];

  // Online Status
  setOnlineUsers: (userIds: Set<string>) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
  isUserOnline: (userId: string) => boolean;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: new Map(),
  messages: new Map(),
  activeConversationId: localStorage.getItem('activeConversationId'),
  typingUsers: {},
  onlineUsers: new Set(),

  setConversations: (conversations) => {
    const sorted = [...conversations].sort((a, b) => {
      const timeA = new Date(a.lastMessageTime || a.lastMessage?.createdAt || 0).getTime();
      const timeB = new Date(b.lastMessageTime || b.lastMessage?.createdAt || 0).getTime();
      return timeB - timeA;
    });
    set({ conversations: new Map(sorted.map((c) => [c.id, c])) });
  },

  updateConversation: (updated) => {
    set((state) => {
      const existing = state.conversations.get(updated.id);
      if (!existing) return state;

      const merged: Conversation = { ...existing, ...updated };
      const newMap = new Map<string, Conversation>();
      newMap.set(merged.id, merged);

      for (const [id, conv] of state.conversations.entries()) {
        if (id !== updated.id) newMap.set(id, conv);
      }
      return { conversations: newMap };
    });
  },

  setActiveConversation: (conversationId) => {
    if (conversationId) {
      localStorage.setItem('activeConversationId', conversationId);
    } else {
      localStorage.removeItem('activeConversationId');
    }
    set({ activeConversationId: conversationId });
  },

  hydrate: () => {
    const conversationId = localStorage.getItem('activeConversationId');
    set({ activeConversationId: conversationId });
  },

  setMessages: (conversationId, messages) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      newMessages.set(conversationId, messages);
      return { messages: newMessages };
    });
  },

  addMessage: (conversationId, message) => {
  set((state) => {
    const currentList = state.messages.get(conversationId) || [];
    
    // Check if real message already exists
    const exactMatch = currentList.some((m) => m.id === message.id);
    if (exactMatch) return state;

    let updatedList: Message[];

    // If incoming message is confirmed from server, remove any matching optimistic temp message
    if (!message.id.startsWith('temp-')) {
      const hasTempMatch = currentList.some(
        (m) =>
          m.id.startsWith('temp-') &&
          m.senderId === message.senderId &&
          m.content === message.content
      );

      if (hasTempMatch) {
        let replaced = false;
        updatedList = currentList.map((m) => {
          if (
            !replaced &&
            m.id.startsWith('temp-') &&
            m.senderId === message.senderId &&
            m.content === message.content
          ) {
            replaced = true;
            return { 
              ...message, 
              // CRITICAL FIX: Merge the arrays to keep the read receipts!
              readBy: Array.from(new Set([...(message.readBy || []), ...(m.readBy || [])])) 
            };
          }
          return m;
        });
      } else {
        updatedList = [...currentList, message];
      }
    } else {
      updatedList = [...currentList, message];
    }

    const newMessages = new Map(state.messages);
    newMessages.set(conversationId, updatedList);

    // Float conversation to top and calculate intelligent unread count
    const existingConv = state.conversations.get(conversationId);
    const newConversations = new Map<string, Conversation>();

    if (existingConv) {
      const isViewing = state.activeConversationId === conversationId;
      const currentUserId = useAuthStore.getState().user?.id;
      const isOwnMessage = message.senderId === currentUserId;

      // Smart calculation: 
      // 1. If currently viewing, it's 0.
      // 2. If it's my own message, leave the count exactly as it was.
      // 3. Otherwise (it's from them and I'm not viewing), increment by 1.
      const newUnreadCount = isViewing 
        ? 0 
        : isOwnMessage 
          ? (existingConv.unreadCount || 0) 
          : (existingConv.unreadCount || 0) + 1;

      const updatedConv: Conversation = {
        ...existingConv,
        lastMessage: message,
        lastMessageTime: message.createdAt,
        unreadCount: newUnreadCount,
      };

      newConversations.set(conversationId, updatedConv);
      for (const [id, conv] of state.conversations.entries()) {
        if (id !== conversationId) newConversations.set(id, conv);
      }
    } else {
      for (const [id, conv] of state.conversations.entries()) {
        newConversations.set(id, conv);
      }
    }

    return { messages: newMessages, conversations: newConversations };
  });
},

  editMessage: (conversationId, messageId, content) => {
    set((state) => {
      const currentList = state.messages.get(conversationId) || [];
      const newMessages = new Map(state.messages);
      newMessages.set(
        conversationId,
        currentList.map((m) =>
          m.id === messageId ? { ...m, content, editedAt: new Date() } : m
        )
      );
      return { messages: newMessages };
    });
  },

  deleteMessage: (conversationId, messageId) => {
    set((state) => {
      const currentList = state.messages.get(conversationId) || [];
      const newMessages = new Map(state.messages);
      newMessages.set(
        conversationId,
        currentList.map((m) => m.id === messageId ? { ...m, deletedAt: new Date(), content: '' } : m)
      );
      return { messages: newMessages };
    });
  },

  markConversationAsRead: (conversationId, userId) => {
    set((state) => {
      const currentList = state.messages.get(conversationId) || [];
      const updatedMessages = currentList.map((msg) => ({
        ...msg,
        readBy: Array.from(new Set([...(msg.readBy || []), userId])),
      }));

      const newMessages = new Map(state.messages);
      newMessages.set(conversationId, updatedMessages);

      const newConversations = new Map(state.conversations);
      const conv = newConversations.get(conversationId);
      if (conv) {
        newConversations.set(conversationId, { ...conv, unreadCount: 0 });
      }

      return { messages: newMessages, conversations: newConversations };
    });
  },

  markMessageAsRead: (conversationId, messageId, userId) => {
    set((state) => {
      const currentList = state.messages.get(conversationId) || [];
  
      const targetMsg = currentList.find(m => m.id === messageId);
      const targetTime = targetMsg ? new Date(targetMsg.createdAt).getTime() : 0;

      const newMessages = new Map(state.messages);
      newMessages.set(
        conversationId,
        currentList.map((m) => {
          const msgTime = new Date(m.createdAt).getTime();
          if (msgTime <= targetTime) {
            return { 
              ...m, 
              readBy: Array.from(new Set([...(m.readBy || []), userId])) 
            };
          }
          return m;
        })
      );
      return { messages: newMessages };
    });
  },

  setTypingUser: (userId, conversationId, isTyping) => {
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      let updated: string[];

      if (isTyping) {
        updated = Array.from(new Set([...current, userId]));
      } else {
        updated = current.filter((id) => id !== userId);
      }

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updated,
        },
      };
    });
  },

  getTypingUsers: (conversationId) => {
    const typingMap = get().typingUsers;
    return typingMap[conversationId] || [];
  },

  setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),
  addOnlineUser: (userId) =>
    set((state) => ({ onlineUsers: new Set(state.onlineUsers).add(userId) })),
  removeOnlineUser: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),
  isUserOnline: (userId) => get().onlineUsers.has(userId),
}));