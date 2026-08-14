import type { Message } from '../../types';
import { Check, CheckCheck, Info, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../stores/authStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '../common/DropdownMenu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../common/Dialog';
import { useDeleteMessage, useEditMessage } from '../../hooks/useChat';
import { useMessageNotification } from '@/hooks/useMessageNotification';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  conversationId?: string;
}

export const MessageItem = ({ message, isOwn, conversationId }: MessageItemProps) => {
  const { user } = useAuthStore();
  const elementRef = useRef<HTMLDivElement>(null);
  const hasMarkedAsReadRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(message.content);
  const [infoOpen, setInfoOpen] = useState(false);
  const editMessageMutation = useEditMessage();
  const deleteMessageMutation = useDeleteMessage();

  useMessageNotification((message) => {

    console.log('New message:', message);
  });

  // Auto-mark message as read when it becomes visible
  useEffect(() => {
    if (isOwn || hasMarkedAsReadRef.current || !user?.id || !conversationId) {
      return;
    }

    // Skip if already marked as read
    if (message.readBy?.length > 0 && message.readBy.includes(user.id)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasMarkedAsReadRef.current) {
          hasMarkedAsReadRef.current = true;
          // Emit socket event to mark message as read
          const socket = getSocket();
          socket.emit('message:read', {
            messageId: message.id,
            userId: user.id,
            conversationId,
          });
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [message.id, isOwn, user?.id, conversationId]);

  if (message.deletedAt) {
    return (
      <div className="text-center text-xs text-muted-foreground py-2">
        This message was deleted
      </div>
    );
  }

  const createdAt = new Date(message.createdAt);
  const time = createdAt
    .toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase();

  const handleSaveEdit = () => {
    const content = draftContent.trim();
    if (!content || content === message.content) {
      setIsEditing(false);
      setDraftContent(message.content);
      return;
    }

    editMessageMutation.mutate({
      messageId: message.id,
      content,
      conversationId: conversationId ?? '',
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this message?')) {
      deleteMessageMutation.mutate({
        messageId: message.id,
        conversationId: conversationId ?? '',
      });
    }
  };

  return (
    <>
      <div ref={elementRef} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`relative max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          }`}
        >
          {!isEditing && <div className="absolute -top-1 right-2">
            <DropdownMenu align={isOwn?'right':'left'} trigger={<MoreHorizontal className="h-4 w-4" />}>
              <DropdownMenuContent>
                {isOwn && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        setDraftContent(message.content);
                        setIsEditing(true);
                      }}
                    >
                      <div className="flex items-center text-slate-700 dark:text-slate-200 gap-2">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete}>
                      <div className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={() => setInfoOpen(true)}>
                  <div className="flex items-center text-slate-700 dark:text-slate-200 gap-2">
                    <Info className="h-4 w-4" />
                    Info
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>}

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
                className="w-full rounded-md border border-border/60 bg-background/80 p-2 text-sm text-foreground outline-none"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="rounded-md bg-background/80 px-2 py-1 text-xs font-medium text-foreground"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setDraftContent(message.content);
                  }}
                  className="rounded-md px-2 py-1 text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="break-words pr-6">{message.content}</p>
          )}

          <div className="flex items-center align-center justify-between gap-2">
            <div>
              {message.editedAt && (
                <p className="text-xs opacity-50">(edited)</p>
              )}
            </div>
            
            <div className='flex'>
              <span className="text-xs opacity-70">{time}</span>
              {isOwn && (
                <div className="flex items-center gap-1 pl-1">
                  {message.readBy.length > 0 ? (
                    <CheckCheck className="h-3 w-3" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </div>
              )}
            </div>  
            
          </div>  
        </div>
      </div>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Message info</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Sent:</span> {createdAt.toLocaleString()}</p>
            <p><span className="font-medium text-foreground">Status:</span> {message.readBy.length > 0 ? 'Seen' : 'Sent'}</p>
            {message.editedAt && (
              <p><span className="font-medium text-foreground">Edited:</span> {new Date(message.editedAt).toLocaleString()}</p>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setInfoOpen(false)}
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};