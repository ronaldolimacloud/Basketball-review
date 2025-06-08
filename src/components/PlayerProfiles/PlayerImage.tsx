import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

interface PlayerImageProps {
  profileImageUrl: string | null | undefined;
  className: string;
  alt: string;
}

export const PlayerImage: React.FC<PlayerImageProps> = ({ profileImageUrl, className, alt }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      try {
        console.log('PlayerImage: Loading image for path:', profileImageUrl);
        const url = await getImageUrl(profileImageUrl);
        console.log('PlayerImage: Got URL:', url);
        
        if (isMounted) {
          setImageUrl(url);
          setLoading(false);
          setError(false);
        }
      } catch (err) {
        console.error('PlayerImage: Error loading image:', err);
        if (isMounted) {
          setImageUrl('/default-player.png');
          setLoading(false);
          setError(true);
        }
      }
    };

    setLoading(true);
    setError(false);
    loadImage();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [profileImageUrl]); // Only re-run if the image path changes

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-zinc-800`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-zinc-800`}>
        <User className="w-10 h-10 text-zinc-500" />
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt}
      className={className}
      onError={() => {
        setImageUrl('/default-player.png');
        setError(true);
      }}
    />
  );
};