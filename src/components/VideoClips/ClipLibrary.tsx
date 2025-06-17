import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  Play, 
  Clock, 
  Tag, 
  Search, 
  Users, 
  User, 
  Shield,
  Calendar,
  MoreVertical,
  Trash2,
  Edit,
  Share2
} from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

interface ClipLibraryProps {
  gameId?: string;
  onClipSelect?: (clip: any) => void;
}

interface VideoClip {
  id: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  visibility: 'team' | 'player' | 'coach';
  assignedPlayerIds?: string[];
  tags?: string[];
  playType?: string;
  priority: 'high' | 'medium' | 'low';
  coachNotes?: string;
  learningObjective?: string;
  createdAt: string;
  clipUrl?: string;
  thumbnailUrl?: string;
}

const client = generateClient<Schema>();

export const ClipLibrary: React.FC<ClipLibraryProps> = ({ gameId, onClipSelect }) => {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'team' | 'player' | 'coach'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [viewMode, setViewMode] = useState<'folders' | 'list'>('folders');

  // Load clips and players
  useEffect(() => {
    loadData();
  }, [gameId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load clips
      const clipsQuery = gameId 
        ? { gameId: { eq: gameId } }
        : {};
      
      const clipsResponse = await client.models.VideoClip.list({
        filter: clipsQuery
      });
      
      // Load players for player names
      const playersResponse = await client.models.Player.list();
      
      if (clipsResponse.data && playersResponse.data) {
        setClips(clipsResponse.data as VideoClip[]);
        setPlayers(playersResponse.data);
      }
    } catch (error) {
      console.error('Error loading clips:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDuration = (startTime: number, endTime: number) => {
    return endTime - startTime;
  };


  const getAllTags = () => {
    const tagSet = new Set<string>();
    clips.forEach(clip => {
      if (clip.tags) {
        const parsedTags = typeof clip.tags === 'string' ? JSON.parse(clip.tags) : clip.tags;
        parsedTags.forEach((tag: string) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  };

  const filteredClips = clips.filter(clip => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      clip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clip.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clip.playType?.toLowerCase().includes(searchTerm.toLowerCase());

    // Visibility filter
    const matchesVisibility = selectedFilter === 'all' || clip.visibility === selectedFilter;

    // Tag filter
    const matchesTag = selectedTag === '' || (clip.tags && 
      (typeof clip.tags === 'string' ? JSON.parse(clip.tags) : clip.tags).includes(selectedTag));

    return matchesSearch && matchesVisibility && matchesTag;
  });

  const groupedClips = {
    team: filteredClips.filter(clip => clip.visibility === 'team'),
    player: filteredClips.filter(clip => clip.visibility === 'player'),
    coach: filteredClips.filter(clip => clip.visibility === 'coach')
  };

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500', 
    low: 'bg-green-500'
  };

  const visibilityIcons = {
    team: Users,
    player: User,
    coach: Shield
  };

  const ClipCard = ({ clip }: { clip: VideoClip }) => {
    const [showMenu, setShowMenu] = useState(false);
    const VisibilityIcon = visibilityIcons[clip.visibility];
    
    return (
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 hover:border-yellow-500/30 transition-all duration-200 group">
        {/* Thumbnail/Preview */}
        <div className="relative aspect-video bg-zinc-900 rounded-t-lg overflow-hidden">
          {clip.thumbnailUrl ? (
            <img 
              src={clip.thumbnailUrl} 
              alt={clip.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-12 h-12 text-zinc-600" />
            </div>
          )}
          
          {/* Duration overlay */}
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
            {formatTime(getDuration(clip.startTime, clip.endTime))}
          </div>
          
          {/* Priority indicator */}
          <div className={`absolute top-2 left-2 w-2 h-2 rounded-full ${priorityColors[clip.priority]}`}></div>
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
            <button
              onClick={() => onClipSelect?.(clip)}
              className="bg-yellow-500 hover:bg-yellow-600 p-3 rounded-full text-black transition-all transform hover:scale-110"
            >
              <Play className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Clip info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-white truncate flex-1 mr-2">{clip.title}</h3>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-zinc-700 rounded transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-zinc-400" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-zinc-700 rounded-lg shadow-xl border border-zinc-600 z-10 min-w-[120px]">
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-600 rounded-t-lg flex items-center gap-2">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-600 flex items-center gap-2">
                    <Share2 className="w-3 h-3" /> Share
                  </button>
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-600 text-red-400 rounded-b-lg flex items-center gap-2">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {clip.description && (
            <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{clip.description}</p>
          )}

          <div className="flex items-center gap-2 mb-3">
            <VisibilityIcon className="w-4 h-4 text-zinc-400" />
            <span className="text-xs text-zinc-400 capitalize">{clip.visibility}</span>
            
            {clip.playType && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-xs text-zinc-400">{clip.playType}</span>
              </>
            )}
          </div>

          {clip.tags && typeof clip.tags === 'string' && JSON.parse(clip.tags).length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {JSON.parse(clip.tags).slice(0, 3).map((tag: string, index: number) => (
                <span key={index} className="px-2 py-1 bg-zinc-700 text-xs rounded-full text-zinc-300">
                  {tag}
                </span>
              ))}
              {JSON.parse(clip.tags).length > 3 && (
                <span className="px-2 py-1 bg-zinc-700 text-xs rounded-full text-zinc-300">
                  +{JSON.parse(clip.tags).length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(clip.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FolderView = () => (
    <div className="space-y-6">
      {/* Team Clips Folder */}
      <div className="bg-zinc-800/50 rounded-lg border border-zinc-700">
        <div className="flex items-center gap-3 p-4 border-b border-zinc-700">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">Team Clips</h3>
            <p className="text-sm text-zinc-400">{groupedClips.team.length} clips - Visible to all team members</p>
          </div>
        </div>
        <div className="p-4">
          {groupedClips.team.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedClips.team.map(clip => (
                <ClipCard key={clip.id} clip={clip} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No team clips yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Player Clips Folder */}
      <div className="bg-zinc-800/50 rounded-lg border border-zinc-700">
        <div className="flex items-center gap-3 p-4 border-b border-zinc-700">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <User className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">Player-Specific Clips</h3>
            <p className="text-sm text-zinc-400">{groupedClips.player.length} clips - Assigned to specific players</p>
          </div>
        </div>
        <div className="p-4">
          {groupedClips.player.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedClips.player.map(clip => (
                <ClipCard key={clip.id} clip={clip} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No player-specific clips yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Coach Only Clips Folder */}
      <div className="bg-zinc-800/50 rounded-lg border border-zinc-700">
        <div className="flex items-center gap-3 p-4 border-b border-zinc-700">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">Coach Private Clips</h3>
            <p className="text-sm text-zinc-400">{groupedClips.coach.length} clips - Coach eyes only</p>
          </div>
        </div>
        <div className="p-4">
          {groupedClips.coach.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedClips.coach.map(clip => (
                <ClipCard key={clip.id} clip={clip} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No private clips yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ListView = () => (
    <div className="space-y-4">
      {filteredClips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredClips.map(clip => (
            <ClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-zinc-500">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No clips found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        <span className="ml-3 text-zinc-400">Loading clips...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Video Clip Library</h2>
          <p className="text-zinc-400">Organize and manage your game clips</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('folders')}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              viewMode === 'folders' 
                ? 'bg-yellow-500 text-black' 
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            <Folder className="w-4 h-4" />
            Folders
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              viewMode === 'list' 
                ? 'bg-yellow-500 text-black' 
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            <Tag className="w-4 h-4" />
            List
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search clips..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
          />
        </div>

        {/* Visibility Filter */}
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value as typeof selectedFilter)}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
        >
          <option value="all">All Visibility</option>
          <option value="team">Team Only</option>
          <option value="player">Player Only</option>
          <option value="coach">Coach Only</option>
        </select>

        {/* Tag Filter */}
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
        >
          <option value="">All Tags</option>
          {getAllTags().map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {viewMode === 'folders' ? <FolderView /> : <ListView />}
    </div>
  );
};