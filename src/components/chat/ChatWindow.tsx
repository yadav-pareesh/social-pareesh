import type { Conversation, User } from '../../types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { useConversationMessages } from '../../hooks/useChat';
import { useSendMessage } from '../../hooks/useSocket';
import { useUIStore } from '../../stores/uiStore';
import { useChatStore } from '../../stores/chatStore';
import { UserProfileCard } from './UserProfileCard';

interface ChatWindowProps {
  conversation: Conversation;
  currentUser: User;
}

export const ChatWindow = ({ conversation, currentUser }: ChatWindowProps) => {
  const otherUser = conversation.user1Id === currentUser.id ? conversation.user2 : conversation.user1;
  
  // 1. Initial query fetch from server
  const { isLoading } = useConversationMessages(conversation.id);
  
  // 2. Reactive subscription to live messages in store
  const chatStoreMessages = useChatStore((state) => state.messages.get(conversation.id));
  const storeMessages = chatStoreMessages || [];
  
  const sendMessage = useSendMessage();
  const { showUserCard } = useUIStore();

  const handleSendMessage = (content: string) => {
    sendMessage(conversation.id, content);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatHeader user={otherUser} conversationId={conversation.id} />
        <MessageList
          messages={storeMessages}
          currentUser={currentUser}
          isLoading={isLoading && storeMessages.length === 0}
          conversationId={conversation.id}
        />
        <MessageInput onSend={handleSendMessage} conversationId={conversation.id} />
      </div>

      {/* User Profile Card Drawer */}
      {showUserCard && otherUser && (
        <UserProfileCard user={otherUser} />
      )}
    </div>
  );
};