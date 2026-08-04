import type { Message, User } from '../../types';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { useChatStore } from '../../stores/chatStore';
import { useEffect, useRef } from 'react';

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  isLoading: boolean;
  conversationId: string;
}

export const MessageList = ({
  messages,
  currentUser,
  isLoading,
  conversationId,
}: MessageListProps) => {
  const { getTypingUsers } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingUsers = getTypingUsers(conversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading messages...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={message.senderId === currentUser.id}
          conversationId={conversationId}
        />
      ))}
      {typingUsers.length > 0 && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
};