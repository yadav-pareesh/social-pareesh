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
  
  const { isLoading } = useConversationMessages(conversation.id);
  
  const chatStoreMessages = useChatStore((state) => state.messages.get(conversation.id));
  const storeMessages = chatStoreMessages || [];
  
  const sendMessage = useSendMessage();
  const { showUserCard } = useUIStore();

  const handleSendMessage = (content: string, attachmentUrl?: string, attachmentType?: 'image' | 'video') => {
    // CRITICAL FIX: Added 'undefined' for parentMessageId so the arguments align perfectly with your hook!
    sendMessage(conversation.id, content, undefined, attachmentUrl, attachmentType);
  };

  return (
    <div className="flex h-full overflow-hidden">
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

      {showUserCard && otherUser && (
        <UserProfileCard user={otherUser} />
      )}
    </div>
  );
};