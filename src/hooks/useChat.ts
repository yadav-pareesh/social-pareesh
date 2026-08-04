import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesAPI } from '../services/api/messages';
import { useChatStore } from '../stores/chatStore';

export const useConversationMessages = (conversationId: string | null) => {
  const { setMessages } = useChatStore();

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const response = await messagesAPI.getConversationMessages(conversationId, 50, 0);
      if (response.data) {
        setMessages(conversationId, response.data.items);
        return response.data.items;
      }
      return [];
    },
    enabled: !!conversationId,
    staleTime: 0,
  });
};

export const useEditMessage = () => {
  const queryClient = useQueryClient();
  const { editMessage } = useChatStore();

  return useMutation({
    mutationFn: (data: { messageId: string; content: string; conversationId: string }) =>
      messagesAPI.editMessage(data.messageId, data.content),
    onSuccess: (response, variables) => {
      if (response.data) {
        editMessage(variables.conversationId, response.data.id, response.data.content);
      }
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  const { deleteMessage } = useChatStore();

  return useMutation({
    mutationFn: (data: { messageId: string; conversationId: string }) =>
      messagesAPI.deleteMessage(data.messageId),
    onSuccess: (_response, variables) => {
      deleteMessage(variables.conversationId, variables.messageId);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};

export const useGetConversations = () => {
  const { setConversations, activeConversationId, setActiveConversation } = useChatStore();

  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await messagesAPI.getConversations();
      if (response.data) {
        setConversations(response.data);
        if (!activeConversationId && response.data.length > 0) {
          setActiveConversation(response.data[0].id);
        }
        return response.data;
      }
      return [];
    },
  });
};