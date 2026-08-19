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

// Stable empty array reference outside the component
const EMPTY_TYPING_USERS: string[] = [];

export const MessageList = ({
  messages,
  currentUser,
  isLoading,
  conversationId,
}: MessageListProps) => {
  // Stable selector that returns the same array reference when idle
  const typingUsers = useChatStore(
    (state) => state.typingUsers[conversationId] ?? EMPTY_TYPING_USERS
  );
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Only scroll when messages count changes or someone starts/stops typing
  const messagesCount = messages.length;
  const isTyping = typingUsers.length > 0;

  useEffect(() => {
    scrollToBottom();
  }, [messagesCount, isTyping]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Loading messages...
      </div>
    );
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
      {isTyping && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
};