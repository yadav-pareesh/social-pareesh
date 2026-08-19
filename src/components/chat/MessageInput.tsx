import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTypingIndicator } from '../../hooks/useSocket';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Send, Smile } from 'lucide-react';
import { useEffect, useRef } from 'react';

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface MessageInputProps {
  onSend: (content: string) => void;
  conversationId: string;
}

export const MessageInput = ({ onSend, conversationId }: MessageInputProps) => {
  const { register, handleSubmit, reset, watch } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
  });
  const { startTyping, stopTyping } = useTypingIndicator(conversationId);

  const content = watch('content');
  const typingTimeoutRef = useRef<any | null>(null);

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
  }, [content, conversationId]);

  const onSubmit = (data: MessageFormData) => {
    stopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onSend(data.content);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2 p-3 sm:p-4 border-t border-border bg-card/30">
      <Input
        {...register('content')}
        autoFocus={true}
        placeholder="Type a message..."
        className="flex-1 bg-background"
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="text-muted-foreground hover:text-foreground"
      >
        <Smile className="h-5 w-5" />
      </Button>
      <Button type="submit" size="icon">
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
};