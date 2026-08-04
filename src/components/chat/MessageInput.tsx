import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDebounce } from '../../hooks/useDebounce';
import { useTypingIndicator } from '../../hooks/useSocket';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Send, Smile } from 'lucide-react';
import { useEffect } from 'react';

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
  const debouncedContent = useDebounce(content, 300);

  useEffect(() => {
    if (debouncedContent) {
      startTyping();
    } else {
      stopTyping();
    }
  }, [debouncedContent]);

  const onSubmit = (data: MessageFormData) => {
    onSend(data.content);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 p-4 border-t">
      <Input
        {...register('content')}
        placeholder="Type a message..."
        className="flex-1"
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
      >
        <Smile className="h-5 w-5" />
      </Button>
      <Button type="submit" size="icon">
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
};