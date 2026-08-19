import * as React from 'react';
import { ChatList } from './ChatList';
import { SearchUsers } from './SearchUsers';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { messagesAPI } from '../../services/api/messages';
import type { User } from '../../types';

export const Sidebar = () => {
  const { user } = useAuthStore();
  const { activeConversationId, conversations, setActiveConversation, updateConversation } = useChatStore();

  const activeConversation = Array.from(conversations.values()).find(
    (c) => c.id === activeConversationId
  );

  const handleSelectUser = async (selectedUser: User) => {
    if (!user) return;

    try {
      const response = await messagesAPI.startConversation(selectedUser.id);
      if (response.data) {
        updateConversation(response.data);
        setActiveConversation(response.data.id);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  return (
    <aside
      className={`min-h-0 h-full overflow-hidden flex flex-col bg-card border-r border-border shrink-0 transition-all ${
        /* On mobile: Hide list if a conversation is open. On desktop: always show 80/96 width */
        activeConversation ? 'hidden lg:flex lg:w-80 xl:w-96' : 'flex w-full lg:w-80 xl:w-96'
      }`}
    >
      <div className="flex items-center px-4 h-14 border-b border-border">
        <SearchUsers title="Recent messages" onSelectUser={handleSelectUser} />
      </div>
      <div className="flex-1 overflow-hidden h-full">
        <ChatList />
      </div>
    </aside>
  );
};