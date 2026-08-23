import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { getSocket } from '../services/socket';
import { apiClient } from '../lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import type { Message, Conversation, User } from '../types';
import { useNotificationStore } from '@/stores/notificationStore';
import { notificationService } from '@/services/notificationService';

export const useSocket = () => {
  const { user } = useAuthStore();
  const { activeConversationId } = useChatStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();

    const handleConnect = async () => {
      socket.emit('user:login', { userId: user.id });

      // CRITICAL FIX: Join ALL conversation rooms immediately upon login.
      // If we don't do this, users on the ChatList screen won't receive ANY real-time events.
      const conversations = useChatStore.getState().conversations;
      conversations.forEach((conv) => {
        socket.emit('conversation:join', { conversationId: conv.id });
      });

      // Still handle the active one specifically just in case
      const currentActiveId = useChatStore.getState().activeConversationId;
      if (currentActiveId && !conversations.has(currentActiveId)) {
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
      
      const isViewing = currentActiveId === message.conversationId;
      const isOwnMessage = message.senderId === user?.id;
      const isAppFocused = document.hasFocus(); 

      useChatStore.getState().addMessage(message.conversationId, message);
      useChatStore.getState().setTypingUser(message.senderId, message.conversationId, false);
      window.dispatchEvent(new CustomEvent('newMessage', { detail: message }));
      
      queryClient.setQueryData(['messages', message.conversationId], (old: Message[] | undefined) => {
        if (!old) return [message];
        if (old.some((m) => m.id === message.id)) return old;

        // Find the temp message to see if it was already marked as read
        const tempMsg = old.find(
          (m) =>
            m.id.startsWith('temp-') &&
            m.senderId === message.senderId &&
            m.content === message.content
        );

        const withoutTemp = old.filter((m) => m !== tempMsg);
        
        // CRITICAL FIX: Inherit readBy from the temp message to survive race conditions!
        const mergedMessage = {
           ...message,
           readBy: tempMsg 
             ? Array.from(new Set([...(message.readBy || []), ...(tempMsg.readBy || [])])) 
             : message.readBy
        };

        return [...withoutTemp, mergedMessage];
      });

      if (!isOwnMessage) {
        if (isAppFocused && isViewing) {
          socket.emit('message:read', {
            conversationId: message.conversationId,
            messageId: message.id,
            userId: user.id, 
          });

          if (useNotificationStore.getState().inChatSoundEnabled) {
            notificationService.playSound('message', false, 0.3);
          }
        } else if (isAppFocused && !isViewing) {
          notificationService.playSound('message');
        } else if (!isAppFocused) {
          // SITUATION C: User is away (minimized tab or looking at another window)
          notificationService.playSound('message');
          notificationService.vibrate();
          
          // Get the sender's details synchronously from Zustand (No React Query overhead!)
          const conversation = useChatStore.getState().conversations.get(message.conversationId);
          const otherUser = conversation?.user1Id === user.id ? conversation?.user2 : conversation?.user1;
          const senderName = otherUser?.username || 'someone';
          
          // Show desktop toast with actual sender name and profile pic
          notificationService.notify(
            `New message from ${senderName}`, 
            message.content,
            otherUser?.profilePicUrl
          );
        }
      }

      queryClient.setQueryData(['conversations'], (oldConvs: Conversation[] | undefined) => {
        if (!oldConvs) return oldConvs;
        
        const target = oldConvs.find((c) => c.id === message.conversationId);
        if (!target) {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          return oldConvs;
        }

        const updated: Conversation = {
          ...target,
          lastMessage: message,
          lastMessageTime: message.createdAt,
          unreadCount: isViewing 
            ? 0 
            : isOwnMessage 
              ? (target.unreadCount || 0) 
              : (target.unreadCount || 0) + 1,
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
      
      // 1. Update Zustand
      if (data.messageId) {
        useChatStore.getState().markMessageAsRead(data.conversationId, data.messageId, data.userId);
      } else {
        useChatStore.getState().markConversationAsRead(data.conversationId, data.userId);
      }

      // 2. Update React Query Messages Cache (With Watermark Logic)
      queryClient.setQueryData(['messages', data.conversationId], (old: Message[] | undefined) => {
        if (!old) return old;

        // Find the watermark time limit
        let targetTime = Infinity; // If no messageId, assume joining chat (mark all read)
        if (data.messageId) {
          const targetMsg = old.find((m) => m.id === data.messageId);
          if (targetMsg) {
            targetTime = new Date(targetMsg.createdAt).getTime();
          }
        }

        return old.map((msg) => {
          const msgTime = new Date(msg.createdAt).getTime();
          
          // Apply read receipt to this message AND all older messages
          if (msgTime <= targetTime) {
            return {
              ...msg,
              readBy: Array.from(new Set([...(msg.readBy || []), data.userId])),
            };
          }
          return msg;
        });
      });

      // 3. Clear Unread Badges in Conversation List
      queryClient.setQueryData(['conversations'], (oldConvs: Conversation[] | undefined) => {
        if (!oldConvs) return oldConvs;
        return oldConvs.map((c) => (c.id === data.conversationId ? { ...c, unreadCount: 0 } : c));
      });
    };

    // 3. TYPING HANDLERS
    const handleTypingEvent = (data: { userId: string; conversationId?: string; isTyping?: boolean; }, isTyping: boolean) => {
      const activeId = data.conversationId || useChatStore.getState().activeConversationId;
      if (!activeId || data.userId === user.id) return;
      useChatStore.getState().setTypingUser(data.userId, activeId, isTyping);
    };

    // 4. EDIT MESSAGE HANDLER
    const handleMessageEdit = (updatedMessage: Message) => {
      console.log('📥 SOCKET RECEIVED EDIT:', updatedMessage);
      if (!updatedMessage.conversationId) {
        console.error('❌ ERROR: Backend returned edited message without a conversationId!', updatedMessage);
        return; 
      }
      useChatStore.getState().editMessage(
        updatedMessage.conversationId, 
        updatedMessage.id, 
        updatedMessage.content
      );

      queryClient.setQueryData(
        ['messages', updatedMessage.conversationId], 
        (oldMessages: Message[] | undefined) => {
          if (!oldMessages) return oldMessages;
          
          return oldMessages.map((msg) => 
            msg.id === updatedMessage.id 
              ? { ...msg, content: updatedMessage.content, editedAt: updatedMessage.editedAt } 
              : msg
          );
        }
      );

      queryClient.setQueryData(
        ['conversations'], 
        (oldConvs: Conversation[] | undefined) => {
          if (!oldConvs) return oldConvs;

          return oldConvs.map((conv) => {
            if (conv.id === updatedMessage.conversationId && conv.lastMessage?.id === updatedMessage.id) {
              return {
                ...conv,
                lastMessage: {
                  ...conv.lastMessage,
                  content: updatedMessage.content,
                  editedAt: updatedMessage.editedAt
                }
              };
            }
            return conv;
          });
        }
      );
    };

    // 5. DELETE MESSAGE HANDLER
    const handleMessageDelete = (data: { messageId: string, conversationId: string }) => {
      useChatStore.getState().deleteMessage(data.conversationId, data.messageId);

      queryClient.setQueryData(
        ['messages', data.conversationId], 
        (oldMessages: Message[] | undefined) => {
          if (!oldMessages) return oldMessages;
          return oldMessages.map((msg) => 
            msg.id === data.messageId ? { ...msg, deletedAt: new Date(), content: '' } : msg
          );
        }
      );
    };

    const onTypingStart = (data: any) => handleTypingEvent(data, true);
    const onTypingStop = (data: any) => handleTypingEvent(data, false);
    const onTypingIndicator = (data: any) => handleTypingEvent(data, Boolean(data.isTyping));

    // 6. ONLINE STATUS
    const handleUserOnline = (data: { userId: string }) => useChatStore.getState().addOnlineUser(data.userId);
    const handleUserOffline = (data: { userId: string }) => useChatStore.getState().removeOnlineUser(data.userId);

    // Socket Bindings
    socket.on('connect', handleConnect);
    socket.on('message:new', handleNewMessage);
    socket.on('message:read', handleMessageRead);
    socket.on('message:updated', handleMessageEdit); 
    socket.on('message:deleted', handleMessageDelete); 
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
      socket.off('message:updated', handleMessageEdit);
      socket.off('message:deleted', handleMessageDelete);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('typing:indicator', onTypingIndicator);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
    };
  }, [user?.id, queryClient]);

  // Handle Active Room Reading
  useEffect(() => {
    if (!activeConversationId || !user?.id) return;

    const socket = getSocket();

    const joinAndRead = () => {
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

    useChatStore.getState().addMessage(conversationId, tempMessage);

    queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => (old ? [...old, tempMessage] : [tempMessage]));

    queryClient.setQueryData(['conversations'], (oldData: Conversation[] | undefined) => {
      if (!oldData) return oldData;
      const target = oldData.find((c) => c.id === conversationId);
      if (!target) return oldData;
      const updated: Conversation = { ...target, lastMessage: tempMessage, lastMessageTime: now };
      return [updated, ...oldData.filter((c) => c.id !== conversationId)];
    });

    try {
      if (!socket.connected) await new Promise<void>((resolve) => socket.once('connect', () => resolve()));
      socket.emit('message:send', { conversationId, senderId: user.id, content, parentMessageId });
    } catch (error) {
      console.error('Failed to send message via socket:', error);
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      throw error;
    }
  };
};

// NEW: Socket Hook for Editing Messages
export const useEditSocketMessage = () => {
  const socket = getSocket();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return (conversationId: string, messageId: string, content: string) => {
    if (!user?.id || !content.trim()) return;

    // Optimistically update UI instantly
    useChatStore.getState().editMessage(conversationId, messageId, content);

    queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
      if (!old) return old;
      return old.map(m => m.id === messageId ? { ...m, content, editedAt: new Date() } : m);
    });

    // Emit the event to the backend so the other user receives it
    socket.emit('message:edit', {
      messageId,
      senderId: user.id,
      content,
      conversationId // Critical for backend io.to().emit()
    });
  };
};

// NEW: Socket Hook for Deleting Messages
export const useDeleteSocketMessage = () => {
  const socket = getSocket();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return (conversationId: string, messageId: string) => {
    if (!user?.id) return;

    // Optimistically remove from UI instantly
    useChatStore.getState().deleteMessage(conversationId, messageId);

    queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
      if (!old) return old;
      return old.map(m => 
        m.id === messageId ? { ...m, deletedAt: new Date(), content: '' } : m
      );
    });

    socket.emit('message:delete', {
      messageId,
      senderId: user.id,
      conversationId
    });
  };
};

// Typing Hook
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