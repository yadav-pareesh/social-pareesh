import { useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Message } from '@/types';
import { useGetConversations } from './useChat';

const lastNotificationTime: { [key: string]: number } = {};

export const useMessageNotification = (onNewMessage: (message: Message) => void) => {
  const { user } = useAuthStore();
  const { activeConversationId } = useChatStore();
  const { isEnabled:isNotificationEnabled } = useNotificationStore();
  
  const { data: conversations = [] } = useGetConversations();
  const conversation =    conversations?.find((c:any)=>c.id === activeConversationId);
  const otherUser = conversation?.user1Id === user?.id
      ? conversation?.user2
      : conversation?.user1;

  useEffect(() => {
    // Request permission on mount
    notificationService.requestPermission();
  }, []);

  useEffect(() => {
    // Skip if notifications are disabled
    if (!isNotificationEnabled) {
      return;
    }

    const handleMessage = (event:any) => {
      const { conversationId, senderId, content } = event.detail;
      if (user && senderId === user.id) return;
      if (document.hasFocus() && activeConversationId === conversationId) return;

      const key = `msg-${conversationId}`;
      const now = Date.now();

      if (!lastNotificationTime[key] || now - lastNotificationTime[key] > 1000) {
        lastNotificationTime[key] = now;

        // Play custom sound based on message type
        // if (type === 'friend-request') {
        //   notificationService.playSound('friend-request');
        // } else if (type === 'typing') {
        //   notificationService.playSound('typing');
        // } else {
        //   notificationService.playSound('message');
        // }
        
        notificationService.playSound('message');
        notificationService.vibrate();
        notificationService.notify(
          `New message from ${otherUser?.username}`,
          content.substring(0, 100),
          otherUser?.profilePicUrl
        );
      }

      onNewMessage(event.detail);
    };

     window.addEventListener('newMessage', handleMessage);
    return () => window.removeEventListener('newMessage', handleMessage);
  }, [user?.id, activeConversationId, onNewMessage, isNotificationEnabled]);
};