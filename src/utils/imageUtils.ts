/**
 * Image utility functions for resizing and optimizing images before upload
 */

export interface ImageResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Resize an image file to specified dimensions while maintaining aspect ratio
 * @param file - The original image file
 * @param options - Resize options
 * @returns Promise<File> - The resized image file
 */
export const resizeImage = async (
  file: File,
  options: ImageResizeOptions = {}
): Promise<File> => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    // Create image element
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and resize image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }

          // Create new file with same name but potentially different extension
          const fileExtension = format.split('/')[1];
          const originalName = file.name.split('.')[0];
          const newFileName = `${originalName}_resized.${fileExtension}`;

          const resizedFile = new File([blob], newFileName, {
            type: format,
            lastModified: Date.now(),
          });

          resolve(resizedFile);
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get image dimensions from a file
 * @param file - The image file
 * @returns Promise with width and height
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Format file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate if file is an image and within size limits
 * @param file - File to validate
 * @param maxSizeInMB - Maximum file size in MB
 * @returns Validation result
 */
export const validateImageFile = (file: File, maxSizeInMB: number = 10) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPEG, PNG, WebP, or GIF)'
    };
  }

  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeInMB}MB. Current size: ${formatFileSize(file.size)}`
    };
  }

  return { isValid: true };
};

/**
 * Profile image specific resizing with optimized settings
 * @param file - Original image file
 * @returns Promise<File> - Optimized profile image
 */
export const resizeProfileImage = async (file: File): Promise<File> => {
  // Profile images: square, high quality, but reasonable size
  return resizeImage(file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.85,
    format: 'image/jpeg'
  });
};