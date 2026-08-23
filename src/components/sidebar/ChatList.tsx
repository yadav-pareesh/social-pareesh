import * as React from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useGetConversations } from '../../hooks/useChat';
import { ChatListItem } from './ChatListItem';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { MessageSquareOff } from 'lucide-react';

export const ChatList = () => {
  const { user } = useAuthStore();
  
  // Use React Query as the single source of truth for the UI
  const { data: conversations, isLoading } = useGetConversations(); 
  
  const { setConversations, activeConversationId } = useChatStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  // Keep Zustand quietly synced in the background for other components that might need it
  React.useEffect(() => {
    if (conversations && conversations.length > 0) {
      setConversations(conversations);
    }
  }, [conversations, setConversations]);

  // Close sidebar on mobile when a chat is selected
  React.useEffect(() => {
    if (sidebarOpen && activeConversationId) {
      toggleSidebar();
    }
  }, [activeConversationId, sidebarOpen, toggleSidebar]);

  if (isLoading && (!conversations)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground space-y-3">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading chats...</p>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground space-y-3">
        <div className="bg-muted p-3 rounded-full">
          <MessageSquareOff className="h-6 w-6 opacity-70" />
        </div>
        <p className="text-sm">No conversations yet.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 h-full divide-y divide-border/40 custom-scrollbar">
      {/* Map directly over the React Query data for instant socket updates */}
      {conversations.map((conversation) => (
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