import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useSocket } from '../hooks/useSocket';
import { useGetConversations } from '../hooks/useChat';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ChatWindow } from '../components/chat/ChatWindow';
import { Navbar } from '../components/common/Navbar';

export const Chat = () => {
  const { user } = useAuthStore();
  const { activeConversationId, conversations } = useChatStore();
  useSocket();
  useGetConversations();

  const activeConversation = Array.from(conversations.values()).find(
    (c) => c.id === activeConversationId
  );

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          {activeConversation && user ? (
            <ChatWindow conversation={activeConversation} currentUser={user} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};