import { useChatStore } from '../../stores/chatStore';
import { useGetConversations } from '../../hooks/useChat';
import { ChatListItem } from './ChatListItem';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useEffect } from 'react';

export const ChatList = () => {
  const { user } = useAuthStore();
  const { data: conversations = [], isLoading } = useGetConversations();
  const { activeConversationId } = useChatStore();

  const { sidebarOpen, toggleSidebar } = useUIStore();

  useEffect(()=>{
    if(sidebarOpen){
      toggleSidebar()
    }
  },[activeConversationId])

  if (isLoading) {
    return <div className="p-4">Loading conversations...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto">
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