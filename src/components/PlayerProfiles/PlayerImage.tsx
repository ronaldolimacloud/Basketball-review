import React, { useState } from 'react';
import { User } from 'lucide-react';
import { api } from '../../services/api';

interface PlayerImageProps {
  profileImageUrl: string | null | undefined;
  className: string;
  alt: string;
}

const PlayerImageComponent: React.FC<PlayerImageProps> = ({ profileImageUrl, className, alt }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Convert mock URLs to actual data URLs
  const imageUrl = api.getMockImageUrl(profileImageUrl);

  // If no profile image, show default avatar
  if (!imageUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-zinc-800`}>
        <User className="w-1/3 h-1/3 text-zinc-500" />
      </div>
    );
  }

  // Handle image load error
  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-zinc-800`}>
        <User className="w-1/3 h-1/3 text-zinc-500" />
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {isLoading && (
        <div className={`${className} absolute inset-0 animate-pulse bg-zinc-700/50 flex items-center justify-center`}>
          <User className="w-1/4 h-1/4 text-zinc-500/50" />
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};

PlayerImageComponent.displayName = 'PlayerImage';

export const PlayerImage = PlayerImageComponent;