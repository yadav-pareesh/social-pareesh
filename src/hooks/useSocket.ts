import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { getSocket } from '../services/socket';
import { apiClient } from '../lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import type { Message, Conversation, User } from '../types';

export const useSocket = () => {
  const { user } = useAuthStore();
  const { activeConversationId } = useChatStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();

    const handleConnect = async () => {
      socket.emit('user:login', { userId: user.id });

      const currentActiveId = useChatStore.getState().activeConversationId;
      if (currentActiveId) {
        socket.emit('conversation:join', { conversationId: currentActiveId });
      }

      try {
        const res = await apiClient.get<User[]>('/users/online');
        if (res.data && Array.isArray(res.data)) {
          useChatStore.getState().setOnlineUsers(new Set(res.data.map((u) => u.id)));
        }
      } catch (err) {
        console.warn('Could not fetch online users:', err);
      }
    };

    // 1. INCOMING MESSAGE HANDLER
    const handleNewMessage = (message: Message) => {
      const currentActiveId = useChatStore.getState().activeConversationId;

      // Update Zustand Store (handles replacing temp messages)
      useChatStore.getState().addMessage(message.conversationId, message);

      // Stop typing status for the sender once message is received
      useChatStore.getState().setTypingUser(message.senderId, message.conversationId, false);

      window.dispatchEvent(new CustomEvent('newMessage', { detail: message }));

      // Update React Query cache replacing temp message
      queryClient.setQueryData(['messages', message.conversationId], (old: Message[] | undefined) => {
        if (!old) return [message];
        if (old.some((m) => m.id === message.id)) return old;

        const withoutTemp = old.filter(
          (m) =>
            !(
              m.id.startsWith('temp-') &&
              m.senderId === message.senderId &&
              m.content === message.content
            )
        );
        return [...withoutTemp, message];
      });

      // Acknowledge read if viewing
      if (currentActiveId === message.conversationId && message.senderId !== user.id) {
        socket.emit('message:read', {
          conversationId: message.conversationId,
          messageId: message.id,
          userId: user.id,
        });
      }

      // Reorder conversation list
      queryClient.setQueryData(['conversations'], (oldConvs: Conversation[] | undefined) => {
        if (!oldConvs) return oldConvs;
        const target = oldConvs.find((c) => c.id === message.conversationId);
        if (!target) {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          return oldConvs;
        }

        const isViewing = currentActiveId === message.conversationId;
        const updated: Conversation = {
          ...target,
          lastMessage: message,
          lastMessageTime: message.createdAt,
          unreadCount: isViewing || message.senderId === user.id ? 0 : (target.unreadCount || 0) + 1,
        };

        return [updated, ...oldConvs.filter((c) => c.id !== message.conversationId)];
      });
    };

    // 2. READ RECEIPT
    const handleMessageRead = (data: {
      conversationId: string;
      messageId?: string;
      userId: string;
    }) => {
      if (data.messageId) {
        useChatStore.getState().markMessageAsRead(data.conversationId, data.messageId, data.userId);
      } else {
        useChatStore.getState().markConversationAsRead(data.conversationId, data.userId);
      }

      queryClient.setQueryData(['messages', data.conversationId], (old: Message[] | undefined) => {
        if (!old) return old;
        return old.map((msg) => {
          if (!data.messageId || msg.id === data.messageId) {
            return {
              ...msg,
              readBy: Array.from(new Set([...(msg.readBy || []), data.userId])),
            };
          }
          return msg;
        });
      });

      queryClient.setQueryData(['conversations'], (oldConvs: Conversation[] | undefined) => {
        if (!oldConvs) return oldConvs;
        return oldConvs.map((c) => (c.id === data.conversationId ? { ...c, unreadCount: 0 } : c));
      });
    };

    // 3. TYPING HANDLERS (Handles both individual and indicator formats)
    const handleTypingEvent = (data: {
      userId: string;
      conversationId?: string;
      isTyping?: boolean;
    }, isTyping: boolean) => {
      const activeId = data.conversationId || useChatStore.getState().activeConversationId;
      if (!activeId || data.userId === user.id) return;
      useChatStore.getState().setTypingUser(data.userId, activeId, isTyping);
    };

    const onTypingStart = (data: any) => handleTypingEvent(data, true);
    const onTypingStop = (data: any) => handleTypingEvent(data, false);
    const onTypingIndicator = (data: any) => handleTypingEvent(data, Boolean(data.isTyping));

    // 4. ONLINE STATUS
    const handleUserOnline = (data: { userId: string }) => useChatStore.getState().addOnlineUser(data.userId);
    const handleUserOffline = (data: { userId: string }) => useChatStore.getState().removeOnlineUser(data.userId);

    // Socket Bindings
    socket.on('connect', handleConnect);
    socket.on('message:new', handleNewMessage);
    socket.on('message:read', handleMessageRead);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('typing:indicator', onTypingIndicator);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('message:new', handleNewMessage);
      socket.off('message:read', handleMessageRead);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('typing:indicator', onTypingIndicator);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
    };
  }, [user?.id, queryClient]);

  // Join Active Room & Emit Initial Read Event
  useEffect(() => {
    if (!activeConversationId || !user?.id) return;

    const socket = getSocket();

    const joinAndRead = () => {
      socket.emit('conversation:join', { conversationId: activeConversationId });
      socket.emit('message:read', {
        conversationId: activeConversationId,
        userId: user.id,
      });
      useChatStore.getState().markConversationAsRead(activeConversationId, user.id);
    };

    if (socket.connected) {
      joinAndRead();
    } else {
      socket.once('connect', joinAndRead);
    }

    return () => {
      socket.emit('conversation:leave', { conversationId: activeConversationId });
    };
  }, [activeConversationId, user?.id]);

  return getSocket();
};

// Optimistic Sender Hook
export const useSendMessage = () => {
  const socket = getSocket();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return async (conversationId: string, content: string, parentMessageId?: string) => {
    if (!user?.id || !content.trim()) return;

    const now = new Date();

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: user.id,
      content,
      createdAt: now,
      readBy: [user.id],
      parentMessageId,
    };

    // Add optimistic message
    useChatStore.getState().addMessage(conversationId, tempMessage);

    queryClient.setQueryData(
      ['messages', conversationId],
      (old: Message[] | undefined) => (old ? [...old, tempMessage] : [tempMessage])
    );

    queryClient.setQueryData(
      ['conversations'],
      (oldData: Conversation[] | undefined) => {
        if (!oldData) return oldData;
        const target = oldData.find((c) => c.id === conversationId);
        if (!target) return oldData;

        const updated: Conversation = {
          ...target,
          lastMessage: tempMessage,
          lastMessageTime: now,
        };

        return [updated, ...oldData.filter((c) => c.id !== conversationId)];
      }
    );

    try {
      if (!socket.connected) {
        await new Promise<void>((resolve) => {
          socket.once('connect', () => resolve());
        });
      }

      socket.emit('message:send', {
        conversationId,
        senderId: user.id,
        content,
        parentMessageId,
      });
    } catch (error) {
      console.error('Failed to send message via socket:', error);
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      throw error;
    }
  };
};

// Typing Hook emitting both event flavors for compatibility
export const useTypingIndicator = (conversationId: string) => {
  const socket = getSocket();
  const { user } = useAuthStore();

  const startTyping = () => {
    if (!user?.id || !conversationId) return;
    socket.emit('typing:start', { conversationId, userId: user.id });
    socket.emit('typing:indicator', { conversationId, userId: user.id, isTyping: true });
  };

  const stopTyping = () => {
    if (!user?.id || !conversationId) return;
    socket.emit('typing:stop', { conversationId, userId: user.id });
    socket.emit('typing:indicator', { conversationId, userId: user.id, isTyping: false });
  };

  return { startTyping, stopTyping };
};