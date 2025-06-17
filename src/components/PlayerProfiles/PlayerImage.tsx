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
        <User className="w-1/3 h-1/3 text-zinc-500" />
      </div>
    );
  }

  // The path prop can be a simple string.
  // For protected paths, the StorageImage component will automatically handle
  // using the currently signed-in user's credentials to fetch the URL.
  // There is no need to manipulate the path.
  return (
    <StorageImage
      path={profileImageUrl} // <-- Just pass the full path directly!
      alt={alt}
      className={`${className} object-cover`}
      validateObjectExistence={true}
      loadingElement={
        <div className={`${className} animate-pulse bg-zinc-700/50 flex items-center justify-center`}>
          <User className="w-1/4 h-1/4 text-zinc-500/50" />
        </div>
      }
      fallbackSrc="/default-player.png"
      onGetUrlError={(error) => {
        // This error handling is still great to have!
        console.error(`❌ StorageImage error for path: ${profileImageUrl}`);
        console.error('❌ Error details:', error);
      }}
    />
  );
};

PlayerImageComponent.displayName = 'PlayerImage';

export const PlayerImage = React.memo(PlayerImageComponent);