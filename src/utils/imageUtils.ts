import { getUrl } from 'aws-amplify/storage';

/**
 * Gets a signed URL for an image with cache busting
 * @param imagePath Path to the image in storage
 * @returns Promise with the signed URL
 */
export const getImageUrl = async (imagePath: string | null | undefined): Promise<string> => {
  if (!imagePath) {
    console.log('No image path provided, using default');
    return '/default-player.png';
  }
  
  try {
    console.log('Getting URL for path:', imagePath);
    
    const urlResult = await getUrl({
      path: imagePath,
      options: {
        validateObjectExistence: true,
        expiresIn: 3600 // 1 hour expiration
      }
    });
    
    console.log('Successfully got URL for:', imagePath);
    
    // Add cache busting parameter
    const url = new URL(urlResult.url.toString());
    url.searchParams.append('t', Date.now().toString());
    
    return url.toString();
  } catch (error) {
    console.error('Error getting image URL for path:', imagePath, error);
    
    // If the file doesn't exist, try to get URL without validation
    try {
      console.log('Retrying without validation for:', imagePath);
      const fallbackResult = await getUrl({
        path: imagePath,
        options: {
          expiresIn: 3600
        }
      });
      
      const url = new URL(fallbackResult.url.toString());
      url.searchParams.append('t', Date.now().toString());
      
      return url.toString();
    } catch (fallbackError) {
      console.error('Fallback URL generation also failed:', fallbackError);
      return '/default-player.png';
    }
  }
};