import { uploadData, getUrl } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface VideoUploadResult {
  gameId: string;
  videoUrl: string;
  videoFileName: string;
}

export interface ProcessedVideoData {
  originalUrl?: string;
  processedUrls?: {
    '1080p'?: string;
    '720p'?: string;
  };
  thumbnailUrls?: string[];
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

/**
 * Upload a video file to S3 and update the game record
 */
export async function uploadGameVideo(
  gameId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<VideoUploadResult> {
  try {
    console.log(`🎬 Uploading video for game ${gameId}:`, file.name);

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${gameId}_${timestamp}.${fileExtension}`;
    const s3Key = `protected/game-videos/${gameId}/${fileName}`;

    // Upload to S3 with progress tracking
    const uploadResult = await uploadData({
      key: s3Key,
      data: file,
      options: {
        onProgress: ({ transferredBytes, totalBytes }) => {
          if (totalBytes && onProgress) {
            const progress = Math.round((transferredBytes / totalBytes) * 100);
            onProgress(progress);
          }
        },
      },
    }).result;

    console.log('✅ Video uploaded to S3:', uploadResult.key);

    // Get the signed URL for immediate playback
    const videoUrl = await getUrl({ key: s3Key });

    // Update game record with video information
    await client.models.Game.update({
      id: gameId,
      videoFileName: fileName,
      videoUrl: videoUrl.url.toString(),
      videoProcessingStatus: 'PENDING'
    });

    console.log('✅ Game record updated with video info');

    return {
      gameId,
      videoUrl: videoUrl.url.toString(),
      videoFileName: fileName
    };

  } catch (error) {
    console.error('❌ Error uploading video:', error);
    throw new Error(`Failed to upload video: ${error}`);
  }
}

/**
 * Get processed video data for a game
 */
export async function getProcessedVideoData(gameId: string): Promise<ProcessedVideoData | null> {
  try {
    const game = await client.models.Game.get({ id: gameId });
    
    if (!game.data) {
      return null;
    }

    const processedUrls: { [key: string]: string } = {};
    const thumbnailUrls: string[] = [];

    // Parse processed video URLs
    if (game.data.processedVideoUrls) {
      const urlData = typeof game.data.processedVideoUrls === 'string' 
        ? JSON.parse(game.data.processedVideoUrls)
        : game.data.processedVideoUrls;
      
      // Convert S3 URLs to signed URLs for secure access
      for (const [quality, s3Url] of Object.entries(urlData)) {
        if (typeof s3Url === 'string') {
          try {
            // Extract S3 key from URL
            const s3Key = s3Url.replace(/^https:\/\/s3\.amazonaws\.com\/[^\/]+\//, '');
            const signedUrl = await getUrl({ key: s3Key });
            processedUrls[quality] = signedUrl.url.toString();
          } catch (error) {
            console.warn(`Failed to get signed URL for ${quality}:`, error);
          }
        }
      }
    }

    // Parse thumbnail URLs
    if (game.data.thumbnailUrls) {
      const thumbData = typeof game.data.thumbnailUrls === 'string'
        ? JSON.parse(game.data.thumbnailUrls)
        : game.data.thumbnailUrls;
      
      if (Array.isArray(thumbData)) {
        for (const thumbUrl of thumbData) {
          try {
            // Extract S3 key from URL
            const s3Key = thumbUrl.replace(/^https:\/\/s3\.amazonaws\.com\/[^\/]+\//, '');
            const signedUrl = await getUrl({ key: s3Key });
            thumbnailUrls.push(signedUrl.url.toString());
          } catch (error) {
            console.warn('Failed to get signed URL for thumbnail:', error);
          }
        }
      }
    }

    // Get original video URL
    let originalUrl: string | undefined;
    if (game.data.videoUrl) {
      try {
        // If it's already a signed URL, use it; otherwise generate one
        if (game.data.videoUrl.includes('amazonaws.com')) {
          originalUrl = game.data.videoUrl;
        } else {
          // Generate signed URL for original video
          const s3Key = `protected/game-videos/${gameId}/${game.data.videoFileName}`;
          const signedUrl = await getUrl({ key: s3Key });
          originalUrl = signedUrl.url.toString();
        }
      } catch (error) {
        console.warn('Failed to get signed URL for original video:', error);
      }
    }

    return {
      originalUrl,
      processedUrls: processedUrls as { '1080p'?: string; '720p'?: string },
      thumbnailUrls,
      processingStatus: game.data.videoProcessingStatus || 'PENDING'
    };

  } catch (error) {
    console.error('❌ Error getting processed video data:', error);
    return null;
  }
}

/**
 * Check processing status for a game
 */
export async function checkProcessingStatus(gameId: string): Promise<string> {
  try {
    const game = await client.models.Game.get({ id: gameId });
    return game.data?.videoProcessingStatus || 'PENDING';
  } catch (error) {
    console.error('❌ Error checking processing status:', error);
    return 'FAILED';
  }
}

/**
 * Get video sources in the format expected by VideoPlayer component
 */
export async function getVideoSources(gameId: string): Promise<{
  videoSources?: { original?: string; '1080p'?: string; '720p'?: string };
  thumbnails?: string[];
  processingStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}> {
  const processedData = await getProcessedVideoData(gameId);
  
  if (!processedData) {
    return {};
  }

  return {
    videoSources: {
      original: processedData.originalUrl,
      '1080p': processedData.processedUrls?.['1080p'],
      '720p': processedData.processedUrls?.['720p'],
    },
    thumbnails: processedData.thumbnailUrls,
    processingStatus: processedData.processingStatus,
  };
}