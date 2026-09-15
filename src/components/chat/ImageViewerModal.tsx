import { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, RotateCw } from 'lucide-react';
import { getImageFull } from '../../services/imagekit/mediaUrlBuilder';

export interface GalleryItem {
  id: string;
  url: string;
  senderName?: string;
  createdAt?: Date | string;
}

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GalleryItem[];
  initialIndex?: number;
}

export const ImageViewerModal = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
}: ImageViewerModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setRotation(0);
      setIsLoading(true);
    }
  }, [isOpen, initialIndex]);

  const currentItem = items[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setScale(1);
      setRotation(0);
      setIsLoading(true);
    }
  }, [currentIndex, items.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setScale(1);
      setRotation(0);
      setIsLoading(true);
    }
  }, [currentIndex]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.3, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = async () => {
    if (!currentItem?.url) return;
    try {
      const response = await fetch(currentItem.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `image_${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(currentItem.url, '_blank');
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || !currentItem) return null;

  const fullUrl = getImageFull(currentItem.url);

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Action Bar */}
      <div
        className="flex items-center justify-between p-3 sm:p-4 text-white/80 bg-gradient-to-b from-black/80 to-transparent z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white/90">
            {currentIndex + 1} / {items.length}
          </span>
          {currentItem.senderName && (
            <span className="text-xs text-white/60 hidden sm:inline">
              Shared by {currentItem.senderName}
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Zoom in (+)"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Zoom out (-)"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            aria-label="Rotate image"
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Rotate"
          >
            <RotateCw className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download image"
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Download"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image viewer"
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-2"
            title="Close (Esc)"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="h-10 w-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        <img
          src={fullUrl}
          alt="Full size view"
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.15s ease-out',
          }}
          className="max-h-[85vh] max-w-[90vw] object-contain cursor-default drop-shadow-2xl select-none"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Previous Button */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous image"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 transition-all z-20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Next Button */}
        {currentIndex < items.length - 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next image"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 transition-all z-20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip (if multiple items) */}
      {items.length > 1 && (
        <div
          className="flex items-center justify-center gap-2 p-3 bg-gradient-to-t from-black/80 to-transparent z-20 overflow-x-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setCurrentIndex(idx);
                setScale(1);
                setRotation(0);
                setIsLoading(true);
              }}
              className={`relative h-12 w-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                idx === currentIndex
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={item.url}
                alt={`Thumbnail ${idx + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
