import React, { useState, useEffect } from 'react';
import { X, Users, Check, User } from 'lucide-react';
import type { Team, PlayerWithTeam } from '../../hooks/useTeamManagement';

interface PlayerTeamAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerWithTeam | null;
  teams: Team[];
  onAssignPlayerToTeam: (playerId: string, teamId: string) => Promise<boolean>;
  onRemovePlayerFromTeam: (playerId: string, teamId: string) => Promise<boolean>;
}

export const PlayerTeamAssignmentModal: React.FC<PlayerTeamAssignmentModalProps> = ({
  isOpen,
  onClose,
  player,
  teams,
  onAssignPlayerToTeam,
  onRemovePlayerFromTeam
}) => {
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [originalTeamIds, setOriginalTeamIds] = useState<Set<string>>(new Set());

  // Initialize selected teams when player changes
  useEffect(() => {
    if (player) {
      const playerTeamIds = new Set(player.teams.map(team => team.id));
      setSelectedTeamIds(playerTeamIds);
      setOriginalTeamIds(playerTeamIds);
    }
  }, [player]);

  const handleTeamToggle = (teamId: string) => {
    if (processing) return;

    setSelectedTeamIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!player || processing) return;

    setProcessing(true);
    try {
      // Find teams to add and remove
      const teamsToAdd = Array.from(selectedTeamIds).filter(id => !originalTeamIds.has(id));
      const teamsToRemove = Array.from(originalTeamIds).filter(id => !selectedTeamIds.has(id));

      // Process additions
      for (const teamId of teamsToAdd) {
        await onAssignPlayerToTeam(player.id, teamId);
      }

      // Process removals
      for (const teamId of teamsToRemove) {
        await onRemovePlayerFromTeam(player.id, teamId);
      }

      onClose();
    } catch (error) {
      console.error('Error updating player team assignments:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      setSelectedTeamIds(originalTeamIds);
      onClose();
    }
  };

  const hasChanges = !Array.from(selectedTeamIds).every(id => originalTeamIds.has(id)) ||
                     !Array.from(originalTeamIds).every(id => selectedTeamIds.has(id));

  if (!isOpen || !player) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Assign Teams</h2>
              <p className="text-sm text-zinc-400">{player.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={processing}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">
              Select teams for this player:
            </h3>
          </div>

          {/* Teams List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {teams.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-400">No teams available</p>
                <p className="text-sm text-zinc-500">Create a team first to assign players</p>
              </div>
            ) : (
              teams.map(team => {
                const isSelected = selectedTeamIds.has(team.id);
                return (
                  <label
                    key={team.id}
                    className={`
                      flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all
                      ${isSelected 
                        ? 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/15' 
                        : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700/50'
                      }
                      ${processing ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleTeamToggle(team.id)}
                      disabled={processing}
                      className="sr-only"
                    />
                    
                    {/* Custom Checkbox */}
                    <div className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                      ${isSelected 
                        ? 'bg-yellow-500 border-yellow-500' 
                        : 'bg-transparent border-zinc-600'
                      }
                    `}>
                      {isSelected && <Check className="w-3 h-3 text-black" />}
                    </div>

                    {/* Team Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{team.name}</h4>
                          {team.description && (
                            <p className="text-sm text-zinc-400 mt-1">{team.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-zinc-400">{team.playerCount || 0} players</p>
                          <div className={`
                            text-xs px-2 py-1 rounded-full mt-1
                            ${team.isActive 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-red-500/10 text-red-400'
                            }
                          `}>
                            {team.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-zinc-700 mt-6">
            <button
              onClick={handleClose}
              disabled={processing}
              className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || processing || teams.length === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-zinc-600 disabled:to-zinc-700 text-black font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 