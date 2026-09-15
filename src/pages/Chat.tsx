import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useAuthStore } from '@/stores/authStore';
import { EmptyChatState } from '@/components/chat/EmptyChatState';

export const Chat = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, activeConversationId, setActiveConversation } = useChatStore();

  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, activeConversationId, setActiveConversation]);

  const activeConversation = Array.from(conversations.values()).find(
    (c) => c.id === (conversationId || activeConversationId)
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* 1. WhatsApp-Style Conversation List Sidebar */}
      <div
        className={`w-full lg:w-80 xl:w-96 shrink-0 h-full border-r border-border/70 ${
          activeConversation ? 'hidden lg:block' : 'block'
        }`}
      >
        <Sidebar />
      </div>

      {/* 2. Chat Conversation View Panel */}
      <section
        className={`flex-1 flex flex-col h-full min-w-0 bg-background ${
          activeConversation ? 'flex w-full' : 'hidden lg:flex'
        }`}
      >
        {activeConversation ? (
          user && <ChatWindow conversation={activeConversation} currentUser={user} />
        ) : (
          /* WhatsApp-style Desktop Empty State */
          <EmptyChatState />
        )}
      </section>
    </div>
  );
};