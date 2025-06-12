import React from 'react';
import { StorageImage } from '@aws-amplify/ui-react-storage';
import { User } from 'lucide-react';

interface PlayerImageProps {
  profileImageUrl: string | null | undefined;
  className: string;
  alt: string;
}

const PlayerImageComponent: React.FC<PlayerImageProps> = ({ profileImageUrl, className, alt }) => {
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
      validateObjectExistence={false}
      loadingElement={<div className={`${className} animate-pulse bg-zinc-700/50 flex items-center justify-center`}>
        <User className="w-8 h-8 text-zinc-500/50" />
      </div>}
      fallbackSrc="/default-player.png"
      onGetUrlError={(error) => {
        console.error('Image load error:', error);
        console.error('Failed path:', profileImageUrl);
      }}
    />
  );
};

PlayerImageComponent.displayName = 'PlayerImage';

export const PlayerImage = React.memo(PlayerImageComponent);