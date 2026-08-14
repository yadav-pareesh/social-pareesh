import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { getSocket } from '../services/socket';
import { messagesAPI } from '../services/api/messages';
import { apiClient } from '../lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import type { Message, Conversation } from '../types';

export const useSocket = () => {
  const { user } = useAuthStore();
  const { activeConversationId } = useChatStore();
  const {
    addMessage,
    setTypingUser,
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
    markMessageAsRead,
    updateConversation,
  } = useChatStore();
  const queryClient = useQueryClient();
  const listenersSetUp = useRef(false);

  useEffect(() => {
    if (!user || listenersSetUp.current) return;

    const socket = getSocket();
    listenersSetUp.current = true;

    socket.on('connect', async () => {
      socket.emit('user:login', { userId: user.id });

      try {
        const onlineResponse = await apiClient.get('/users/online');
        if (onlineResponse.data && Array.isArray(onlineResponse.data)) {
          setOnlineUsers(new Set(onlineResponse.data.map((onlineUser: { id: string }) => onlineUser.id)));
        }
      } catch (error) {
        console.warn('Unable to fetch online users:', error);
      }
    });

    // Message events
    socket.on('message:new', (message: Message) => {
      addMessage(message.conversationId, message);
      window.dispatchEvent(
        new CustomEvent('newMessage', {
          detail: message,
        })
      );
      // Update messages cache
      queryClient.setQueryData(['messages', message.conversationId], (oldData: Message[] | undefined) => {
        if (!oldData) {
          return [message];
        }

        const existing = oldData.some((msg: Message) => msg.id === message.id);
        if (existing) return oldData;

        return [...oldData, message];
      });

      // Update unread count for the conversation if message is from another user
      // AND the user is not actively viewing this conversation
      if (message.senderId !== user.id && message.conversationId !== activeConversationId) {
        queryClient.setQueryData(['conversations'], (oldData: Conversation[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((conv: Conversation) =>
            conv.id === message.conversationId
              ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
              : conv
          );
        });
      }
    });

    socket.on('message:updated', (message: Message) => {
      // Update messages cache
      queryClient.setQueryData(['messages', message.conversationId], (oldData: Message[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((msg: Message) =>
          msg.id === message.id ? { ...msg, content: message.content, editedAt: message.editedAt } : msg
        );
      });
    });

    socket.on('message:deleted', (data: { messageId: string; conversationId: string }) => {
      // Update messages cache
      queryClient.setQueryData(['messages', data.conversationId], (oldData: Message[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter((msg: Message) => msg.id !== data.messageId);
      });
    });

    // Typing indicator
    const applyTypingState = (data: { userId: string; conversationId?: string; isTyping?: boolean }, isTyping: boolean) => {
      const conversationId = data.conversationId || activeConversationId;
      if (!conversationId) return;
      setTypingUser(data.userId, conversationId, isTyping);
    };

    socket.on('typing:indicator', (data: { userId: string; conversationId?: string; isTyping: boolean }) => {
      applyTypingState(data, data.isTyping);
    });

    socket.on('typing:start', (data: { userId: string; conversationId?: string }) => {
      applyTypingState(data, true);
    });

    socket.on('typing:stop', (data: { userId: string; conversationId?: string }) => {
      applyTypingState(data, false);
    });

    // Online status
    socket.on('user:online', (data: { userId: string }) => {
      addOnlineUser(data.userId);
      queryClient.setQueryData(['onlineStatus', data.userId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            status: 'online',
          },
        };
      });
    });

    socket.on('user:offline', (data: { userId: string }) => {
      removeOnlineUser(data.userId);
      queryClient.setQueryData(['onlineStatus', data.userId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            status: 'offline',
          },
        };
      });
    });

    // Read receipts
    socket.on('message:read', (data: { messageId: string; userId: string; conversationId: string; readBy: string[] }) => {
      // Invalidate the query to force a refresh - this triggers useConversationMessages to refetch
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
      
      // Decrement unread count for the conversation
      queryClient.setQueryData(['conversations'], (oldData: Conversation[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((conv) =>
          conv.id === data.conversationId
            ? { ...conv, unreadCount: Math.max(0, (conv.unreadCount || 1) - 1) }
            : conv
        );
      });
    });

    return () => {
      socket.removeAllListeners();
      listenersSetUp.current = false;
    };
  }, [user, activeConversationId, addMessage, setTypingUser, setOnlineUsers, addOnlineUser, removeOnlineUser, markMessageAsRead, updateConversation, queryClient]);

  useEffect(() => {
    if (!activeConversationId) return;

    const socket = getSocket();

    const joinRoom = () => {
      socket.emit('conversation:join', { conversationId: activeConversationId });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
    }

    return () => {
      socket.emit('conversation:leave', { conversationId: activeConversationId });
    };
  }, [activeConversationId]);

  return getSocket();
};

export const useSendMessage = () => {
  const socket = getSocket();
  const { user } = useAuthStore();

  return async (conversationId: string, content: string) => {
    if (!user?.id) return;

    try {
      if (!socket.connected) {
        await new Promise<void>((resolve) => {
          socket.once('connect', () => resolve());
        });
      }

      socket.emit('conversation:join', { conversationId });

      // Only emit via socket - the socket handler will save to DB and broadcast to all users
      socket.emit('message:send', {
        conversationId,
        senderId: user.id,
        content,
      });

      // The message will be received back via 'message:new' event and added to cache
      // No need to make HTTP call - socket handler handles it
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };
};

export const useTypingIndicator = (conversationId: string) => {
  const socket = getSocket();
  const { user } = useAuthStore();
  
  const startTyping = () => {
    if (!user?.id) return;
    socket.emit('typing:start', { conversationId, userId: user.id });
  };

  const stopTyping = () => {
    if (!user?.id) return;
    socket.emit('typing:stop', { conversationId, userId: user.id });
  };

  return { startTyping, stopTyping };
};