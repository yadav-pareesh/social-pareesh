import { useState } from 'react';
import { uploadMediaFile } from '../services/imagekit/uploadService';

/**
 * Backward-compatible media upload hook wrapping the new ImageKit pipeline
 */
export const useMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (
    file: File,
    conversationId = 'default',
    userId = 'current-user'
  ): Promise<string | null> => {
    setIsUploading(true);
    try {
      const result = await uploadMediaFile({
        file,
        conversationId,
        userId,
      });
      return result.url;
    } catch (error) {
      console.error('ImageKit upload error:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
};