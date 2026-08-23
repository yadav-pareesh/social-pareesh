import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTypingIndicator } from '../../hooks/useSocket';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Send, Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface MessageInputProps {
  onSend: (content: string) => void;
  conversationId: string;
}

export const MessageInput = ({ onSend, conversationId }: MessageInputProps) => {
  const { register, handleSubmit, reset, watch, setValue, getValues } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: '' }
  });
  
  const { startTyping, stopTyping } = useTypingIndicator(conversationId);
  const content = watch('content');
  const typingTimeoutRef = useRef<any | null>(null);
  
  // --- Emoji Picker State & Ref ---
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Click-Outside Handler to close the emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Emoji Selection
  const onEmojiClick = (emojiObject: any) => {
    const currentContent = getValues('content') || '';
    
    // Inject the emoji into React Hook Form and trigger validation
    setValue('content', currentContent + emojiObject.emoji, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  useEffect(() => {
    if (content && content.trim().length > 0) {
      startTyping();

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 1500);
    } else {
      stopTyping();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [content, conversationId, startTyping, stopTyping]);

  const onSubmit = (data: MessageFormData) => {
    stopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onSend(data.content);
    reset();
    setShowEmojiPicker(false); // Close picker on send
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2 p-3 sm:p-4 border-t border-border bg-card/30">
      <Input
        {...register('content')}
        autoFocus={true}
        placeholder="Type a message..."
        className="flex-1 bg-background"
        autoComplete="off"
      />
      
      {/* Emoji Picker Wrapper */}
      <div className="relative" ref={emojiPickerRef}>
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-4 z-50 shadow-xl rounded-lg animate-in fade-in slide-in-from-bottom-2">
            <EmojiPicker 
              onEmojiClick={onEmojiClick} 
              theme={Theme.AUTO} // Automatically matches user's system dark/light mode
              lazyLoadEmojis={true}
              searchPlaceHolder="Search emojis..."
            />
          </div>
        )}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className={`text-muted-foreground hover:text-foreground transition-colors ${showEmojiPicker ? 'bg-accent text-accent-foreground' : ''}`}
        >
          <Smile className="h-5 w-5" />
        </Button>
      </div>

      <Button type="submit" size="icon" disabled={!content?.trim()}>
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
};