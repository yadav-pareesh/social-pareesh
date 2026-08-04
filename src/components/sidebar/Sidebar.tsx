import { ChatList } from './ChatList';
import { SearchUsers } from './SearchUsers';
import { useUIStore } from '../../stores/uiStore';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { messagesAPI } from '../../services/api/messages';
import type { User } from '../../types';
import { X } from 'lucide-react';

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const { setActiveConversation, updateConversation } = useChatStore();

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
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden mt-160 z-40"
          onClick={toggleSidebar}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 w-80 bg-background border-r flex flex-col transition-transform lg:relative lg:translate-x-0 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b lg:hidden">
          <h2 className="font-bold">Messages</h2>
          <button onClick={toggleSidebar}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <SearchUsers onSelectUser={handleSelectUser} />
        <ChatList />
      </div>
    </>
  );
};