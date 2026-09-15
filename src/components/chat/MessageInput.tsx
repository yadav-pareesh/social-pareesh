import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTypingIndicator } from '../../hooks/useSocket';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import {
  Send,
  Smile,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Music,
  UploadCloud,
} from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { MediaPreviewModal } from './MediaPreviewModal';
import { useMediaStore } from '../../stores/mediaStore';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import type { Message } from '../../types';
import type { MediaType } from '../../services/imagekit/types';

const messageSchema = z.object({
  content: z.string().optional(),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface MessageInputProps {
  onSend: (
    content: string,
    attachmentUrl?: string,
    attachmentType?: 'image' | 'video' | 'audio' | 'document',
    attachmentMetadata?: any,
    clientMessageId?: string
  ) => void;
  conversationId: string;
}

export const MessageInput = ({ onSend, conversationId }: MessageInputProps) => {
  const { register, handleSubmit, reset, watch, setValue, getValues } =
    useForm<MessageFormData>({
      resolver: zodResolver(messageSchema),
      defaultValues: { content: '' },
    });

  const { startTyping, stopTyping } = useTypingIndicator(conversationId);
  const content = watch('content') || '';
  const typingTimeoutRef = useRef<any | null>(null);

  const { user } = useAuthStore();
  const queueUpload = useMediaStore((state) => state.queueUpload);

  // File picker inputs
  const allFileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Attachment menu state
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const attachButtonRef = useRef<HTMLButtonElement>(null);

  // Pre-send Preview Modal State
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Drag and Drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);

  // Emoji Picker State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(target)
      ) {
        setShowEmojiPicker(false);
      }

      if (
        attachMenuRef.current &&
        !attachMenuRef.current.contains(target) &&
        attachButtonRef.current &&
        !attachButtonRef.current.contains(target)
      ) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onEmojiClick = (emojiObject: any) => {
    const currentContent = getValues('content') || '';
    setValue('content', currentContent + emojiObject.emoji, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // Open preview modal with selected files
  const handleFilesSelected = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setPendingFiles(fileArray);
    setIsPreviewOpen(true);
    setShowAttachMenu(false);
  };

  // Handle files confirmed in MediaPreviewModal
  const handleSendMediaFiles = (
    items: { file: File; caption: string; type: MediaType }[]
  ) => {
    if (!user?.id) return;

    items.forEach((item, idx) => {
      const tempId = `temp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      const previewBlobUrl = URL.createObjectURL(item.file);

      // Create optimistic message
      const optimisticMessage: Message = {
        id: tempId,
        conversationId,
        senderId: user.id,
        content: item.caption,
        createdAt: new Date(),
        readBy: [user.id],
        attachmentUrl: previewBlobUrl,
        attachmentType: item.type,
      };

      useChatStore.getState().addMessage(conversationId, optimisticMessage);

      // Queue upload directly to ImageKit
      queueUpload(
        {
          file: item.file,
          type: item.type,
          caption: item.caption,
          conversationId,
          tempMessageId: tempId,
        },
        async (result) => {
          // Upload complete! Dispatch actual socket message with existing tempId for exact reconciliation
          onSend(item.caption, result.url, result.mediaType, result.metadata, tempId);
        }
      );
    });
  };

  // Clipboard Paste (Ctrl+V) support for screenshots / copied images
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const clipboardFiles: File[] = [];
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const file = e.clipboardData.files[i];
          clipboardFiles.push(file);
        }
      }

      if (clipboardFiles.length > 0) {
        e.preventDefault();
        handleFilesSelected(clipboardFiles);
      }
    },
    []
  );

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Typing indicator trigger
  useEffect(() => {
    if (content && content.trim().length > 0) {
      startTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => stopTyping(), 1500);
    } else {
      stopTyping();
    }

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [content, conversationId, startTyping, stopTyping]);

  const onSubmit = (data: MessageFormData) => {
    const finalContent = data.content || '';
    if (!finalContent.trim()) return;

    stopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    onSend(finalContent.trim());
    reset();
    setShowEmojiPicker(false);
  };

  return (
    <div
      className="relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-[2px] border-2 border-dashed border-primary rounded-xl animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm bg-background/90 px-4 py-2 rounded-full shadow-lg">
            <UploadCloud className="h-5 w-5 animate-bounce" />
            <span>Drop media files here</span>
          </div>
        </div>
      )}

      {/* Media Preview Composer Modal */}
      <MediaPreviewModal
        isOpen={isPreviewOpen}
        files={pendingFiles}
        onClose={() => setIsPreviewOpen(false)}
        onSend={handleSendMediaFiles}
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        onPaste={handlePaste}
        className="relative flex items-center gap-1 sm:gap-2 p-2 sm:p-4 border-t border-border bg-card/30"
      >
        {/* Responsive Emoji Picker */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full mb-2 left-2 right-2 sm:left-auto sm:right-14 sm:w-[350px] z-[100] shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2"
          >
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              theme={Theme.AUTO}
              lazyLoadEmojis={true}
              searchPlaceHolder="Search emojis..."
              width="100%"
              height={380}
            />
          </div>
        )}

        {/* Attachment Options Popover */}
        {showAttachMenu && (
          <div
            ref={attachMenuRef}
            className="absolute bottom-full mb-3 left-2 sm:left-4 z-[90] flex flex-col gap-1 p-2 bg-popover/95 backdrop-blur-md border border-border rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2 min-w-[180px]"
          >
            <button
              type="button"
              onClick={() => mediaFileInputRef.current?.click()}
              className="flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl transition-colors text-left"
            >
              <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-xs">Photos & Videos</span>
                <span className="text-[10px] text-muted-foreground">JPG, PNG, MP4</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => docFileInputRef.current?.click()}
              className="flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl transition-colors text-left"
            >
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-xs">Document</span>
                <span className="text-[10px] text-muted-foreground">PDF, DOC, ZIP</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => audioFileInputRef.current?.click()}
              className="flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl transition-colors text-left"
            >
              <div className="h-8 w-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <Music className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-xs">Audio File</span>
                <span className="text-[10px] text-muted-foreground">MP3, WAV, M4A</span>
              </div>
            </button>
          </div>
        )}

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={mediaFileInputRef}
          onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
          multiple
          accept="image/*,video/*"
          className="hidden"
        />
        <input
          type="file"
          ref={docFileInputRef}
          onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
          className="hidden"
        />
        <input
          type="file"
          ref={audioFileInputRef}
          onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
          multiple
          accept="audio/*"
          className="hidden"
        />
        <input
          type="file"
          ref={allFileInputRef}
          onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
          multiple
          className="hidden"
        />

        {/* Attachment Toggle Button */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          ref={attachButtonRef}
          onClick={() => setShowAttachMenu((prev) => !prev)}
          className={`text-muted-foreground hover:text-foreground shrink-0 transition-colors ${
            showAttachMenu ? 'bg-accent text-accent-foreground' : ''
          }`}
          title="Attach media or document"
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Text Input */}
        <Input
          {...register('content')}
          autoFocus={true}
          placeholder="Type a message..."
          className="flex-1 bg-background"
          autoComplete="off"
        />

        {/* Emoji Toggle Button */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          ref={emojiButtonRef}
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className={`shrink-0 text-muted-foreground hover:text-foreground transition-colors ${
            showEmojiPicker ? 'bg-accent text-accent-foreground' : ''
          }`}
          title="Insert emoji"
          aria-label="Insert emoji"
        >
          <Smile className="h-5 w-5" />
        </Button>

        {/* Send Button */}
        <Button
          type="submit"
          size="icon"
          className="shrink-0"
          disabled={!content?.trim()}
          title="Send message"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};