import * as React from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useGetConversations } from '../../hooks/useChat';
import { ChatListItem } from './ChatListItem';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

export const ChatList = () => {
  const { user } = useAuthStore();
  const { data: serverConversations, isLoading } = useGetConversations();
  const { conversations, setConversations, activeConversationId } = useChatStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  // Populate Zustand store from server query
  React.useEffect(() => {
    if (serverConversations && serverConversations.length > 0) {
      setConversations(serverConversations);
    }
  }, [serverConversations, setConversations]);

  React.useEffect(() => {
    if (sidebarOpen) {
      toggleSidebar();
    }
  }, [activeConversationId]);

  // Convert Map to Array (Maintains descending order)
  const conversationList = React.useMemo(() => {
    return Array.from(conversations.values());
  }, [conversations]);

  if (isLoading && conversationList.length === 0) {
    return <div className="p-4 text-xs text-muted-foreground">Loading conversations...</div>;
  }

  if (conversationList.length === 0) {
    return <div className="p-4 text-center text-xs text-muted-foreground">No conversations yet</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 h-full divide-y divide-border/40">
      {conversationList.map((conversation) => (
        <ChatListItem
          key={conversation.id}
          conversation={conversation}
          isActive={activeConversationId === conversation.id}
          currentUserId={user?.id || ''}
        />
      ))}
    </div>
  );
};