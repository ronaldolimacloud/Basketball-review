import React, { useState } from 'react';
import { Play, ChevronLeft, ChevronRight, Image } from 'lucide-react';

interface ThumbnailPreviewProps {
  thumbnails: string[];
  onThumbnailClick?: (index: number) => void;
  className?: string;
}

export const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  thumbnails,
  onThumbnailClick,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  if (!thumbnails || thumbnails.length === 0) {
    return (
      <div className={`bg-zinc-800 rounded-lg p-8 text-center ${className}`}>
        <Image className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
        <p className="text-zinc-500 text-sm">No thumbnails available</p>
      </div>
    );
  }

  const nextThumbnail = () => {
    setCurrentIndex((prev) => (prev + 1) % thumbnails.length);
  };

  const prevThumbnail = () => {
    setCurrentIndex((prev) => (prev - 1 + thumbnails.length) % thumbnails.length);
  };

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
    onThumbnailClick?.(index);
  };

  return (
    <div className={`bg-zinc-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-zinc-300">Video Thumbnails</h4>
        <span className="text-xs text-zinc-500">
          {currentIndex + 1} / {thumbnails.length}
        </span>
      </div>

      {/* Main thumbnail display */}
      <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden mb-4 group">
        {!imageErrors.has(currentIndex) ? (
          <img
            src={thumbnails[currentIndex]}
            alt={`Thumbnail ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            onError={() => handleImageError(currentIndex)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Image className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
              <p className="text-xs text-zinc-500">Failed to load</p>
            </div>
          </div>
        )}

        {/* Navigation arrows */}
        {thumbnails.length > 1 && (
          <>
            <button
              onClick={prevThumbnail}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={nextThumbnail}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <button
            onClick={() => onThumbnailClick?.(currentIndex)}
            className="bg-yellow-500 hover:bg-yellow-600 p-3 rounded-full text-black transition-all transform hover:scale-110 shadow-lg"
          >
            <Play className="w-6 h-6" />
          </button>
        </div>

        {/* Timestamp indicator */}
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
          Frame {currentIndex + 1}
        </div>
      </div>

      {/* Thumbnail strip */}
      {thumbnails.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {thumbnails.map((thumbnail, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`flex-shrink-0 w-16 h-9 rounded border-2 transition-all overflow-hidden ${
                index === currentIndex
                  ? 'border-yellow-500 ring-2 ring-yellow-500/30'
                  : 'border-zinc-600 hover:border-zinc-500'
              }`}
            >
              {!imageErrors.has(index) ? (
                <img
                  src={thumbnail}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(index)}
                />
              ) : (
                <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                  <Image className="w-3 h-3 text-zinc-500" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Thumbnail info */}
      <div className="mt-3 text-xs text-zinc-500">
        <p>Click thumbnails to preview different moments from the video</p>
      </div>
    </div>
  );
};