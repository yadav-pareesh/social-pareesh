import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesAPI } from '../services/api/messages';
import { useChatStore } from '../stores/chatStore';
import type { Message, Conversation } from '../types';

export const useConversationMessages = (conversationId: string | null) => {
  const setMessages = useChatStore((state) => state.setMessages);

  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const response = await messagesAPI.getConversationMessages(conversationId, 50, 0);

      // Robust pagination / array fallback check
      let messageList: Message[] = [];
      if (Array.isArray(response.data)) {
        messageList = response.data;
      } else if (response.data && Array.isArray((response.data as any).items)) {
        messageList = (response.data as any).items;
      } else if (Array.isArray((response as any).items)) {
        messageList = (response as any).items;
      }

      // Sync into Zustand store
      setMessages(conversationId, messageList);
      return messageList;
    },
    enabled: Boolean(conversationId),
    staleTime: Infinity, // Prevent background refetches from overwriting incoming socket messages
    refetchOnWindowFocus: false,
  });
};

export const useEditMessage = () => {
  const queryClient = useQueryClient();
  const editMessage = useChatStore((state) => state.editMessage);

  return useMutation({
    mutationFn: (data: { messageId: string; content: string; conversationId: string }) =>
      messagesAPI.editMessage(data.messageId, data.content),
    onSuccess: (response, variables) => {
      const updatedContent = response.data?.content || variables.content;
      
      // 1. Update Zustand store
      editMessage(variables.conversationId, variables.messageId, updatedContent);

      // 2. Update React Query specific conversation cache
      queryClient.setQueryData<Message[]>(
        ['messages', variables.conversationId],
        (old = []) =>
          old.map((m) =>
            m.id === variables.messageId
              ? { ...m, content: updatedContent, editedAt: new Date() }
              : m
          )
      );
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  const deleteMessage = useChatStore((state) => state.deleteMessage);

  return useMutation({
    mutationFn: (data: { messageId: string; conversationId: string }) =>
      messagesAPI.deleteMessage(data.messageId),
    onSuccess: (_response, variables) => {
      // 1. Update Zustand store
      deleteMessage(variables.conversationId, variables.messageId);

      // 2. Update React Query specific conversation cache
      queryClient.setQueryData<Message[]>(
        ['messages', variables.conversationId],
        (old = []) => old.filter((m) => m.id !== variables.messageId)
      );
    },
  });
};

export const useGetConversations = () => {
  const setConversations = useChatStore((state) => state.setConversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);

  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await messagesAPI.getConversations();
      
      let list: Conversation[] = [];
      if (Array.isArray(response.data)) {
        list = response.data;
      } else if (response.data && Array.isArray((response.data as any).items)) {
        list = (response.data as any).items;
      }

      if (list.length > 0) {
        setConversations(list);
        if (!activeConversationId) {
          setActiveConversation(list[0].id);
        }
      }
      return list;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });
};