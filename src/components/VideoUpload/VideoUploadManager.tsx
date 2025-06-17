import React, { useState, useCallback } from 'react';
import { Upload, CheckCircle, AlertCircle, Clock, Monitor } from 'lucide-react';
import { VideoPlayer, ThumbnailPreview } from '../VideoPlayer';
import { useVideoProcessing } from '../../hooks/useVideoProcessing';

interface VideoUploadManagerProps {
  gameId: string;
  onVideoUploaded?: (result: any) => void;
  className?: string;
}

export const VideoUploadManager: React.FC<VideoUploadManagerProps> = ({
  gameId,
  onVideoUploaded,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const {
    isUploading,
    uploadProgress,
    uploadError,
    processingStatus,
    videoSources,
    thumbnails,
    uploadVideo,
    refreshVideoData
  } = useVideoProcessing();

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    console.log(`🎬 Uploading ${file.name} for game ${gameId}`);
    
    const result = await uploadVideo(gameId, file);
    if (result && onVideoUploaded) {
      onVideoUploaded(result);
    }
  }, [gameId, uploadVideo, onVideoUploaded]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Refresh video data manually
  const handleRefresh = () => {
    refreshVideoData(gameId);
  };

  // Get status display configuration
  const getStatusConfig = () => {
    if (isUploading) {
      return {
        icon: Upload,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        text: `Uploading... ${uploadProgress}%`
      };
    }

    switch (processingStatus) {
      case 'PENDING':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          text: 'Video queued for processing'
        };
      case 'PROCESSING':
        return {
          icon: Monitor,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          text: 'Processing video...'
        };
      case 'COMPLETED':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          text: 'Video processing completed'
        };
      case 'FAILED':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          text: 'Video processing failed'
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Status */}
      {statusConfig && (
        <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-lg p-4`}>
          <div className="flex items-center gap-3">
            <statusConfig.icon className={`w-5 h-5 ${statusConfig.color}`} />
            <span className={`font-medium ${statusConfig.color}`}>
              {statusConfig.text}
            </span>
            {isUploading && (
              <div className="flex-1 bg-zinc-700 rounded-full h-2 ml-4">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
          
          {processingStatus === 'PROCESSING' && (
            <div className="mt-2 text-sm text-zinc-400">
              This may take several minutes depending on video length and quality
            </div>
          )}
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="font-medium text-red-500">Upload Failed</span>
          </div>
          <p className="text-sm text-red-400 mt-1">{uploadError}</p>
        </div>
      )}

      {/* Video Player */}
      {videoSources && Object.keys(videoSources).length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Game Video</h3>
            <button
              onClick={handleRefresh}
              className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm text-zinc-300 transition-colors"
              disabled={isUploading}
            >
              Refresh
            </button>
          </div>
          
          <VideoPlayer
            videoSources={videoSources}
            thumbnails={thumbnails || undefined}
            processingStatus={processingStatus || undefined}
            onTimeUpdate={(time) => console.log('Video time:', time)}
          />
          
          {/* Thumbnails */}
          {thumbnails && thumbnails.length > 0 && (
            <ThumbnailPreview
              thumbnails={thumbnails}
              onThumbnailClick={(index) => console.log('Thumbnail clicked:', index)}
            />
          )}
        </div>
      ) : (
        /* Upload Area */
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            isDragOver
              ? 'border-yellow-500 bg-yellow-500/5'
              : 'border-zinc-600 hover:border-zinc-500'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-16 h-16 mx-auto mb-6 text-zinc-400" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Upload Game Video
          </h3>
          <p className="text-zinc-400 mb-6">
            Drag and drop your video file here, or click to browse
          </p>
          
          <label className="cursor-pointer">
            <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-6 py-3 rounded-lg inline-block text-black font-bold transition-all transform hover:scale-105 shadow-lg">
              Choose Video File
            </span>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading}
            />
          </label>
          
          <div className="mt-6 text-sm text-zinc-500">
            <p>Supported formats: MP4, MOV, AVI, MKV</p>
            <p>Maximum file size: 5GB</p>
          </div>
        </div>
      )}

      {/* Processing Info */}
      {processingStatus && (
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <h4 className="text-sm font-medium text-zinc-300 mb-2">
            Video Processing Pipeline
          </h4>
          <div className="space-y-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                processingStatus === 'PENDING' ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              <span>Upload to cloud storage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                processingStatus === 'PROCESSING' ? 'bg-blue-500 animate-pulse' : 
                processingStatus === 'COMPLETED' ? 'bg-green-500' : 'bg-zinc-600'
              }`} />
              <span>Process multiple quality versions (720p, 1080p)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                processingStatus === 'PROCESSING' ? 'bg-blue-500 animate-pulse' : 
                processingStatus === 'COMPLETED' ? 'bg-green-500' : 'bg-zinc-600'
              }`} />
              <span>Generate video thumbnails</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                processingStatus === 'COMPLETED' ? 'bg-green-500' : 'bg-zinc-600'
              }`} />
              <span>Optimize for global delivery</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};