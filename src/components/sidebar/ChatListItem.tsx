import type { Conversation } from '../../types';
import { useChatStore } from '../../stores/chatStore';
import { Avatar } from '../common/Avatar';
import { cn } from '../../lib/utils';
import { MoreVertical, Trash } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '../common/DropdownMenu';
import { messagesAPI } from '@/services/api/messages';
import { useMutation } from '@tanstack/react-query';
import { toast } from '../ui/toast';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';
import { useState } from 'react';

interface ChatListItemProps {
  conversation: Conversation;
  isActive: boolean;
  currentUserId: string;
  onClick?: () => void;
}

export const ChatListItem = ({
  conversation,
  isActive,
  currentUserId,
  onClick,
}: ChatListItemProps) => {
  const { setActiveConversation } = useChatStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await messagesAPI.deleteConversation(id);
      return response;
    },
    onSuccess: async () => {
      setShowDeleteConfirm(false);
      toast.add({
        title: "Success",
        description: "Conversation deleted successfully.",
        type: "success"
      })
    },
    onError: (error) => {
      toast.add({
        title: "Error",
        description: error.message,
        type: "error"
      })
    },
  });

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

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    await deleteConversationMutation.mutate(conversation.id);
  }

  const lastMessage = conversation.lastMessage?.content || 'No messages yet';
  const hasUnread = conversation.unreadCount && conversation.unreadCount > 0;

  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          'w-full px-4 py-3 border transition-all cursor-pointer',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'flex items-center gap-3',
          isActive
            ? 'bg-accent text-accent-foreground border-accent shadow-md'
            : 'bg-card border-border hover:border-primary/50 hover:shadow-sm active:shadow-md'
        )}
        tabIndex={0}
      >
        {/* Avatar with online indicator */}
        <Avatar
          user={otherUser}
          size="md"
          showOnlineIndicator={true}
          className="flex-shrink-0 border"
        />

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col flex-1">
              <h4 className="font-semibold text-sm truncate pr-1">
                {otherUser.username}
              </h4>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {lastMessage}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Unread badge */}
              {Boolean(hasUnread) && (
                <div className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center flex-shrink-0">
                  {conversation.unreadCount}
                </div>
              )}
              
              {/* Dropdown menu */}
              <DropdownMenu trigger={<MoreVertical className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />}>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleDeleteClick}>
                    <div className='flex items-center text-destructive gap-2'>
                      <Trash className="h-4 w-4" />
                      Delete conversation
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title="Delete Conversation"
          description="This action cannot be undone. All your data will be permanently deleted."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
};