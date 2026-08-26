import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTypingIndicator } from '../../hooks/useSocket';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Send, Smile, Paperclip, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useMediaUpload } from '../../hooks/useMediaUpload';

const messageSchema = z.object({
  content: z.string().optional(),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface MessageInputProps {
  onSend: (content: string, attachmentUrl?: string, attachmentType?: 'image' | 'video') => void;
  conversationId: string;
}

export const MessageInput = ({ onSend, conversationId }: MessageInputProps) => {
  const { register, handleSubmit, reset, watch, setValue, getValues } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: '' }
  });

  const { startTyping, stopTyping } = useTypingIndicator(conversationId);
  const content = watch('content') || '';
  const typingTimeoutRef = useRef<any | null>(null);

  // --- Upload State & Ref ---
  const { uploadFile, isUploading } = useMediaUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Emoji Picker State & Decoupled Refs ---
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // We use two separate refs so the popup can be absolutely positioned relative to the whole form, 
  // not just trapped inside the tiny button wrapper.
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close only if the user clicked OUTSIDE the popup AND OUTSIDE the toggle button
      if (
        emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current && !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Please select a file under 10MB.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const fileType = file.type.startsWith('video/') ? 'video' : 'image';
    const uploadedUrl = await uploadFile(file);

    if (uploadedUrl) {
      const currentText = getValues('content') || '';
      onSend(currentText.trim(), uploadedUrl, fileType);
      reset();
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
    // 1. Added 'relative' to the entire form container
    <form onSubmit={handleSubmit(onSubmit)} className="relative flex items-center gap-1 sm:gap-2 p-2 sm:p-4 border-t border-border bg-card/30">
      
      {/* --- RESPONSIVE EMOJI PICKER POPUP --- */}
      {showEmojiPicker && (
        <div 
          ref={emojiPickerRef}
          // On mobile: stretches from left-2 to right-2. On desktop: fixed 350px width aligned right.
          className="absolute bottom-full mb-2 left-2 right-2 sm:left-auto sm:right-14 sm:w-[350px] z-[100] shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2"
        >
          <EmojiPicker 
            onEmojiClick={onEmojiClick} 
            theme={Theme.AUTO}
            lazyLoadEmojis={true}
            searchPlaceHolder="Search emojis..."
            width="100%"
            height={380} // 380px is the perfect height to stay above mobile keyboards
          />
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Attachment Button */}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="text-muted-foreground hover:text-foreground shrink-0"
        title="Attach Media"
      >
        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
      </Button>

      <Input
        {...register('content')}
        autoFocus={true}
        placeholder={isUploading ? "Uploading media..." : "Type a message..."}
        disabled={isUploading}
        className="flex-1 bg-background"
        autoComplete="off"
      />

      {/* Emoji Toggle Button */}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={isUploading}
        ref={emojiButtonRef}
        onClick={() => setShowEmojiPicker((prev) => !prev)}
        className={`shrink-0 text-muted-foreground hover:text-foreground transition-colors ${showEmojiPicker ? 'bg-accent text-accent-foreground' : ''}`}
      >
        <Smile className="h-5 w-5" />
      </Button>

      <Button 
        type="submit" 
        size="icon" 
        className="shrink-0"
        disabled={(!content?.trim() && !isUploading) || isUploading}
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
};