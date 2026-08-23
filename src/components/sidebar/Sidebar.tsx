import * as React from 'react';
import { ChatList } from './ChatList';
import { SearchUsers } from './SearchUsers';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { messagesAPI } from '../../services/api/messages';
import type { Conversation, User } from '../../types';
import { useQueryClient } from '@tanstack/react-query';

export const Sidebar = () => {
  const queryClient = useQueryClient();
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
        const newConversation = response.data;

        // 1. Update Zustand store (Your existing logic)
        updateConversation(newConversation);
        
        // 2. CRITICAL FIX: Inject into React Query cache so it instantly renders in the ChatList
        queryClient.setQueryData(['conversations'], (oldConvs: Conversation[] | undefined) => {
          if (!oldConvs) return [newConversation];
          
          // Check if this conversation already exists in the list (e.g., you searched for someone you already chat with)
          const exists = oldConvs.some((c) => c.id === newConversation.id);
          if (exists) return oldConvs;

          // If it's a brand new chat, add it to the very top of the sidebar list
          return [newConversation, ...oldConvs];
        });

        // 3. Force a background refetch just to ensure total sync with the server
        queryClient.invalidateQueries({ queryKey: ['conversations'] });

        // 4. Finally, set it as active to open the chat window
        setActiveConversation(newConversation.id);
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