import {
  upload as imageKitUpload,
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  type UploadResponse,
} from '@imagekit/javascript';
import { apiClient } from '../../lib/api-client';
import { validateFile, detectMediaType } from './config';
import type {
  ImageKitAuthResponse,
  MediaMetadata,
  MediaType,
  UploadError,
} from './types';

export interface UploadFileOptions {
  file: File;
  conversationId: string;
  userId: string;
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
}

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  fileId?: string;
  mediaType: MediaType;
  metadata: MediaMetadata;
}

/**
 * Extracts dimensions from an image File
 */
const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number; aspectRatio: number }> => {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const aspectRatio = height > 0 ? Number((width / height).toFixed(2)) : 1;
      resolve({ width, height, aspectRatio });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: 0, height: 0, aspectRatio: 1 });
    };
    img.src = objectUrl;
  });
};

/**
 * Extracts duration and dimensions from a video File
 */
const getVideoDetails = (
  file: File
): Promise<{ duration: number; width: number; height: number }> => {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        duration: Math.round(video.duration || 0),
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ duration: 0, width: 0, height: 0 });
    };
    video.src = objectUrl;
  });
};

/**
 * Extracts duration from an audio File
 */
const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Math.round(audio.duration || 0));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
    audio.src = objectUrl;
  });
};

/**
 * Fetches fresh authentication parameters from the secure backend
 */
export const getImageKitAuth = async (): Promise<ImageKitAuthResponse> => {
  try {
    const response = await apiClient.get<ImageKitAuthResponse>('/media/imagekit/auth');
    if (!response.data || !response.data.token || !response.data.signature) {
      throw new Error('Invalid authentication response from server.');
    }
    return response.data;
  } catch (err: any) {
    const uploadErr: UploadError = {
      code: 'AUTH_ERROR',
      message: err.message || 'Failed to authenticate upload request with server.',
      details: err,
    };
    throw uploadErr;
  }
};

/**
 * Uploads a file directly to ImageKit from browser with progress and abort support
 */
export const uploadMediaFile = async (
  options: UploadFileOptions
): Promise<UploadResult> => {
  const { file, conversationId, userId, onProgress, abortSignal } = options;

  // 1. Client-side validation
  const validation = validateFile(file);
  if (!validation.isValid) {
    const uploadErr: UploadError = {
      code: 'VALIDATION_ERROR',
      message: validation.error || 'Invalid file',
    };
    throw uploadErr;
  }

  const mediaType = validation.type;

  // 2. Pre-extract metadata in parallel with auth request
  const [authData, extraMeta] = await Promise.all([
    getImageKitAuth(),
    (async () => {
      if (mediaType === 'image') {
        return getImageDimensions(file);
      } else if (mediaType === 'video') {
        return getVideoDetails(file);
      } else if (mediaType === 'audio') {
        const duration = await getAudioDuration(file);
        return { duration };
      }
      return {};
    })(),
  ]);

  // 3. Collision-resistant folder and file naming
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniquePrefix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const fileName = `${uniquePrefix}_${safeName}`;
  const folder = `/social-pareesh/conversations/${conversationId}/${userId}`;

  try {
    const uploadResponse: UploadResponse = await imageKitUpload({
      file,
      fileName,
      token: authData.token,
      expire: authData.expire,
      signature: authData.signature,
      publicKey: authData.publicKey,
      folder,
      tags: ['chat-media', `conv-${conversationId}`, `user-${userId}`, mediaType],
      useUniqueFileName: true,
      onProgress: (event: ProgressEvent) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      },
      abortSignal,
    });

    // 4. Construct complete MediaMetadata
    const metadata: MediaMetadata = {
      fileId: uploadResponse.fileId || `ik-${Date.now()}`,
      fileName: uploadResponse.name || fileName,
      originalFileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: uploadResponse.size || file.size,
      width: (uploadResponse.width || (extraMeta as any)?.width) ?? undefined,
      height: (uploadResponse.height || (extraMeta as any)?.height) ?? undefined,
      duration: (uploadResponse.duration || (extraMeta as any)?.duration) ?? undefined,
      thumbnailUrl: uploadResponse.thumbnailUrl || undefined,
      aspectRatio:
        (extraMeta as any)?.aspectRatio ||
        (uploadResponse.width && uploadResponse.height
          ? Number((uploadResponse.width / uploadResponse.height).toFixed(2))
          : undefined),
      createdAt: new Date().toISOString(),
    };

    return {
      url: uploadResponse.url || '',
      thumbnailUrl: uploadResponse.thumbnailUrl,
      fileId: uploadResponse.fileId,
      mediaType,
      metadata,
    };
  } catch (error: any) {
    if (error instanceof ImageKitAbortError || error.name === 'AbortError') {
      const abortErr: UploadError = {
        code: 'CANCELLED',
        message: 'Upload was cancelled.',
      };
      throw abortErr;
    }

    if (error instanceof ImageKitUploadNetworkError) {
      const netErr: UploadError = {
        code: 'NETWORK_ERROR',
        message: 'Network connection lost during upload. Please check connection and retry.',
        details: error,
      };
      throw netErr;
    }

    if (error instanceof ImageKitInvalidRequestError) {
      const invErr: UploadError = {
        code: 'VALIDATION_ERROR',
        message: error.message || 'Invalid upload parameters.',
        details: error,
      };
      throw invErr;
    }

    if (error instanceof ImageKitServerError) {
      const srvErr: UploadError = {
        code: 'IMAGEKIT_ERROR',
        message: 'ImageKit server error. Please try again later.',
        details: error,
      };
      throw srvErr;
    }

    const unkErr: UploadError = {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Failed to upload media.',
      details: error,
    };
    throw unkErr;
  }
};

/**
 * Uploads a profile picture directly to ImageKit with progress tracking
 */
export const uploadProfilePicture = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; fileId?: string; thumbnailUrl?: string }> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file (PNG, JPG, WEBP, GIF).');
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    throw new Error('Profile picture must be under 10MB.');
  }

  const authData = await getImageKitAuth();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniquePrefix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const fileName = `avatar_${uniquePrefix}_${safeName}`;
  const folder = `/social-pareesh/avatars/${userId}`;

  try {
    const uploadResponse: UploadResponse = await imageKitUpload({
      file,
      fileName,
      token: authData.token,
      expire: authData.expire,
      signature: authData.signature,
      publicKey: authData.publicKey,
      folder,
      tags: ['avatar', 'profile-pic', `user-${userId}`],
      useUniqueFileName: true,
      onProgress: (event: ProgressEvent) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      },
    });

    const uploadedUrl = uploadResponse.url;
    if (!uploadedUrl) {
      throw new Error('ImageKit upload did not return a valid URL.');
    }

    return {
      url: uploadedUrl,
      fileId: uploadResponse.fileId,
      thumbnailUrl: uploadResponse.thumbnailUrl,
    };
  } catch (error: any) {
    console.error('ImageKit Profile Upload Error:', error);
    throw new Error(error.message || 'Failed to upload profile photo to ImageKit.');
  }
};
