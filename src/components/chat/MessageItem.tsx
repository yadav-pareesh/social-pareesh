import type { Message } from '../../types';
import { Check, CheckCheck, Info, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../stores/authStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '../common/DropdownMenu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../common/Dialog';
import { useMessageNotification } from '@/hooks/useMessageNotification';

// Import the new socket hooks instead of the REST hooks
import { useEditSocketMessage, useDeleteSocketMessage } from '../../hooks/useSocket';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  conversationId?: string;
}

export const MessageItem = ({ message, isOwn, conversationId }: MessageItemProps) => {
  const { user } = useAuthStore();
  const elementRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasMarkedAsReadRef = useRef(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(message.content);
  const [infoOpen, setInfoOpen] = useState(false);
  
  // Initialize the new socket hooks
  const editMessage = useEditSocketMessage();
  const deleteMessage = useDeleteSocketMessage();

  useMessageNotification((msg) => {
    console.log('New message:', msg);
  });

  // Reset read flag if message ID changes (e.g., in virtualized lists)
  useEffect(() => {
    hasMarkedAsReadRef.current = false;
  }, [message.id]);

  // Auto-focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to the end of the text
      textareaRef.current.setSelectionRange(draftContent.length, draftContent.length);
    }
  }, [isEditing, draftContent.length]);

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
      <div className="text-center text-xs text-muted-foreground py-1.5 italic select-none">
        This message was deleted
      </div>
    );
  }

  // Safe time formatting
  const formattedTime = (() => {
    try {
      const date = new Date(message.createdAt);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase();
    } catch {
      return '';
    }
  })();

  const isReadByRecipient =
    Array.isArray(message.readBy) &&
    message.readBy.some((readerId) => readerId !== message.senderId);

  // --- Handlers ---

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDraftContent(message.content);
  };

  const handleSaveEdit = () => {
    const content = draftContent.trim();
    if (!content || content === message.content) {
      handleCancelEdit();
      return;
    }

    // Fire socket event and instantly update UI
    editMessage(conversationId ?? '', message.id, content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      // Fire socket event and instantly update UI
      deleteMessage(conversationId ?? '', message.id);
    }
  };

  const isSaveDisabled = !draftContent.trim() || draftContent.trim() === message.content;

  // Dynamic spacer width to prevent text from overlapping the absolutely positioned timestamp
  let spacerWidth = 'w-[45px]'; // Base width for just the time
  if (isOwn && message.editedAt) spacerWidth = 'w-[105px]';
  else if (isOwn) spacerWidth = 'w-[65px]';
  else if (message.editedAt) spacerWidth = 'w-[85px]';

  return (
    <>
      <div ref={elementRef} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group py-[3px]`}>
        <div
          className={`relative min-h-[40px] max-w-[85%] sm:max-w-md px-2.5 pt-1.5 pb-1 rounded-xl shadow-sm transition-colors ${
            isOwn
              ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-sm border border-transparent dark:border-zinc-200/20'
              : 'bg-zinc-100/90 text-zinc-800 dark:bg-zinc-800/70 dark:text-zinc-200 border border-zinc-200/70 dark:border-zinc-700/50 rounded-tl-sm'
          }`}
        >
          {!isEditing && (
            <div className="absolute top-1 right-1  -mt-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
              <DropdownMenu 
                align={isOwn ? 'right' : 'left'} 
                trigger={
                  <button
                    type="button"
                    className={`p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
                      isOwn 
                        ? 'text-zinc-400 hover:text-zinc-100 dark:text-zinc-500 dark:hover:text-zinc-900' 
                        : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200'
                    }`}
                    aria-label="Message options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                }
              >
                <DropdownMenuContent>
                  {isOwn && (
                    <>
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <div className="flex items-center text-zinc-700 dark:text-zinc-300 gap-2">
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
                    <div className="flex items-center text-zinc-700 dark:text-zinc-300 gap-2">
                      <Info className="h-4 w-4" />
                      Info
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-3 mt-1 pb-1">
              <textarea
                ref={textareaRef}
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Edit message..."
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-background p-2 text-sm text-foreground outline-none resize-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] opacity-60 px-1 hidden sm:inline-block">
                  <kbd className="font-sans">Enter</kbd> to save, <kbd className="font-sans">Esc</kbd> to cancel
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-md px-3 py-1.5 text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:opacity-90 transition-opacity"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSaveDisabled}
                    className="rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[60px]"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[15px] leading-snug break-words whitespace-pre-wrap font-normal select-text">
                {message.content}
                {/* Invisible spacer trick to allow the absolutely positioned timestamp to sit inline */}
                <span className={`inline-block h-1 ${spacerWidth}`} aria-hidden="true" />
              </p>

              {/* Timestamp & Read Receipts absolutely positioned to the bottom right */}
              <div className="absolute bottom-1 right-2 flex items-center justify-end gap-1 select-none">
                {message.editedAt && (
                  <span className={`text-[10px] italic ${isOwn ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    (edited)
                  </span>
                )}

                <span className={`text-[10px] font-medium tracking-tight ${isOwn ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                  {formattedTime}
                </span>

                {isOwn && (
                  <div className="flex items-center pl-[2px]">
                    {isReadByRecipient ? (
                      <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" aria-label="Read" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" aria-label="Sent" />
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Message info</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground py-2">
            <p><span className="font-medium text-foreground">Sent:</span> {new Date(message.createdAt).toLocaleString()}</p>
            <p><span className="font-medium text-foreground">Status:</span> {isReadByRecipient ? 'Seen' : 'Sent'}</p>
            {message.editedAt && (
              <p><span className="font-medium text-foreground">Edited:</span> {new Date(message.editedAt).toLocaleString()}</p>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setInfoOpen(false)}
              className="rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};