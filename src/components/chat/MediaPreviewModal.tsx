import { useState, useEffect, useRef } from 'react';
import { X, Plus, Send, Play, FileText, Trash2, Smile } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { validateFile, detectMediaType } from '../../services/imagekit/config';
import type { MediaType } from '../../services/imagekit/types';
import { formatBytes } from '../../services/imagekit/mediaUrlBuilder';

export interface PendingMediaFile {
  id: string;
  file: File;
  type: MediaType;
  previewUrl: string;
}

interface MediaPreviewModalProps {
  isOpen: boolean;
  files: File[];
  onClose: () => void;
  onSend: (items: { file: File; caption: string; type: MediaType }[]) => void;
}

export const MediaPreviewModal = ({
  isOpen,
  files,
  onClose,
  onSend,
}: MediaPreviewModalProps) => {
  const [items, setItems] = useState<PendingMediaFile[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize and validate files on open or when files prop changes
  useEffect(() => {
    if (!isOpen || files.length === 0) {
      setItems([]);
      setActiveIndex(0);
      setCaption('');
      setShowEmojiPicker(false);
      return;
    }

    const newItems: PendingMediaFile[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      const validation = validateFile(file);
      if (validation.isValid) {
        newItems.push({
          id: `preview_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          file,
          type: validation.type,
          previewUrl: URL.createObjectURL(file),
        });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      alert(`Some files could not be added:\n${errors.join('\n')}`);
    }

    if (newItems.length === 0) {
      onClose();
      return;
    }

    setItems(newItems);
    setActiveIndex(0);

    // Cleanup object URLs when component unmounts or changes
    return () => {
      newItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [isOpen, files, onClose]);

  const handleClose = () => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
    setShowEmojiPicker(false);
    onClose();
  };

  const handleRemoveItem = (index: number) => {
    const itemToRemove = items[index];
    if (itemToRemove) {
      URL.revokeObjectURL(itemToRemove.previewUrl);
    }

    const nextItems = items.filter((_, idx) => idx !== index);
    if (nextItems.length === 0) {
      handleClose();
      return;
    }

    setItems(nextItems);
    if (activeIndex >= nextItems.length) {
      setActiveIndex(nextItems.length - 1);
    }
  };

  const handleAddMoreFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    const addedItems: PendingMediaFile[] = [];
    newFiles.forEach((file) => {
      const validation = validateFile(file);
      if (validation.isValid) {
        addedItems.push({
          id: `preview_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          file,
          type: validation.type,
          previewUrl: URL.createObjectURL(file),
        });
      } else {
        alert(`${file.name}: ${validation.error}`);
      }
    });

    setItems((prev) => [...prev, ...addedItems]);
    if (additionalFileInputRef.current) {
      additionalFileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const payload = items.map((item, idx) => ({
      file: item.file,
      caption: idx === activeIndex ? caption.trim() : '',
      type: item.type,
    }));

    // Revoke local preview URLs as they will be managed by upload queue
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
    onSend(payload);
    onClose();
  };

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[activeIndex];

  return (
    <div className="fixed inset-0 z-[99990] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-2xl h-[90vh] max-h-[720px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/60">
          <span className="text-sm font-semibold tracking-wide text-zinc-200">
            Preview Media ({items.length})
          </span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cancel preview"
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Preview Area */}
        <div className="relative flex-1 flex items-center justify-center p-4 bg-zinc-950/40 overflow-hidden">
          {currentItem.type === 'image' && (
            <img
              src={currentItem.previewUrl}
              alt="Preview"
              className="max-h-full max-w-full object-contain rounded-lg drop-shadow-md"
            />
          )}

          {currentItem.type === 'video' && (
            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <video
                src={currentItem.previewUrl}
                controls
                className="max-h-[50vh] max-w-full object-contain rounded-lg"
              />
            </div>
          )}

          {currentItem.type === 'audio' && (
            <div className="flex flex-col items-center gap-3 p-6 bg-zinc-800/80 rounded-2xl border border-zinc-700/80 max-w-md w-full">
              <div className="h-16 w-16 rounded-full bg-primary/20 text-primary flex items-center justify-center shadow-inner">
                <Play className="h-8 w-8 ml-1" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-zinc-100 truncate max-w-[280px]">
                  {currentItem.file.name}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">{formatBytes(currentItem.file.size)}</p>
              </div>
              <audio src={currentItem.previewUrl} controls className="w-full mt-2" />
            </div>
          )}

          {currentItem.type === 'document' && (
            <div className="flex flex-col items-center gap-3 p-6 bg-zinc-800/80 rounded-2xl border border-zinc-700/80 max-w-md w-full text-center">
              <FileText className="h-16 w-16 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-zinc-100 truncate max-w-[280px]">
                  {currentItem.file.name}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {formatBytes(currentItem.file.size)} • {currentItem.file.type || 'Document'}
                </p>
              </div>
            </div>
          )}

          {/* Delete active file button */}
          <button
            type="button"
            onClick={() => handleRemoveItem(activeIndex)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-destructive text-zinc-300 hover:text-white transition-colors"
            title="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Caption & Controls Form */}
        <form onSubmit={handleSubmit} className="border-t border-zinc-800/80 bg-zinc-950/60 p-3">
          <div className="relative flex items-center gap-2 mb-3">
            {/* Emoji Picker Popup */}
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 left-0 z-[100] shadow-2xl rounded-xl overflow-hidden">
                <EmojiPicker
                  onEmojiClick={(emoji) => setCaption((prev) => prev + emoji.emoji)}
                  theme={Theme.DARK}
                  lazyLoadEmojis
                  width={320}
                  height={350}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              aria-label="Add emoji to caption"
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
            >
              <Smile className="h-5 w-5" />
            </button>

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="flex-1 bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-primary"
            />

            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md shrink-0"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </button>
          </div>

          {/* Multi-item Thumbnail Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative h-12 w-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                  idx === activeIndex
                    ? 'border-primary scale-105 shadow-md'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {item.type === 'image' && (
                  <img src={item.previewUrl} alt="strip" className="h-full w-full object-cover" />
                )}
                {item.type === 'video' && (
                  <div className="h-full w-full bg-zinc-800 flex items-center justify-center">
                    <Play className="h-4 w-4 text-zinc-200" />
                  </div>
                )}
                {item.type === 'audio' && (
                  <div className="h-full w-full bg-zinc-800 flex items-center justify-center">
                    <Play className="h-4 w-4 text-primary" />
                  </div>
                )}
                {item.type === 'document' && (
                  <div className="h-full w-full bg-zinc-800 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-zinc-300" />
                  </div>
                )}
              </button>
            ))}

            {/* Add More Files Button */}
            <input
              type="file"
              ref={additionalFileInputRef}
              onChange={handleAddMoreFiles}
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => additionalFileInputRef.current?.click()}
              aria-label="Add more files"
              className="h-12 w-12 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
              title="Add more files"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
