import { create } from 'zustand';
import { MAX_CONCURRENT_UPLOADS } from '../services/imagekit/config';
import type { UploadItem, UploadStatus } from '../services/imagekit/types';
import { uploadMediaFile, type UploadResult } from '../services/imagekit/uploadService';

interface MediaStoreState {
  uploads: Record<string, UploadItem>;
  queueUpload: (
    item: Omit<UploadItem, 'id' | 'status' | 'progress' | 'previewUrl' | 'abortController'>,
    onSuccess?: (result: UploadResult, item: UploadItem) => Promise<void> | void
  ) => string;
  cancelUpload: (id: string) => void;
  retryUpload: (
    id: string,
    onSuccess?: (result: UploadResult, item: UploadItem) => Promise<void> | void
  ) => void;
  removeUpload: (id: string) => void;
  clearConversationUploads: (conversationId: string) => void;
  getUploadsForConversation: (conversationId: string) => UploadItem[];
  getUploadByTempMessageId: (tempMessageId: string) => UploadItem | undefined;
}

export const useMediaStore = create<MediaStoreState>((set, get) => {
  // Helper to run queue with concurrency limit
  const runQueue = (
    onSuccessMap: Map<string, (result: UploadResult, item: UploadItem) => Promise<void> | void>
  ) => {
    const { uploads } = get();
    const uploadList = Object.values(uploads);

    const activeCount = uploadList.filter(
      (u) => u.status === 'UPLOADING' || u.status === 'PROCESSING' || u.status === 'SENDING'
    ).length;

    if (activeCount >= MAX_CONCURRENT_UPLOADS) return;

    const nextQueued = uploadList.find((u) => u.status === 'QUEUED');
    if (!nextQueued) return;

    const abortController = new AbortController();

    // Mark as UPLOADING
    set((state) => ({
      uploads: {
        ...state.uploads,
        [nextQueued.id]: {
          ...state.uploads[nextQueued.id],
          status: 'UPLOADING' as UploadStatus,
          abortController,
          progress: 0,
          error: null,
        },
      },
    }));

    uploadMediaFile({
      file: nextQueued.file,
      conversationId: nextQueued.conversationId,
      userId: 'current-user', // handled internally by auth
      abortSignal: abortController.signal,
      onProgress: (progress) => {
        set((state) => {
          const current = state.uploads[nextQueued.id];
          if (!current || current.status !== 'UPLOADING') return state;
          return {
            uploads: {
              ...state.uploads,
              [nextQueued.id]: {
                ...current,
                progress,
              },
            },
          };
        });
      },
    })
      .then(async (result) => {
        set((state) => {
          const current = state.uploads[nextQueued.id];
          if (!current) return state;
          return {
            uploads: {
              ...state.uploads,
              [nextQueued.id]: {
                ...current,
                status: 'UPLOADED' as UploadStatus,
                progress: 100,
                uploadedUrl: result.url,
                metadata: result.metadata,
              },
            },
          };
        });

        // Trigger callback to send socket message
        const callback = onSuccessMap.get(nextQueued.id);
        if (callback) {
          try {
            set((state) => ({
              uploads: {
                ...state.uploads,
                [nextQueued.id]: {
                  ...state.uploads[nextQueued.id],
                  status: 'SENDING' as UploadStatus,
                },
              },
            }));
            await callback(result, get().uploads[nextQueued.id]);
            set((state) => ({
              uploads: {
                ...state.uploads,
                [nextQueued.id]: {
                  ...state.uploads[nextQueued.id],
                  status: 'SENT' as UploadStatus,
                },
              },
            }));
          } catch (sendErr: any) {
            set((state) => ({
              uploads: {
                ...state.uploads,
                [nextQueued.id]: {
                  ...state.uploads[nextQueued.id],
                  status: 'FAILED' as UploadStatus,
                  error: sendErr?.message || 'Failed to deliver message via socket',
                },
              },
            }));
          }
        }

        // Clean up preview URL memory
        const finishedItem = get().uploads[nextQueued.id];
        if (finishedItem?.previewUrl) {
          URL.revokeObjectURL(finishedItem.previewUrl);
        }

        // Run next in queue
        runQueue(onSuccessMap);
      })
      .catch((error: any) => {
        const isCancelled = error?.code === 'CANCELLED' || error?.name === 'AbortError';
        set((state) => {
          const current = state.uploads[nextQueued.id];
          if (!current) return state;
          if (current.previewUrl && isCancelled) {
            URL.revokeObjectURL(current.previewUrl);
          }
          return {
            uploads: {
              ...state.uploads,
              [nextQueued.id]: {
                ...current,
                status: (isCancelled ? 'CANCELLED' : 'FAILED') as UploadStatus,
                error: isCancelled ? 'Upload cancelled' : error.message || 'Upload failed',
              },
            },
          };
        });

        // Run next in queue
        runQueue(onSuccessMap);
      });
  };

  // Internal persistent map for upload callbacks in runtime memory
  const callbackRegistry = new Map<
    string,
    (result: UploadResult, item: UploadItem) => Promise<void> | void
  >();

  return {
    uploads: {},

    queueUpload: (item, onSuccess) => {
      const id = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const previewUrl = URL.createObjectURL(item.file);

      const newItem: UploadItem = {
        ...item,
        id,
        status: 'QUEUED',
        progress: 0,
        previewUrl,
        error: null,
      };

      if (onSuccess) {
        callbackRegistry.set(id, onSuccess);
      }

      set((state) => ({
        uploads: {
          ...state.uploads,
          [id]: newItem,
        },
      }));

      // Schedule queue runner
      setTimeout(() => runQueue(callbackRegistry), 0);

      return id;
    },

    cancelUpload: (id: string) => {
      const { uploads } = get();
      const item = uploads[id];
      if (!item) return;

      if (item.abortController) {
        item.abortController.abort();
      }

      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }

      set((state) => ({
        uploads: {
          ...state.uploads,
          [id]: {
            ...state.uploads[id],
            status: 'CANCELLED',
            error: 'Upload cancelled',
          },
        },
      }));
    },

    retryUpload: (id: string, onSuccess) => {
      const { uploads } = get();
      const item = uploads[id];
      if (!item) return;

      if (onSuccess) {
        callbackRegistry.set(id, onSuccess);
      }

      set((state) => ({
        uploads: {
          ...state.uploads,
          [id]: {
            ...state.uploads[id],
            status: 'QUEUED',
            progress: 0,
            error: null,
          },
        },
      }));

      setTimeout(() => runQueue(callbackRegistry), 0);
    },

    removeUpload: (id: string) => {
      const { uploads } = get();
      const item = uploads[id];
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      callbackRegistry.delete(id);

      set((state) => {
        const next = { ...state.uploads };
        delete next[id];
        return { uploads: next };
      });
    },

    clearConversationUploads: (conversationId: string) => {
      const { uploads } = get();
      const next = { ...uploads };
      Object.values(uploads).forEach((u) => {
        if (u.conversationId === conversationId) {
          if (u.previewUrl) URL.revokeObjectURL(u.previewUrl);
          callbackRegistry.delete(u.id);
          delete next[u.id];
        }
      });
      set({ uploads: next });
    },

    getUploadsForConversation: (conversationId: string) => {
      const { uploads } = get();
      return Object.values(uploads).filter((u) => u.conversationId === conversationId);
    },

    getUploadByTempMessageId: (tempMessageId: string) => {
      const { uploads } = get();
      return Object.values(uploads).find((u) => u.tempMessageId === tempMessageId);
    },
  };
});
