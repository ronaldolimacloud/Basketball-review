import React, { useState } from 'react';
import { Users, Calendar, Edit3, Trash2, MoreVertical } from 'lucide-react';
import type { Team } from '../../hooks/useTeamManagement';

interface TeamCardProps {
  team: Team;
  onSelect: (teamId: string) => void;
  onEdit: (team: Team) => void;
  onDelete: (teamId: string) => void;
  isSelected?: boolean;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onSelect,
  onEdit,
  onDelete,
  isSelected = false
}) => {
  const [showMenu, setShowMenu] = useState(false);

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
        {/* Team Name */}
        <div>
          <h3 className="text-xl font-bold text-white mb-1 pr-8">{team.name}</h3>
          {team.description && (
            <p className="text-sm text-zinc-400 line-clamp-2">{team.description}</p>
          )}
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
            <div className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              ${team.isActive 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'bg-red-500/10 text-red-400'
              }
            `}>
              <div className={`w-2 h-2 rounded-full ${team.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {team.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

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