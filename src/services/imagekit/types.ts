export type MediaType = 'image' | 'video' | 'audio' | 'document';

export type UploadStatus = 
  | 'QUEUED' 
  | 'UPLOADING' 
  | 'PROCESSING' 
  | 'UPLOADED' 
  | 'SENDING' 
  | 'SENT' 
  | 'FAILED' 
  | 'CANCELLED';

export interface MediaMetadata {
  fileId: string;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
  aspectRatio?: number;
  createdAt?: string;
}

export interface ImageKitAuthResponse {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
}

export type UploadErrorCode =
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_TYPE'
  | 'IMAGEKIT_ERROR'
  | 'SERVER_ERROR'
  | 'CANCELLED'
  | 'UNKNOWN_ERROR';

export interface UploadError {
  code: UploadErrorCode;
  message: string;
  details?: unknown;
}

export interface UploadItem {
  id: string;
  file: File;
  type: MediaType;
  status: UploadStatus;
  progress: number;
  previewUrl: string;
  caption?: string;
  error?: string | null;
  conversationId: string;
  tempMessageId?: string;
  abortController?: AbortController;
  metadata?: MediaMetadata;
  uploadedUrl?: string;
}
