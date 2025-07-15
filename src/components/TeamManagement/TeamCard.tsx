import React, { useState } from 'react';
import { Users, Calendar, Edit3, Trash2, MoreVertical } from 'lucide-react';
import type { Team, PlayerWithTeam } from '../../hooks/useTeamManagement';
import { api } from '../../services/api';
import { PlayerImage } from '../PlayerProfiles/PlayerImage';

interface TeamCardProps {
  team: Team;
  players?: PlayerWithTeam[];
  onSelect: (teamId: string) => void;
  onEdit: (team: Team) => void;
  onDelete: (teamId: string) => void;
  isSelected?: boolean;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  players = [],
  onSelect,
  onEdit,
  onDelete,
  isSelected = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [logoLoading, setLogoLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);

  const handleCardClick = () => {
    onSelect(team.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit(team);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (window.confirm(`Are you sure you want to delete "${team.name}"? This will remove all player associations.`)) {
      onDelete(team.id);
    }
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`
        relative bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl p-6 cursor-pointer 
        transition-all duration-200 hover:scale-105 hover:shadow-2xl border
        ${isSelected 
          ? 'border-yellow-500 shadow-lg shadow-yellow-500/20 ring-2 ring-yellow-500/30' 
          : 'border-zinc-700 hover:border-zinc-600'
        }
      `}
    >
      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <button
            onClick={handleMenuToggle}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-zinc-400" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-10 z-20 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl min-w-[120px]">
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 rounded-t-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 rounded-b-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Team Info */}
      <div className="space-y-4">
        {/* Team Logo & Name */}
        <div className="flex items-center gap-3">
          {/* Team Logo */}
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-700 flex items-center justify-center flex-shrink-0 border border-zinc-600 relative">
            {api.getMockImageUrl(team.logoUrl) && !logoError ? (
              <>
                {logoLoading && (
                  <div className="w-full h-full animate-pulse bg-zinc-600/50 flex items-center justify-center absolute inset-0">
                    <Users className="w-4 h-4 text-zinc-500/50" />
                  </div>
                )}
                <img
                  src={api.getMockImageUrl(team.logoUrl)!}
                  alt={`${team.name} logo`}
                  className={`w-full h-full object-cover ${logoLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => setLogoLoading(false)}
                  onError={() => {
                    setLogoLoading(false);
                    setLogoError(true);
                  }}
                />
              </>
            ) : (
              <Users className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          
          {/* Team Name & Description */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white mb-1 truncate">{team.name}</h3>
            {team.description && (
              <p className="text-sm text-zinc-400 line-clamp-2">{team.description}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Users className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{team.playerCount || 0}</p>
              <p className="text-xs text-zinc-400">Players</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-zinc-400">
              {team.playerCount || 0} member{(team.playerCount || 0) !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Player Avatars Preview */}
        {players.length > 0 && (
          <div className="pt-3 border-t border-zinc-700">
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {players.slice(0, 4).map((player, index) => (
                  <div
                    key={player.id}
                    className="w-8 h-8 rounded-full overflow-hidden bg-zinc-700 border-2 border-zinc-800 flex items-center justify-center"
                    style={{ zIndex: players.length - index }}
                  >
                    {player.profileImageUrl ? (
                      <PlayerImage 
                        profileImageUrl={player.profileImageUrl} 
                        className="w-8 h-8 rounded-full object-cover"
                        alt={player.name}
                      />
                    ) : (
                      <span className="text-xs font-medium text-zinc-400">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
                {players.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-zinc-800 flex items-center justify-center">
                    <span className="text-xs font-medium text-zinc-400">
                      +{players.length - 4}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-zinc-500">
                {players.slice(0, 2).map(p => p.name).join(', ')}
                {players.length > 2 && ` +${players.length - 2} more`}
              </div>
            </div>
          </div>
        )}

        {/* Created Date */}
        {team.createdAt && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Calendar className="w-3 h-3" />
            Created {new Date(team.createdAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 rounded-xl border-2 border-yellow-500 pointer-events-none" />
      )}
    </div>
  );
}; 