import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Upload, Settings, Volume2, Maximize2,
  Scissors, Save, X, Eye, Tag, MessageSquare
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

  const saveClip = async (clipData: ClipMarker) => {
    if (!gameId || clipStartTime === null || clipEndTime === null) return;

    try {
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
        setClipMarkers(prev => [...prev, clipData]);
        onClipCreated?.(newClip.data);
        setShowClipForm(false);
        setClipStartTime(null);
        setClipEndTime(null);
      }
    } catch (error) {
      console.error('Error creating clip:', error);
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
              {/* Progress Bar */}
              <div className="mb-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={duration ? (currentTime / duration) * 100 : 0}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider hover:h-2 transition-all"
                  style={{
                    background: `linear-gradient(to right, #eab308 0%, #eab308 ${duration ? (currentTime / duration) * 100 : 0}%, #374151 ${duration ? (currentTime / duration) * 100 : 0}%, #374151 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-zinc-300 mt-1">
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

          {/* Clip Creation Form */}
          {showClipForm && clipStartTime !== null && clipEndTime !== null && (
            <ClipCreationForm
              startTime={clipStartTime}
              endTime={clipEndTime}
              onSave={saveClip}
              onCancel={cancelClipSelection}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Clip Creation Form Component
interface ClipCreationFormProps {
  startTime: number;
  endTime: number;
  onSave: (clipData: ClipMarker) => void;
  onCancel: () => void;
}

const ClipCreationForm: React.FC<ClipCreationFormProps> = ({
  startTime,
  endTime,
  onSave,
  onCancel
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
    <div className="mt-4 bg-zinc-800 rounded-lg p-6 border border-zinc-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
          <Scissors className="w-5 h-5" />
          Create Video Clip ({formatTime(startTime)} - {formatTime(endTime)})
        </h3>
        <button
          onClick={onCancel}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

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

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-zinc-300"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors text-white font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Clip
          </button>
        </div>
      </form>
    </div>
  );
};