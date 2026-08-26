import { useState } from 'react';

// Get these from your Cloudinary Dashboard
const CLOUD_NAME = 'r6n4em49'; 
const UPLOAD_PRESET = 'social-pareesh-uploads';

export const useMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message);
      return data.secure_url; 
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload media.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
};