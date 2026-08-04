import type { Conversation } from '../../types';
import { useChatStore } from '../../stores/chatStore';
import { Avatar } from '../common/Avatar';
import { cn } from '../../lib/utils';

interface ChatListItemProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  onClick?: () => void; // Optional override
}

export const ChatListItem = ({
  conversation,
  isActive,
  currentUserId,
  onClick,
}: ChatListItemProps) => {
  const { setActiveConversation } = useChatStore();

  const otherUser =
    conversation.user1Id === currentUserId
      ? conversation.user2
      : conversation.user1;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setActiveConversation(conversation.id);
    }
  };

  const lastMessage = conversation.lastMessage?.content || 'No messages yet';
  const hasUnread = conversation.unreadCount && conversation.unreadCount > 0;

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full px-4 py-3 text-left border-b transition-colors flex items-center gap-3',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-muted active:bg-muted/80'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Avatar with WhatsApp-style online indicator */}
      <Avatar
        user={otherUser}
        size="md"
        showOnlineIndicator={true}
        className="flex-shrink-0"
      />

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-sm truncate pr-1">
            {otherUser.username}
          </h4>

          {/* Unread badge */}
          {Boolean(hasUnread) && (
            <div className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center flex-shrink-0">
              {conversation.unreadCount}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {lastMessage}
        </p>
      </div>
    </button>
  );
};