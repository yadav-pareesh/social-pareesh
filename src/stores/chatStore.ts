import { create } from 'zustand';
import type { Message, Conversation } from '../types';

interface ChatState {
  conversations: Map<string, Conversation>;
  messages: Map<string, Message[]>;
  activeConversationId: string | null;
  typingUsers: Set<string>;
  onlineUsers: Set<string>;

  // Conversations
  setConversations: (conversations: Conversation[]) => void;
  updateConversation: (conversation: Conversation) => void;
  setActiveConversation: (conversationId: string | null) => void;
  hydrate: () => void;

  // Messages
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  editMessage: (conversationId: string, messageId: string, content: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
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
  typingUsers: new Set(),
  onlineUsers: new Set(),

  setConversations: (conversations) => {
    const conversationMap = new Map(conversations.map((c) => [c.id, c]));
    set({ conversations: conversationMap });
  },

  updateConversation: (conversation) => {
    set((state) => {
      const newConversations = new Map(state.conversations);
      newConversations.set(conversation.id, conversation);
      return { conversations: newConversations };
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
      const messages = state.messages.get(conversationId) || [];
      const existing = messages.some((msg) => msg.id === message.id);
      if (existing) {
        return { messages: state.messages };
      }
      const newMessages = new Map(state.messages);
      newMessages.set(conversationId, [...messages, message]);
      return { messages: newMessages };
    });
  },

  editMessage: (conversationId, messageId, content) => {
    set((state) => {
      const messages = state.messages.get(conversationId) || [];
      const newMessages = new Map(state.messages);
      newMessages.set(
        conversationId,
        messages.map((msg) =>
          msg.id === messageId
            ? { ...msg, content, editedAt: new Date() }
            : msg
        )
      );
      return { messages: newMessages };
    });
  },

  deleteMessage: (conversationId, messageId) => {
    set((state) => {
      const messages = state.messages.get(conversationId) || [];
      const newMessages = new Map(state.messages);
      newMessages.set(
        conversationId,
        messages.map((msg) =>
          msg.id === messageId
            ? { ...msg, deletedAt: new Date() }
            : msg
        )
      );
      return { messages: newMessages };
    });
  },

  markMessageAsRead: (conversationId, messageId, userId) => {
    set((state) => {
      const messages = state.messages.get(conversationId) || [];
      const newMessages = new Map(state.messages);
      newMessages.set(
        conversationId,
        messages.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                readBy: Array.from(new Set([...msg.readBy, userId])),
              }
            : msg
        )
      );
      return { messages: newMessages };
    });
  },

  setTypingUser: (userId, conversationId, isTyping) => {
    set((state) => {
      const key = `${conversationId}:${userId}`;
      const newTypingUsers = new Set(state.typingUsers);
      if (isTyping) {
        newTypingUsers.add(key);
      } else {
        newTypingUsers.delete(key);
      }
      return { typingUsers: newTypingUsers };
    });
  },

  getTypingUsers: (conversationId) => {
    const typingUsers = get().typingUsers;
    return Array.from(typingUsers)
      .filter((key) => key.startsWith(`${conversationId}:`))
      .map((key) => key.split(':')[1]);
  },

  setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),

  addOnlineUser: (userId) => {
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.add(userId);
      return { onlineUsers: newOnlineUsers };
    });
  },

  removeOnlineUser: (userId) => {
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.delete(userId);
      return { onlineUsers: newOnlineUsers };
    });
  },

  isUserOnline: (userId) => {
    return get().onlineUsers.has(userId);
  },
}));