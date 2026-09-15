import { getImageKitConfig } from './config';
import type { MediaType } from './types';

/**
 * Checks whether a given URL is served from an ImageKit endpoint
 */
export const isImageKitUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.includes('ik.imagekit.io') || url.includes('imagekit.io');
};

/**
 * Checks whether a given URL is a legacy Cloudinary URL
 */
export const isCloudinaryUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.includes('res.cloudinary.com');
};

/**
 * Generates an ImageKit transformation URL using path or query-parameter transformation.
 * Defaults to query parameter (?tr=...) if it's an absolute URL, which ImageKit standardly supports.
 */
export const applyImageKitTransform = (url: string, transformParams: string): string => {
  if (!url) return '';
  if (!isImageKitUrl(url)) return url; // Don't alter non-ImageKit URLs

  try {
    const parsed = new URL(url);
    const existingTr = parsed.searchParams.get('tr');
    if (existingTr) {
      parsed.searchParams.set('tr', `${existingTr}:${transformParams}`);
    } else {
      parsed.searchParams.set('tr', transformParams);
    }
    return parsed.toString();
  } catch {
    // If URL parsing fails, simple string append
    const delimiter = url.includes('?') ? '&' : '?';
    return `${url}${delimiter}tr=${transformParams}`;
  }
};

/**
 * Generates an optimized thumbnail for images (e.g. 300x300 for chat bubbles)
 */
export const getImageThumbnail = (url?: string, width = 320, height = 320): string => {
  if (!url) return '';
  if (!isImageKitUrl(url)) {
    if (isCloudinaryUrl(url)) {
      return url.replace('/upload/', `/upload/w_${width},h_${height},c_limit,q_auto,f_auto/`);
    }
    return url;
  }
  return applyImageKitTransform(url, `w-${width},h-${height},cm-pad_resize,q-80,f-auto`);
};

/**
 * Generates a medium preview image (e.g. 800px wide for lightbox initial view)
 */
export const getImagePreview = (url?: string, width = 800): string => {
  if (!url) return '';
  if (!isImageKitUrl(url)) {
    if (isCloudinaryUrl(url)) {
      return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`);
    }
    return url;
  }
  return applyImageKitTransform(url, `w-${width},q-85,f-auto`);
};

/**
 * Generates high quality image for full-screen viewer
 */
export const getImageFull = (url?: string): string => {
  if (!url) return '';
  if (!isImageKitUrl(url)) return url;
  return applyImageKitTransform(url, 'q-90,f-auto');
};

/**
 * Generates a video poster/thumbnail URL from ImageKit or returns empty/placeholder
 * ImageKit supports extracting a thumbnail frame from video by appending /ik-thumbnail.jpg or tr=so-1
 */
export const getVideoPoster = (url?: string, thumbnailUrl?: string): string => {
  if (thumbnailUrl) return thumbnailUrl;
  if (!url) return '';

  if (isImageKitUrl(url)) {
    // If URL points to an imagekit video, appending /ik-thumbnail.jpg creates a poster frame
    try {
      const parsed = new URL(url);
      if (!parsed.pathname.endsWith('/ik-thumbnail.jpg')) {
        parsed.pathname = `${parsed.pathname}/ik-thumbnail.jpg`;
      }
      return parsed.toString();
    } catch {
      return `${url}/ik-thumbnail.jpg`;
    }
  }

  if (isCloudinaryUrl(url)) {
    // Cloudinary generates video poster by changing extension to .jpg
    return url.replace(/\.[^/.]+$/, '.jpg');
  }

  return '';
};

/**
 * Optimized delivery URL for any media type
 */
export const getOptimizedMediaUrl = (url?: string, type?: MediaType): string => {
  if (!url) return '';
  if (type === 'image') return getImagePreview(url, 1080);
  return url;
};

/**
 * Formats file size in bytes to human-readable string (KB, MB)
 */
export const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  const formatted = Number.isInteger(value) || value >= 100 ? Math.round(value).toString() : value.toFixed(1);
  return `${formatted} ${units[i]}`;
};

/**
 * Formats duration in seconds to MM:SS
 */
export const formatDuration = (seconds?: number): string => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
