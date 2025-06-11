import React from 'react';
import { StorageImage } from '@aws-amplify/ui-react-storage';
import { User } from 'lucide-react';

interface PlayerImageProps {
  profileImageUrl: string | null | undefined;
  className: string;
  alt: string;
}

export const PlayerImage: React.FC<PlayerImageProps> = ({ profileImageUrl, className, alt }) => {
  // If no profile image, show default avatar
  if (!profileImageUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-zinc-800`}>
        <User className="w-10 h-10 text-zinc-500" />
      </div>
    );
  }

  return (
    <StorageImage
      path={profileImageUrl}
      alt={alt}
      className={className}
      bucket="basketballPlayerImages"
      fallbackSrc="/default-player.png"
      onGetUrlError={(error) => {
        console.error('Error loading image from storage:', error);
        console.error('Failed path:', profileImageUrl);
      }}
    />
  );
};