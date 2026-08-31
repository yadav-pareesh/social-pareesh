import { useChatStore } from '../stores/chatStore';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useAuthStore } from '@/stores/authStore';
import { EmptyChatState } from '@/components/chat/EmptyChatState';

export const Chat = () => {
  const {user} = useAuthStore();
  const { conversations, activeConversationId } = useChatStore();

  const activeConversation = Array.from(conversations.values()).find(
    (c) => c.id === activeConversationId
  );
  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* 1. Recent Messages Sidebar */}
      <Sidebar />

      {/* 2. Chat Conversation View */}
      <section
        className={`flex-1 flex flex-col h-full min-w-0 bg-background ${
          /* On mobile: Hide if no active chat. On desktop: always show flex-1 */
          activeConversation ? 'flex w-full' : 'hidden lg:flex'
        }`}
      >
        {activeConversation ? (
            user && <ChatWindow conversation={activeConversation} currentUser={user} />
        ) : (
          /* Empty state on desktop when no conversation is selected */
          <EmptyChatState />
        )}
      </section>
    </div>
  );
};