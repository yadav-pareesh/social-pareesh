import type { Conversation } from '../../types';
import { useChatStore } from '../../stores/chatStore';
import { Avatar } from '../common/Avatar';
import { cn } from '../../lib/utils';
import { MoreVertical, Trash } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '../common/DropdownMenu';
import { messagesAPI } from '@/services/api/messages';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await messagesAPI.deleteConversation(id);
      return response;
    },
    onSuccess: async () => {
      setShowDeleteConfirm(false);
      // Invalidate queries so the list updates automatically
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.add({
        title: "Success",
        description: "Conversation deleted successfully.",
        type: "success"
      });
    },
    onError: (error) => {
      toast.add({
        title: "Error",
        description: error.message,
        type: "error"
      });
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

  // Allow selecting chats with keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Stop propagation here so clicking delete doesn't select the chat
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    await deleteConversationMutation.mutate(conversation.id);
  };

  const lastMessage = conversation.lastMessage?.content || 'No messages yet';
  const hasUnread = conversation.unreadCount && conversation.unreadCount > 0;

  // Format time if available
  const timeString = conversation.lastMessageTime 
    ? new Date(conversation.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <>
      <div
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        className={cn(
          'w-full px-3 py-3 sm:px-4 border-b border-transparent transition-all cursor-pointer select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          'flex items-center gap-3',
          isActive
            ? 'bg-accent/80 text-accent-foreground border-accent shadow-sm'
            : 'bg-background hover:bg-muted/50 active:bg-muted'
        )}
      >
        {/* Avatar */}
        <Avatar
          user={otherUser}
          size="md"
          showOnlineIndicator={true}
          className="flex-shrink-0"
        />

        {/* Content Container */}
        <div className="flex flex-col flex-1 min-w-0 justify-center">
          
          {/* Top Row: Name & Time */}
          <div className="flex items-center justify-between mb-0.5">
            <h4 className="font-semibold text-sm truncate pr-2 text-foreground">
              {otherUser.username}
            </h4>
            
            {/* Actions Wrapper - onClick stops event bubbling to the parent div */}
            <div 
              className="flex items-center gap-1 flex-shrink-0"
              onClick={(e) => e.stopPropagation()} 
              onKeyDown={(e) => e.stopPropagation()}
            >
              {Boolean(hasUnread) && (
                <div className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[20px] h-[20px] px-1.5 flex items-center justify-center">
                  {conversation.unreadCount}
                </div>
              )}
              
              <DropdownMenu 
                trigger={
                  <button 
                    type="button" 
                    className="p-1 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                    aria-label="Chat options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                }
              >
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleDeleteClick}>
                    <div className="flex items-center text-destructive gap-2 font-medium">
                      <Trash className="h-4 w-4" />
                      Delete chat
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bottom Row: Message & Actions */}
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              "text-[13px] truncate flex-1",
              hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              {lastMessage}
            </p>

            {timeString && (
              <span className={cn(
                "text-[11px] whitespace-nowrap flex-shrink-0",
                hasUnread ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {timeString}
              </span>
            )}
          </div>

        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title="Delete Conversation"
          description={`Are you sure you want to delete your conversation with ${otherUser.username}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
};