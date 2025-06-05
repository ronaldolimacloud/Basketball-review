import React, { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';
import { User } from 'lucide-react';

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
      if (!profileImageUrl) {
        if (isMounted) {
          setImageUrl('/default-player.png');
          setLoading(false);
        }
        return;
      }

      try {
        const urlResult = await getUrl({
          path: profileImageUrl,
          options: {
            // Use caching to prevent unnecessary reloads
            cacheControl: 'max-age=3600', // Cache for 1 hour
            validateObjectExistence: true
          }
        });
        
        if (isMounted) {
          setImageUrl(urlResult.url.toString());
          setLoading(false);
          setError(false);
        }
      } catch (err) {
        console.error('Error loading image:', err);
        if (isMounted) {
          setImageUrl('/default-player.png');
          setLoading(false);
          setError(true);
        }
      }
    };

    setLoading(true);
    loadImage();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [profileImageUrl]); // Only re-run if the image path changes

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-800`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-800`}>
        <User className="w-10 h-10 text-slate-500" />
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