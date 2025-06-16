import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Maximize2, 
  X,
  Clock,
  Tag,
  Users,
  User,
  Shield,
  MessageSquare,
  Target,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ClipViewerProps {
  clip: any;
  videoSrc: string;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export const ClipViewer: React.FC<ClipViewerProps> = ({
  clip,
  videoSrc,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Set video to clip start time when loaded
  useEffect(() => {
    if (videoRef.current && clip) {
      videoRef.current.currentTime = clip.startTime;
      setCurrentTime(clip.startTime);
    }
  }, [clip, videoSrc]);

  // Monitor playback to stop at clip end
  useEffect(() => {
    if (videoRef.current && currentTime >= clip.endTime && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [currentTime, clip.endTime, isPlaying]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // If at or past end time, restart from beginning
        if (currentTime >= clip.endTime) {
          videoRef.current.currentTime = clip.startTime;
        }
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      const newTime = Math.max(clip.startTime, videoRef.current.currentTime - 5);
      videoRef.current.currentTime = newTime;
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      const newTime = Math.min(clip.endTime, videoRef.current.currentTime + 5);
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.volume = volume;
      videoRef.current.currentTime = clip.startTime;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clipDuration = clip.endTime - clip.startTime;
    const newTime = clip.startTime + (Number(e.target.value) / 100) * clipDuration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getClipProgress = () => {
    if (!clip) return 0;
    const clipDuration = clip.endTime - clip.startTime;
    const clipCurrentTime = Math.max(0, currentTime - clip.startTime);
    return Math.min(100, (clipCurrentTime / clipDuration) * 100);
  };

  const visibilityIcons: Record<string, any> = {
    team: Users,
    player: User,
    coach: Shield
  };

  const priorityColors: Record<string, string> = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-green-400'
  };

  const VisibilityIcon = visibilityIcons[clip.visibility];

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: number;
    if (showControls && isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls, isPlaying]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <VisibilityIcon className="w-4 h-4 text-zinc-400" />
                <span className="text-sm text-zinc-400 capitalize">{clip.visibility}</span>
              </div>
              
              <div className="w-px h-4 bg-zinc-600"></div>
              
              <div className="flex items-center gap-2">
                <Star className={`w-4 h-4 ${priorityColors[clip.priority]}`} />
                <span className={`text-sm capitalize ${priorityColors[clip.priority]}`}>
                  {clip.priority} Priority
                </span>
              </div>
              
              {clip.playType && (
                <>
                  <div className="w-px h-4 bg-zinc-600"></div>
                  <span className="text-sm text-zinc-400">{clip.playType}</span>
                </>
              )}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {hasPrevious && (
              <button
                onClick={onPrevious}
                className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                title="Previous clip"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            )}
            
            {hasNext && (
              <button
                onClick={onNext}
                className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                title="Next clip"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Clip title and info */}
        <div className="mt-3">
          <h1 className="text-xl font-semibold text-white mb-1">{clip.title}</h1>
          {clip.description && (
            <p className="text-zinc-400 text-sm">{clip.description}</p>
          )}
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 relative">
        <div 
          className="h-full group"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(true)}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-contain bg-black"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={togglePlayPause}
          />
          
          {/* Clip boundaries indicator */}
          <div className="absolute top-4 left-4 bg-black/80 px-3 py-2 rounded-lg text-white text-sm backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
              <span className="text-zinc-400">
                ({formatTime(clip.endTime - clip.startTime)} duration)
              </span>
            </div>
          </div>

          {/* Video Controls Overlay */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max="100"
                value={getClipProgress()}
                onChange={handleSeek}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #eab308 0%, #eab308 ${getClipProgress()}%, #374151 ${getClipProgress()}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-zinc-300 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(clip.endTime)}</span>
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Skip Backward */}
                <button
                  onClick={skipBackward}
                  className="bg-zinc-800/80 hover:bg-zinc-700 p-2 rounded-full transition-all backdrop-blur-sm"
                  title="Skip 5s backward"
                >
                  <SkipBack className="w-5 h-5 text-white" />
                </button>
                
                {/* Play/Pause */}
                <button
                  onClick={togglePlayPause}
                  className="bg-yellow-500 hover:bg-yellow-600 p-4 rounded-full text-black transition-all transform hover:scale-110 shadow-lg"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>
                
                {/* Skip Forward */}
                <button
                  onClick={skipForward}
                  className="bg-zinc-800/80 hover:bg-zinc-700 p-2 rounded-full transition-all backdrop-blur-sm"
                  title="Skip 5s forward"
                >
                  <SkipForward className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-white" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="bg-zinc-800/80 hover:bg-zinc-700 p-2 rounded-lg transition-all backdrop-blur-sm"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clip Details Sidebar */}
      <div className="bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tags */}
          {clip.tags && Array.isArray(JSON.parse(clip.tags)) && JSON.parse(clip.tags).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Tags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {JSON.parse(clip.tags).map((tag: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-zinc-700 text-xs rounded-full text-zinc-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Coach Notes */}
          {clip.coachNotes && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Coach Notes</span>
              </div>
              <p className="text-sm text-zinc-400">{clip.coachNotes}</p>
            </div>
          )}

          {/* Learning Objective */}
          {clip.learningObjective && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Learning Objective</span>
              </div>
              <p className="text-sm text-zinc-400">{clip.learningObjective}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};