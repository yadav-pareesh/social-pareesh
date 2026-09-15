import type { MediaType } from './types';

// Configurable file size limits in bytes
export const FILE_SIZE_LIMITS = {
  image: 25 * 1024 * 1024, // 25 MB
  video: 100 * 1024 * 1024, // 100 MB
  audio: 50 * 1024 * 1024, // 50 MB
  document: 50 * 1024 * 1024, // 50 MB
};

export const MAX_CONCURRENT_UPLOADS = 3;

// Safe MIME types categorization
export const ALLOWED_MIME_TYPES: Record<MediaType, string[]> = {
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
    'image/heic',
    'image/heif',
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/ogg',
  ],
  audio: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/m4a',
    'audio/x-m4a',
    'audio/webm',
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/json',
  ],
};

import { getEnvVar } from '../../utils/env';

// Safe environment variable getters for browser & test environments
export const getImageKitConfig = () => ({
  publicKey: getEnvVar('VITE_IMAGEKIT_PUBLIC_KEY', 'public_test_key'),
  urlEndpoint: getEnvVar('VITE_IMAGEKIT_URL_ENDPOINT', 'https://ik.imagekit.io/test'),
});

export interface FileValidationResult {
  isValid: boolean;
  type: MediaType;
  error?: string;
}

export const detectMediaType = (file: File): MediaType | null => {
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  for (const [type, mimes] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (mimes.includes(mime)) {
      return type as MediaType;
    }
  }

  // Fallback check by common extension if mime is empty or generic octet-stream
  if (name.match(/\.(jpg|jpeg|png|webp|gif|avif|heic|heif|svg)$/i)) return 'image';
  if (name.match(/\.(mp4|webm|mov|avi|mkv)$/i)) return 'video';
  if (name.match(/\.(mp3|wav|ogg|aac|m4a)$/i)) return 'audio';
  if (name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip)$/i)) return 'document';

  return null;
};

export const validateFile = (file: File): FileValidationResult => {
  if (!file || file.size <= 0) {
    return { isValid: false, type: 'document', error: 'File is empty or invalid.' };
  }

  const mediaType = detectMediaType(file);
  if (!mediaType) {
    return {
      isValid: false,
      type: 'document',
      error: `Unsupported file format (${file.type || 'unknown'}). Please choose an image, video, audio, or standard document.`,
    };
  }

  const maxSize = FILE_SIZE_LIMITS[mediaType];
  if (file.size > maxSize) {
    const maxMb = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      type: mediaType,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${maxMb} MB limit for ${mediaType}s.`,
    };
  }

  return { isValid: true, type: mediaType };
};
