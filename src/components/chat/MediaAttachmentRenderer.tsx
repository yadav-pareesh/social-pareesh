import { useState, useRef, useEffect } from 'react';
import type { Message } from '../../types';
import type { MediaMetadata, MediaType } from '../../services/imagekit/types';
import {
  getImageThumbnail,
  getVideoPoster,
  formatBytes,
  formatDuration,
} from '../../services/imagekit/mediaUrlBuilder';
import { useMediaStore } from '../../stores/mediaStore';
import {
  Play,
  Pause,
  Download,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  File as GenericFile,
  AlertCircle,
  RotateCw,
  X,
  Volume2,
} from 'lucide-react';

interface MediaAttachmentRendererProps {
  message: Message;
  onImageClick?: (url: string) => void;
}

export const MediaAttachmentRenderer = ({
  message,
  onImageClick,
}: MediaAttachmentRendererProps) => {
  const { attachmentUrl, attachmentType } = message;

  // Safe parse metadata if string or object
  const metadata: MediaMetadata | null = (() => {
    if (!message.attachmentMetadata) return null;
    if (typeof message.attachmentMetadata === 'string') {
      try {
        return JSON.parse(message.attachmentMetadata);
      } catch {
        return null;
      }
    }
    return message.attachmentMetadata as MediaMetadata;
  })();

  // Check upload state in media store if temporary message
  const uploadItem = useMediaStore((state) =>
    message.id.startsWith('temp-')
      ? state.getUploadByTempMessageId(message.id) ||
        Object.values(state.uploads).find((u) => u.previewUrl === attachmentUrl)
      : undefined
  );

  const cancelUpload = useMediaStore((state) => state.cancelUpload);
  const retryUpload = useMediaStore((state) => state.retryUpload);

  // Audio player state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(metadata?.duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Image load state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime);
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(Math.round(audio.duration));
      }
    };

    const onEnded = () => {
      setIsPlayingAudio(false);
      setAudioProgress(0);
      setAudioCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [attachmentType]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || !audioDuration) return;
    const newPercent = Number(e.target.value);
    const newTime = (newPercent / 100) * audioDuration;
    audioRef.current.currentTime = newTime;
    setAudioProgress(newPercent);
    setAudioCurrentTime(newTime);
  };

  // Render upload overlay if item is uploading / failed
  const isUploading =
    uploadItem &&
    (uploadItem.status === 'QUEUED' ||
      uploadItem.status === 'UPLOADING' ||
      uploadItem.status === 'PROCESSING' ||
      uploadItem.status === 'SENDING');

  const isUploadFailed = uploadItem && uploadItem.status === 'FAILED';

  const effectiveType: MediaType =
    (attachmentType as MediaType) ||
    (attachmentUrl?.match(/\.(mp4|webm|mov)$/i)
      ? 'video'
      : attachmentUrl?.match(/\.(mp3|wav|ogg|aac|m4a)$/i)
      ? 'audio'
      : attachmentUrl?.match(/\.(pdf|doc|docx|xls|xlsx|ppt|zip|txt)$/i)
      ? 'document'
      : 'image');

  // Document icon helper
  const getDocumentIcon = (fileName = '', mime = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || mime.includes('pdf')) {
      return <FileText className="h-8 w-8 text-rose-500 shrink-0" />;
    }
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv' || mime.includes('sheet') || mime.includes('excel')) {
      return <FileSpreadsheet className="h-8 w-8 text-emerald-500 shrink-0" />;
    }
    if (ext === 'zip' || ext === 'rar' || mime.includes('zip')) {
      return <FileArchive className="h-8 w-8 text-amber-500 shrink-0" />;
    }
    if (ext === 'js' || ext === 'ts' || ext === 'json' || ext === 'html' || ext === 'css') {
      return <FileCode className="h-8 w-8 text-blue-500 shrink-0" />;
    }
    return <GenericFile className="h-8 w-8 text-indigo-500 shrink-0" />;
  };

  if (!attachmentUrl) return null;

  return (
    <div className="relative mb-1 rounded-xl overflow-hidden select-none">
      {/* --- 1. IMAGE ATTACHMENT --- */}
      {effectiveType === 'image' && (
        <div
          className="relative max-w-full rounded-xl overflow-hidden bg-black/10 dark:bg-black/30 cursor-pointer group/img"
          onClick={() => {
            if (!isUploading && onImageClick) {
              onImageClick(attachmentUrl);
            }
          }}
        >
          {/* Skeleton placeholder */}
          {!imageLoaded && !imageError && (
            <div className="h-48 w-64 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
          )}

          {/* Broken image error UI */}
          {imageError ? (
            <div className="h-36 w-60 flex flex-col items-center justify-center p-3 text-center bg-zinc-100 dark:bg-zinc-800/80 rounded-xl text-muted-foreground text-xs gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <span>Failed to load image</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageError(false);
                  setImageLoaded(false);
                }}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <RotateCw className="h-3 w-3" /> Retry
              </button>
            </div>
          ) : (
            <img
              src={getImageThumbnail(attachmentUrl)}
              alt="Shared image"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
              className={`max-h-[320px] max-w-full w-auto object-contain rounded-xl transition-all duration-200 ${
                imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
              } group-hover/img:scale-[1.01]`}
            />
          )}
        </div>
      )}

      {/* --- 2. VIDEO ATTACHMENT --- */}
      {effectiveType === 'video' && (
        <div className="rounded-xl overflow-hidden bg-black max-w-full">
          <video
            src={attachmentUrl}
            poster={getVideoPoster(attachmentUrl, metadata?.thumbnailUrl)}
            controls
            preload="metadata"
            className="max-h-[320px] w-auto max-w-full object-contain rounded-xl"
          />
        </div>
      )}

      {/* --- 3. AUDIO ATTACHMENT --- */}
      {effectiveType === 'audio' && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80 border border-zinc-300/60 dark:border-zinc-700/60 min-w-[240px] sm:min-w-[280px]">
          <audio ref={audioRef} src={attachmentUrl} preload="metadata" className="hidden" />

          {/* Play/Pause button */}
          <button
            type="button"
            onClick={toggleAudio}
            aria-label={isPlayingAudio ? 'Pause audio' : 'Play audio'}
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md hover:opacity-90 transition-transform active:scale-95"
          >
            {isPlayingAudio ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>

          {/* Progress & Duration */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>{formatDuration(audioCurrentTime)}</span>
              <span>{formatDuration(audioDuration)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={audioProgress}
              onChange={handleAudioSeek}
              aria-label="Seek audio"
              className="h-1.5 w-full rounded-lg appearance-none bg-zinc-300 dark:bg-zinc-700 accent-primary cursor-pointer"
            />
          </div>

          <a
            href={attachmentUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download audio"
            className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            title="Download audio"
          >
            <Download className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* --- 4. DOCUMENT ATTACHMENT --- */}
      {effectiveType === 'document' && (
        <a
          href={attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={metadata?.originalFileName || metadata?.fileName}
          className="flex items-center gap-3 p-3 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/70 border border-zinc-300/60 dark:border-zinc-700/60 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors group/doc max-w-sm"
        >
          {getDocumentIcon(metadata?.originalFileName || metadata?.fileName, metadata?.mimeType)}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-foreground group-hover/doc:underline">
              {metadata?.originalFileName || metadata?.fileName || 'Document'}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
              <span>{formatBytes(metadata?.size)}</span>
              {metadata?.mimeType && (
                <span className="uppercase text-[9px] px-1 py-0.5 rounded bg-zinc-300/80 dark:bg-zinc-700/80 font-mono">
                  {metadata.mimeType.split('/')[1]?.substring(0, 5) || 'FILE'}
                </span>
              )}
            </div>
          </div>
          <div className="p-2 rounded-full bg-primary/10 text-primary group-hover/doc:bg-primary group-hover/doc:text-primary-foreground transition-colors shrink-0">
            <Download className="h-4 w-4" />
          </div>
        </a>
      )}

      {/* --- UPLOAD OVERLAY (PROGRESS / CANCEL / RETRY) --- */}
      {isUploading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-xl text-white p-3">
          <div className="relative h-12 w-12 flex items-center justify-center mb-1">
            <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-white/20"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-primary transition-all duration-200"
                strokeDasharray={`${uploadItem?.progress || 0}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <button
              type="button"
              onClick={() => uploadItem && cancelUpload(uploadItem.id)}
              className="absolute p-1 rounded-full hover:bg-white/20 transition-colors"
              title="Cancel upload"
              aria-label="Cancel upload"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
          <span className="text-xs font-medium tracking-tight text-white/90">
            {uploadItem?.status === 'QUEUED'
              ? 'Waiting in queue...'
              : `${uploadItem?.progress || 0}%`}
          </span>
        </div>
      )}

      {/* --- FAILED UPLOAD OVERLAY --- */}
      {isUploadFailed && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-[2px] rounded-xl text-white p-3 text-center">
          <AlertCircle className="h-7 w-7 text-destructive mb-1" />
          <span className="text-xs font-medium text-red-300">Upload failed</span>
          <button
            type="button"
            onClick={() => uploadItem && retryUpload(uploadItem.id)}
            className="mt-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RotateCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}
    </div>
  );
};
