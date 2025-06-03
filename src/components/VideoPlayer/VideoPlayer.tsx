import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Upload, Settings, Volume2, Maximize2 } from 'lucide-react';

interface VideoPlayerProps {
  onTimeUpdate?: (currentTime: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ onTimeUpdate }) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
      setShowSpeedMenu(false);
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

  const handleTimeUpdateInternal = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.volume = volume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (Number(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: number;
    if (showControls && isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls, isPlaying]);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700 shadow-2xl">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-yellow-400">
        <Play className="w-6 h-6" />
        Enhanced Video Player
      </h2>
      
      {!videoSrc ? (
        <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center bg-gradient-to-b from-slate-800 to-slate-900 hover:border-yellow-500 transition-colors">
          <Upload className="w-16 h-16 mx-auto mb-6 text-slate-400" />
          <p className="text-slate-300 mb-4 text-lg">Drop your game video here or click to upload</p>
          <label className="cursor-pointer">
            <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-6 py-3 rounded-lg inline-block text-black font-bold transition-all transform hover:scale-105 shadow-lg">
              Choose Video File
            </span>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div 
          className="relative group"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(true)}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full rounded-lg shadow-lg bg-black"
            onTimeUpdate={handleTimeUpdateInternal}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={togglePlayPause}
          />
          
          {/* Video Controls Overlay */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 rounded-b-lg transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {/* Progress Bar */}
            <div className="mb-3">
              <input
                type="range"
                min="0"
                max="100"
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer slider hover:h-2 transition-all"
                style={{
                  background: `linear-gradient(to right, #eab308 0%, #eab308 ${duration ? (currentTime / duration) * 100 : 0}%, #374151 ${duration ? (currentTime / duration) * 100 : 0}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-slate-300 mt-1">
                <span className="font-medium">{formatTime(currentTime)}</span>
                <span className="font-medium">{formatTime(duration)}</span>
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Skip Backward */}
                <button
                  onClick={skipBackward}
                  className="bg-slate-800/80 hover:bg-slate-700 p-2 rounded-full transition-all transform hover:scale-110 backdrop-blur-sm"
                  title="Skip 10s backward"
                >
                  <SkipBack className="w-4 h-4 text-white" />
                </button>
                
                {/* Play/Pause */}
                <button
                  onClick={togglePlayPause}
                  className="bg-yellow-500 hover:bg-yellow-600 p-3 rounded-full text-black transition-all transform hover:scale-110 shadow-lg"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                
                {/* Skip Forward */}
                <button
                  onClick={skipForward}
                  className="bg-slate-800/80 hover:bg-slate-700 p-2 rounded-full transition-all transform hover:scale-110 backdrop-blur-sm"
                  title="Skip 10s forward"
                >
                  <SkipForward className="w-4 h-4 text-white" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Volume Control */}
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-white" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                {/* Playback Speed */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium transition-all backdrop-blur-sm flex items-center gap-1"
                    title="Playback speed"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    {playbackRate}x
                  </button>
                  
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-slate-800 rounded-lg shadow-xl border border-slate-600 overflow-hidden">
                      {playbackSpeeds.map(speed => (
                        <button
                          key={speed}
                          onClick={() => changePlaybackSpeed(speed)}
                          className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${
                            speed === playbackRate 
                              ? 'bg-yellow-500 text-black font-semibold' 
                              : 'text-white hover:bg-slate-700'
                          }`}
                        >
                          {speed}x {speed === 1 ? '(Normal)' : speed < 1 ? '(Slow)' : '(Fast)'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="bg-slate-800/80 hover:bg-slate-700 p-1.5 rounded-lg transition-all backdrop-blur-sm"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Current Speed Indicator */}
          {playbackRate !== 1 && (
            <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-yellow-400 text-sm font-bold backdrop-blur-sm">
              {playbackRate}x Speed
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 