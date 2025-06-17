import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Upload, Settings, Volume2, Maximize2,
  Scissors, Save, X, Eye, Tag, MessageSquare, Clock
} from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

interface VideoClipEditorProps {
  gameId?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onClipCreated?: (clipData: any) => void;
}

interface ClipMarker {
  startTime: number;
  endTime: number;
  title: string;
  description: string;
  visibility: 'team' | 'player' | 'coach';
  assignedPlayerIds: string[];
  tags: string[];
  playType: string;
  priority: 'high' | 'medium' | 'low';
  coachNotes: string;
  learningObjective: string;
}

const client = generateClient<Schema>();

export const VideoClipEditor: React.FC<VideoClipEditorProps> = ({ 
  gameId, 
  onTimeUpdate, 
  onClipCreated 
}) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  
  // Clip creation state
  const [isCreatingClip, setIsCreatingClip] = useState(false);
  const [clipStartTime, setClipStartTime] = useState<number | null>(null);
  const [clipEndTime, setClipEndTime] = useState<number | null>(null);
  const [showClipForm, setShowClipForm] = useState(false);
  const [, setClipMarkers] = useState<ClipMarker[]>([]);
  const [existingClips, setExistingClips] = useState<any[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Load existing clips when gameId changes
  useEffect(() => {
    if (gameId) {
      loadExistingClips();
    }
  }, [gameId]);

  const loadExistingClips = async () => {
    if (!gameId) return;
    
    try {
      const result = await client.models.VideoClip.list({
        filter: { gameId: { eq: gameId } }
      });
      
      if (result.data) {
        setExistingClips(result.data);
      }
    } catch (error) {
      console.error('Error loading existing clips:', error);
    }
  };

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

  // Clip creation functions
  const startClipSelection = () => {
    setClipStartTime(currentTime);
    setIsCreatingClip(true);
  };

  const endClipSelection = () => {
    if (clipStartTime !== null) {
      setClipEndTime(currentTime);
      setIsCreatingClip(false);
      setShowClipForm(true);
    }
  };

  const cancelClipSelection = () => {
    setClipStartTime(null);
    setClipEndTime(null);
    setIsCreatingClip(false);
    setShowClipForm(false);
  };

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const saveClip = async (clipData: ClipMarker) => {
    if (!gameId || clipStartTime === null || clipEndTime === null) return;

    setSaving(true);
    setSaveStatus('saving');

    try {
      console.log('🎬 Creating video clip:', {
        gameId,
        title: clipData.title,
        startTime: clipStartTime,
        endTime: clipEndTime,
        duration: clipEndTime - clipStartTime
      });

      const newClip = await client.models.VideoClip.create({
        gameId,
        title: clipData.title,
        description: clipData.description,
        startTime: clipStartTime,
        endTime: clipEndTime,
        visibility: clipData.visibility,
        assignedPlayerIds: JSON.stringify(clipData.assignedPlayerIds),
        tags: JSON.stringify(clipData.tags),
        playType: clipData.playType,
        priority: clipData.priority,
        coachNotes: clipData.coachNotes,
        learningObjective: clipData.learningObjective,
        isProcessed: false
      });

      if (newClip.data) {
        console.log('✅ Video clip created successfully:', newClip.data);
        setClipMarkers(prev => [...prev, clipData]);
        setExistingClips(prev => [...prev, newClip.data]);
        onClipCreated?.(newClip.data);
        setSaveStatus('success');
        
        // Show success message for 2 seconds then close
        setTimeout(() => {
          setShowClipForm(false);
          setClipStartTime(null);
          setClipEndTime(null);
          setSaveStatus('idle');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error creating clip:', error);
      setSaveStatus('error');
      // Reset error status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: number;
    if (showControls && isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls, isPlaying]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in a form field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            // Frame-by-frame backward (0.1 seconds)
            if (videoRef.current) {
              videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 0.1);
            }
          } else {
            skipBackward();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            // Frame-by-frame forward (0.1 seconds)
            if (videoRef.current) {
              videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 0.1);
            }
          } else {
            skipForward();
          }
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          if (!isCreatingClip) {
            startClipSelection();
          }
          break;
        case 'o':
        case 'O':
          e.preventDefault();
          if (isCreatingClip && clipStartTime !== null) {
            endClipSelection();
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (isCreatingClip) {
            cancelClipSelection();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isCreatingClip, clipStartTime, duration]);

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg p-6 border border-zinc-700 shadow-2xl">
      {!videoSrc ? (
        <div className="border-2 border-dashed border-zinc-600 rounded-xl p-12 text-center bg-gradient-to-b from-zinc-800 to-zinc-900 hover:border-yellow-500 transition-colors">
          <Upload className="w-16 h-16 mx-auto mb-6 text-zinc-400" />
          <p className="text-zinc-300 mb-4 text-lg">Drop your game video here or click to upload</p>
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
        <div>
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
            
            {/* Clip Selection Overlay */}
            {isCreatingClip && clipStartTime !== null && (
              <div className="absolute top-4 left-4 bg-red-500/90 px-3 py-2 rounded-lg text-white font-medium backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Creating Clip: {formatTime(clipStartTime)} - {formatTime(currentTime)}
                </div>
              </div>
            )}

            {/* Video Controls Overlay */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 rounded-b-lg transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {/* Enhanced Progress Bar with Clip Markers */}
              <div className="mb-3">
                <div className="relative">
                  {/* Background timeline */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={duration ? (currentTime / duration) * 100 : 0}
                    onChange={handleSeek}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider hover:h-3 transition-all"
                    style={{
                      background: `linear-gradient(to right, #eab308 0%, #eab308 ${duration ? (currentTime / duration) * 100 : 0}%, #374151 ${duration ? (currentTime / duration) * 100 : 0}%, #374151 100%)`
                    }}
                  />
                  
                  {/* Existing clip markers */}
                  {duration > 0 && existingClips.map((clip, index) => {
                    const startPercent = (clip.startTime / duration) * 100;
                    const endPercent = (clip.endTime / duration) * 100;
                    const width = endPercent - startPercent;
                    
                    return (
                      <div
                        key={clip.id || index}
                        className="absolute top-0 h-2 bg-emerald-500/60 rounded-sm pointer-events-none border border-emerald-400/40"
                        style={{
                          left: `${startPercent}%`,
                          width: `${width}%`
                        }}
                        title={clip.title || 'Existing clip'}
                      />
                    );
                  })}
                  
                  {/* Current clip selection overlay */}
                  {clipStartTime !== null && duration > 0 && (
                    <div
                      className="absolute top-0 h-2 bg-red-500/80 rounded-sm pointer-events-none border border-red-400"
                      style={{
                        left: `${(clipStartTime / duration) * 100}%`,
                        width: `${clipEndTime ? ((clipEndTime - clipStartTime) / duration) * 100 : ((currentTime - clipStartTime) / duration) * 100}%`
                      }}
                    />
                  )}
                  
                  {/* Time markers */}
                  {clipStartTime !== null && (
                    <div
                      className="absolute top-3 transform -translate-x-1/2 text-xs text-red-400 font-medium"
                      style={{ left: `${(clipStartTime / duration) * 100}%` }}
                    >
                      ▼
                    </div>
                  )}
                  
                  {clipEndTime !== null && (
                    <div
                      className="absolute top-3 transform -translate-x-1/2 text-xs text-red-400 font-medium"
                      style={{ left: `${(clipEndTime / duration) * 100}%` }}
                    >
                      ▼
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between text-xs text-zinc-300 mt-2">
                  <span className="font-medium">{formatTime(currentTime)}</span>
                  {clipStartTime !== null && (
                    <span className="text-red-400 font-medium">
                      Clip: {formatTime(clipStartTime)} - {formatTime(clipEndTime || currentTime)}
                    </span>
                  )}
                  <span className="font-medium">{formatTime(duration)}</span>
                </div>
                
                {/* Clip markers legend */}
                {existingClips.length > 0 && (
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-1.5 bg-emerald-500/60 rounded-sm border border-emerald-400/40"></div>
                      <span className="text-zinc-400">Existing clips ({existingClips.length})</span>
                    </div>
                    {clipStartTime !== null && (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-1.5 bg-red-500/80 rounded-sm border border-red-400"></div>
                        <span className="text-zinc-400">New clip</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Skip Backward */}
                  <button
                    onClick={skipBackward}
                    className="bg-zinc-800/80 hover:bg-zinc-700 p-2 rounded-full transition-all transform hover:scale-110 backdrop-blur-sm"
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
                    className="bg-zinc-800/80 hover:bg-zinc-700 p-2 rounded-full transition-all transform hover:scale-110 backdrop-blur-sm"
                    title="Skip 10s forward"
                  >
                    <SkipForward className="w-4 h-4 text-white" />
                  </button>

                  {/* Clip Controls */}
                  <div className="flex items-center gap-2 ml-4 border-l border-zinc-600 pl-4">
                    {!isCreatingClip ? (
                      <button
                        onClick={startClipSelection}
                        className="bg-red-600 hover:bg-red-700 p-2 rounded-full transition-all transform hover:scale-110 backdrop-blur-sm"
                        title="Start creating clip"
                      >
                        <Scissors className="w-4 h-4 text-white" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={endClipSelection}
                          className="bg-emerald-600 hover:bg-emerald-700 p-2 rounded-full transition-all transform hover:scale-110 backdrop-blur-sm"
                          title="End clip selection"
                        >
                          <Save className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={cancelClipSelection}
                          className="bg-zinc-600 hover:bg-zinc-700 p-2 rounded-full transition-all transform hover:scale-110 backdrop-blur-sm"
                          title="Cancel clip selection"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </>
                    )}
                  </div>
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
                      className="w-16 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  {/* Playback Speed */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="bg-zinc-800/80 hover:bg-zinc-700 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium transition-all backdrop-blur-sm flex items-center gap-1"
                      title="Playback speed"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      {playbackRate}x
                    </button>
                    
                    {showSpeedMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-zinc-800 rounded-lg shadow-xl border border-zinc-600 overflow-hidden">
                        {playbackSpeeds.map(speed => (
                          <button
                            key={speed}
                            onClick={() => changePlaybackSpeed(speed)}
                            className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${
                              speed === playbackRate 
                                ? 'bg-yellow-500 text-black font-semibold' 
                                : 'text-white hover:bg-zinc-700'
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
                    className="bg-zinc-800/80 hover:bg-zinc-700 p-1.5 rounded-lg transition-all backdrop-blur-sm"
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

          {/* Keyboard Shortcuts Guide */}
          <div className="mt-4 bg-zinc-800/30 rounded-lg p-4 border border-zinc-600">
            <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              ⌨️ Keyboard Shortcuts
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-zinc-700 rounded text-zinc-300">Space</kbd>
                <span>Play/Pause</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-zinc-700 rounded text-zinc-300">I</kbd>
                <span>Mark In (Start clip)</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-zinc-700 rounded text-zinc-300">O</kbd>
                <span>Mark Out (End clip)</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-zinc-700 rounded text-zinc-300">Esc</kbd>
                <span>Cancel clip</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-zinc-700 rounded text-zinc-300">←/→</kbd>
                <span>Skip 10s</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-zinc-700 rounded text-zinc-300">Shift+←/→</kbd>
                <span>Frame by frame</span>
              </div>
            </div>
          </div>

          {/* Enhanced Clip Creation Form */}
          {showClipForm && clipStartTime !== null && clipEndTime !== null && (
            <ClipCreationForm
              startTime={clipStartTime}
              endTime={clipEndTime}
              onSave={saveClip}
              onCancel={cancelClipSelection}
              saving={saving}
              saveStatus={saveStatus}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Enhanced Clip Creation Form Component
interface ClipCreationFormProps {
  startTime: number;
  endTime: number;
  onSave: (clipData: ClipMarker) => void;
  onCancel: () => void;
  saving?: boolean;
  saveStatus?: 'idle' | 'saving' | 'success' | 'error';
}

const ClipCreationForm: React.FC<ClipCreationFormProps> = ({
  startTime,
  endTime,
  onSave,
  onCancel,
  saving = false,
  saveStatus = 'idle'
}) => {
  const [formData, setFormData] = useState<ClipMarker>({
    startTime,
    endTime,
    title: '',
    description: '',
    visibility: 'team',
    assignedPlayerIds: [],
    tags: [],
    playType: '',
    priority: 'medium',
    coachNotes: '',
    learningObjective: ''
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSave(formData);
    }
  };

  return (
    <div className="mt-6 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl p-6 border border-zinc-600 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-yellow-400 flex items-center gap-2 mb-2">
            <Scissors className="w-6 h-6" />
            Create Video Clip
          </h3>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Clock className="w-4 h-4" />
            <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
            <span className="text-zinc-600">•</span>
            <span>{formatTime(endTime - startTime)} duration</span>
          </div>
        </div>
        <button
          onClick={onCancel}
          disabled={saving}
          className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-700 rounded-lg disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Status Messages */}
      {saveStatus === 'saving' && (
        <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-sm font-medium">Saving video clip...</span>
          </div>
        </div>
      )}

      {saveStatus === 'success' && (
        <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-400">
            <div className="w-4 h-4 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium">✅ Video clip saved successfully!</span>
          </div>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-400">
            <div className="w-4 h-4 bg-red-400 rounded-full"></div>
            <span className="text-sm font-medium">❌ Failed to save video clip. Please try again.</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Clip Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
              placeholder="e.g., Fast Break Opportunity"
              required
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Eye className="w-4 h-4 inline mr-1" />
              Visibility
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData({...formData, visibility: e.target.value as 'team' | 'player' | 'coach'})}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
            >
              <option value="team">Team (everyone can see)</option>
              <option value="player">Specific Players</option>
              <option value="coach">Coach Only</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
            rows={3}
            placeholder="What happens in this clip?"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Play Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Play Type
            </label>
            <input
              type="text"
              value={formData.playType}
              onChange={(e) => setFormData({...formData, playType: e.target.value})}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
              placeholder="e.g., offense, defense"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value as 'high' | 'medium' | 'low'})}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
              className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
              placeholder="e.g., defense, steal, transition"
            />
          </div>
        </div>

        {/* Coach Notes */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Coach Notes
          </label>
          <textarea
            value={formData.coachNotes}
            onChange={(e) => setFormData({...formData, coachNotes: e.target.value})}
            className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
            rows={2}
            placeholder="Notes for coaching staff..."
          />
        </div>

        {/* Learning Objective */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Learning Objective
          </label>
          <input
            type="text"
            value={formData.learningObjective}
            onChange={(e) => setFormData({...formData, learningObjective: e.target.value})}
            className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
            placeholder="What should players learn from this clip?"
          />
        </div>

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-lg transition-colors text-zinc-300 font-medium"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={saving || !formData.title.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-zinc-600 disabled:to-zinc-700 rounded-lg transition-all text-white font-medium flex items-center justify-center gap-2 transform hover:scale-105 shadow-lg disabled:transform-none disabled:shadow-none"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Clip
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};