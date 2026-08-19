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

  useMessageNotification((msg) => {
    console.log('New message:', msg);
  });

  useEffect(() => {
    hasMarkedAsReadRef.current = false;
  }, [message.id]);

  // Auto-mark message as read when it enters viewport
  useEffect(() => {
    if (isOwn || hasMarkedAsReadRef.current || !user?.id || !conversationId) {
      return;
    }

    if (Array.isArray(message.readBy) && message.readBy.includes(user.id)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasMarkedAsReadRef.current) {
          hasMarkedAsReadRef.current = true;
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
  }, [message.id, message.readBy, isOwn, user?.id, conversationId]);

  if (message.deletedAt) {
    return (
      <div className="text-center text-xs text-muted-foreground py-2 italic">
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

  // Seen only if another user other than the sender is in readBy
  const isReadByRecipient =
    Array.isArray(message.readBy) &&
    message.readBy.some((readerId) => readerId !== message.senderId);

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
      <div ref={elementRef} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group py-0.5`}>
        <div
          className={`relative max-w-xs lg:max-w-md px-3 py-2 rounded-2xl shadow-sm ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-xs'
              : 'bg-muted text-foreground rounded-bl-xs'
          }`}
        >
          {!isEditing && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu align={isOwn ? 'right' : 'left'} trigger={<MoreHorizontal className="h-4 w-4 text-inherit opacity-70 hover:opacity-100" />}>
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
            </div>
          )}

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
                className="w-full rounded-md border border-border/60 bg-background/80 p-2 text-sm text-foreground outline-none resize-none"
                rows={3}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setDraftContent(message.content);
                  }}
                  className="rounded-md px-2 py-1 text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="break-words pr-4 text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}

          <div className="flex items-center justify-end gap-1.5 mt-1 select-none">
            {message.editedAt && (
              <span className="text-[10px] opacity-60 italic">(edited)</span>
            )}

            <span className="text-[10px] opacity-70">{time}</span>

            {isOwn && (
              <div className="flex items-center pl-0.5">
                {isReadByRecipient ? (
                  <CheckCheck className="h-3.5 w-3.5 text-sky-400 dark:text-sky-300" aria-label="Read" />
                ) : (
                  <Check className="h-3.5 w-3.5 opacity-70" aria-label="Sent" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Message info</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground py-2">
            <p><span className="font-medium text-foreground">Sent:</span> {createdAt.toLocaleString()}</p>
            <p><span className="font-medium text-foreground">Status:</span> {isReadByRecipient ? 'Seen' : 'Sent'}</p>
            {message.editedAt && (
              <p><span className="font-medium text-foreground">Edited:</span> {new Date(message.editedAt).toLocaleString()}</p>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setInfoOpen(false)}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};