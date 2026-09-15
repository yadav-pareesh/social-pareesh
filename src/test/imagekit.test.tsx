import {
  validateFile,
  detectMediaType,
  FILE_SIZE_LIMITS,
} from '../services/imagekit/config';
import {
  getImageThumbnail,
  getImagePreview,
  getVideoPoster,
  isImageKitUrl,
  isCloudinaryUrl,
  formatBytes,
  formatDuration,
} from '../services/imagekit/mediaUrlBuilder';
import { useMediaStore } from '../stores/mediaStore';

describe('ImageKit Media System Utilities', () => {
  describe('File validation & media detection', () => {
    test('detects correct media types from MIME types', () => {
      const imgFile = new File(['content'], 'avatar.png', { type: 'image/png' });
      expect(detectMediaType(imgFile)).toBe('image');

      const videoFile = new File(['content'], 'clip.mp4', { type: 'video/mp4' });
      expect(detectMediaType(videoFile)).toBe('video');

      const audioFile = new File(['content'], 'song.mp3', { type: 'audio/mpeg' });
      expect(detectMediaType(audioFile)).toBe('audio');

      const docFile = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      expect(detectMediaType(docFile)).toBe('document');
    });

    test('validates file size within allowed limits', () => {
      const validImg = new File(['img_bytes'], 'photo.jpg', { type: 'image/jpeg' });
      const res = validateFile(validImg);
      expect(res.isValid).toBe(true);
      expect(res.type).toBe('image');
    });

    test('rejects empty files', () => {
      const emptyFile = new File([], 'empty.png', { type: 'image/png' });
      const res = validateFile(emptyFile);
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/empty or invalid/i);
    });

    test('rejects oversized files beyond configured limits', () => {
      // Create a mock large file
      const oversizedFile = {
        name: 'giant.png',
        type: 'image/png',
        size: FILE_SIZE_LIMITS.image + 1024,
      } as File;

      const res = validateFile(oversizedFile);
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/exceeds/i);
    });

    test('rejects unsupported file formats', () => {
      const weirdFile = new File(['data'], 'malware.exe', { type: 'application/x-msdownload' });
      const res = validateFile(weirdFile);
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/unsupported/i);
    });
  });

  describe('Media URL transformations', () => {
    const ikImgUrl = 'https://ik.imagekit.io/test/users/u1/photo.jpg';
    const ikVideoUrl = 'https://ik.imagekit.io/test/users/u1/clip.mp4';
    const cloudImgUrl = 'https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg';

    test('identifies ImageKit vs Cloudinary vs local URLs', () => {
      expect(isImageKitUrl(ikImgUrl)).toBe(true);
      expect(isImageKitUrl(cloudImgUrl)).toBe(false);
      expect(isCloudinaryUrl(cloudImgUrl)).toBe(true);
      expect(isCloudinaryUrl(ikImgUrl)).toBe(false);
    });

    test('generates ImageKit thumbnail with transform parameters', () => {
      const thumb = getImageThumbnail(ikImgUrl, 250, 250);
      expect(decodeURIComponent(thumb)).toContain('tr=w-250,h-250');
    });

    test('generates backward-compatible Cloudinary thumbnail', () => {
      const thumb = getImageThumbnail(cloudImgUrl, 200, 200);
      expect(thumb).toContain('/upload/w_200,h_200');
    });

    test('generates video poster for ImageKit videos', () => {
      const poster = getVideoPoster(ikVideoUrl);
      expect(poster).toBe('https://ik.imagekit.io/test/users/u1/clip.mp4/ik-thumbnail.jpg');
    });

    test('formats bytes to human-readable strings', () => {
      expect(formatBytes(500)).toBe('500 B');
      expect(formatBytes(2048)).toBe('2 KB');
      expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });

    test('formats seconds to MM:SS', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(360)).toBe('6:00');
    });
  });

  describe('Zustand Media Store lifecycle', () => {
    // Mock URL.createObjectURL and revokeObjectURL
    beforeAll(() => {
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-preview-url');
      global.URL.revokeObjectURL = jest.fn();
    });

    test('queues upload item and allows cancellation', () => {
      const dummyFile = new File(['dummy'], 'test.png', { type: 'image/png' });

      const uploadId = useMediaStore.getState().queueUpload({
        file: dummyFile,
        type: 'image',
        conversationId: 'c1',
        tempMessageId: 'temp-123',
      });

      expect(useMediaStore.getState().uploads[uploadId]).toBeDefined();
      expect(useMediaStore.getState().uploads[uploadId].previewUrl).toBe('blob:mock-preview-url');

      // Cancel upload
      useMediaStore.getState().cancelUpload(uploadId);
      expect(useMediaStore.getState().uploads[uploadId].status).toBe('CANCELLED');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-preview-url');

      // Clean up
      useMediaStore.getState().removeUpload(uploadId);
      expect(useMediaStore.getState().uploads[uploadId]).toBeUndefined();
    });
  });
});
