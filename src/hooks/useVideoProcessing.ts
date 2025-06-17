import { useState, useEffect } from 'react';
import { 
  uploadGameVideo, 
  getVideoSources, 
  checkProcessingStatus,
  type VideoUploadResult 
} from '../services/videoService';

interface UseVideoProcessingReturn {
  // Upload state
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  
  // Processing state
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null;
  
  // Video data
  videoSources: {
    original?: string;
    '1080p'?: string;
    '720p'?: string;
  } | null;
  thumbnails: string[] | null;
  
  // Actions
  uploadVideo: (gameId: string, file: File) => Promise<VideoUploadResult | null>;
  refreshVideoData: (gameId: string) => Promise<void>;
  startPolling: (gameId: string) => void;
  stopPolling: () => void;
}

export function useVideoProcessing(): UseVideoProcessingReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null>(null);
  const [videoSources, setVideoSources] = useState<{
    original?: string;
    '1080p'?: string;
    '720p'?: string;
  } | null>(null);
  const [thumbnails, setThumbnails] = useState<string[] | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const uploadVideo = async (gameId: string, file: File): Promise<VideoUploadResult | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      console.log(`🎬 Starting video upload for game ${gameId}`);

      const result = await uploadGameVideo(gameId, file, (progress) => {
        setUploadProgress(progress);
      });

      console.log('✅ Video upload completed:', result);
      
      // Start polling for processing status
      startPolling(gameId);
      
      return result;
    } catch (error) {
      console.error('❌ Video upload failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const refreshVideoData = async (gameId: string): Promise<void> => {
    try {
      console.log(`🔄 Refreshing video data for game ${gameId}`);
      const data = await getVideoSources(gameId);
      
      setVideoSources(data.videoSources || null);
      setThumbnails(data.thumbnails || null);
      setProcessingStatus(data.processingStatus || null);

      console.log('✅ Video data refreshed:', data);
    } catch (error) {
      console.error('❌ Failed to refresh video data:', error);
    }
  };

  const pollProcessingStatus = async (gameId: string): Promise<void> => {
    try {
      const status = await checkProcessingStatus(gameId);
      setProcessingStatus(status as any);

      console.log(`📊 Processing status for game ${gameId}: ${status}`);

      // If processing is complete, refresh video data and stop polling
      if (status === 'COMPLETED') {
        await refreshVideoData(gameId);
        stopPolling();
      } else if (status === 'FAILED') {
        console.error('❌ Video processing failed');
        stopPolling();
      }
    } catch (error) {
      console.error('❌ Failed to check processing status:', error);
    }
  };

  const startPolling = (gameId: string): void => {
    // Clear any existing polling
    stopPolling();

    console.log(`⏰ Starting polling for game ${gameId}`);

    // Poll every 10 seconds
    const interval = setInterval(() => {
      pollProcessingStatus(gameId);
    }, 10000);

    setPollingInterval(interval);

    // Also check immediately
    pollProcessingStatus(gameId);
  };

  const stopPolling = (): void => {
    if (pollingInterval) {
      console.log('⏹️ Stopping processing status polling');
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    // Upload state
    isUploading,
    uploadProgress,
    uploadError,
    
    // Processing state
    processingStatus,
    
    // Video data
    videoSources,
    thumbnails,
    
    // Actions
    uploadVideo,
    refreshVideoData,
    startPolling,
    stopPolling,
  };
}