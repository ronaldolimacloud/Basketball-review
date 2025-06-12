import React, { useState } from 'react';
import { Plus, Users, ChevronDown, ChevronRight, Settings, UserPlus, FolderPlus } from 'lucide-react';
import type { Schema } from '../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { useTeamManagement, type Team, type PlayerWithTeam } from '../../hooks/useTeamManagement';
import { TeamCreationModal } from '../TeamManagement/TeamCreationModal';
import { TeamCard } from '../TeamManagement/TeamCard';
import { PlayerTeamAssignmentModal } from '../TeamManagement/PlayerTeamAssignmentModal';
import { PlayerImage } from './PlayerImage';
import { PlayerDetail } from './PlayerDetail';

interface PlayerProfilesWithTeamsProps {
  client: ReturnType<typeof generateClient<Schema>>;
}

export const PlayerProfilesWithTeams: React.FC<PlayerProfilesWithTeamsProps> = ({ client }) => {
  const teamManagement = useTeamManagement(client);
  
  // UI State
  const [showTeamCreationModal, setShowTeamCreationModal] = useState(false);
  const [showPlayerAssignmentModal, setShowPlayerAssignmentModal] = useState(false);
  const [selectedPlayerForAssignment, setSelectedPlayerForAssignment] = useState<PlayerWithTeam | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'teams' | 'dashboard'>('dashboard');

  // Team operations
  const handleCreateTeam = async (name: string, description?: string): Promise<boolean> => {
    const result = await teamManagement.createTeam(name, description);
    return result !== null;
  };

  const handleDeleteTeam = (teamId: string) => {
    teamManagement.deleteTeam(teamId);
  };

  const handleEditTeam = (team: Team) => {
    // TODO: Implement team editing modal
    console.log('Edit team:', team);
  };

  const handlePlayerAssignment = (player: PlayerWithTeam) => {
    setSelectedPlayerForAssignment(player);
    setShowPlayerAssignmentModal(true);
  };

  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  const handlePlayerClick = (playerId: string) => {
    setSelectedPlayerId(playerId);
  };

  // If a player is selected, show the player detail view
  if (selectedPlayerId) {
    const selectedPlayer = teamManagement.players.find(p => p.id === selectedPlayerId);
    if (!selectedPlayer) {
      setSelectedPlayerId(null);
      return null;
    }
    
    // Convert PlayerWithTeam back to legacy format for PlayerDetail component
    const legacyPlayer = {
      id: selectedPlayer.id,
      name: selectedPlayer.name,
      position: selectedPlayer.position,
      profileImageUrl: selectedPlayer.profileImageUrl,
      isActive: selectedPlayer.isActive,
      // Add other required fields with defaults
      height: '',
      weight: '',
      jerseyNumber: 0,
      totalGamesPlayed: 0,
      careerPoints: 0,
      careerAssists: 0,
      careerRebounds: 0,
      careerSteals: 0,
      careerBlocks: 0,
      careerFouls: 0,
      careerTurnovers: 0,
      careerFgMade: 0,
      careerFgAttempts: 0,
      careerFtMade: 0,
      careerFtAttempts: 0,
      careerMinutesPlayed: 0
    };

    return (
      <PlayerDetail 
        player={legacyPlayer}
        onBack={() => setSelectedPlayerId(null)}
        client={client}
      />
    );
  }

  if (teamManagement.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading teams and players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-yellow-400 flex items-center gap-3 mb-2">
              <Users className="w-8 h-8" />
              Team & Player Management
            </h2>
            <p className="text-zinc-300">Organize players by teams and manage your roster</p>
            <div className="mt-3 flex items-center gap-6 text-sm text-zinc-400">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                Teams: {teamManagement.teams.length}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Total Players: {teamManagement.players.length}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                Unassigned: {teamManagement.getUnassignedPlayers().length}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-zinc-800 rounded-lg border border-zinc-700 p-1">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'dashboard'
                    ? 'bg-yellow-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setViewMode('teams')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'teams'
                    ? 'bg-yellow-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Team View
              </button>
            </div>

            <button
              onClick={() => setShowTeamCreationModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-4 py-3 rounded-xl font-semibold text-black transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <FolderPlus className="w-5 h-5" />
              New Team
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'dashboard' ? (
        // Dashboard View - Team Cards
        <div className="space-y-6">
          {teamManagement.teams.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-zinc-800 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Users className="w-12 h-12 text-zinc-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Teams Created</h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Create your first team to start organizing players and managing games.
              </p>
              <button
                onClick={() => setShowTeamCreationModal(true)}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-6 py-3 rounded-xl font-semibold text-black transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
              >
                <FolderPlus className="w-5 h-5" />
                Create First Team
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamManagement.teams.map(team => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onSelect={teamManagement.setSelectedTeamId}
                  onEdit={handleEditTeam}
                  onDelete={handleDeleteTeam}
                  isSelected={teamManagement.selectedTeamId === team.id}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Team View - Organized by Teams
        <div className="space-y-6">
          {/* Teams with Players */}
          {teamManagement.teams.map(team => {
            const teamPlayers = teamManagement.getTeamPlayers(team.id);
            const isExpanded = expandedTeams.has(team.id);

            return (
              <div key={team.id} className="bg-zinc-900 rounded-xl border border-zinc-700">
                {/* Team Header */}
                <div 
                  onClick={() => toggleTeamExpansion(team.id)}
                  className="flex items-center justify-between p-6 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-zinc-400" />
                    )}
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <Users className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{team.name}</h3>
                      <p className="text-sm text-zinc-400">
                        {teamPlayers.length} players • {team.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${team.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-red-500/10 text-red-400'
                      }
                    `}>
                      {team.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>

                {/* Team Players */}
                {isExpanded && (
                  <div className="px-6 pb-6">
                    {teamPlayers.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-zinc-700 rounded-lg">
                        <UserPlus className="w-8 h-8 mx-auto mb-3 text-zinc-600" />
                        <p className="text-zinc-400">No players assigned to this team</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {teamPlayers.map(player => (
                          <div
                            key={player.id}
                            onClick={() => handlePlayerClick(player.id)}
                            className="bg-zinc-800 rounded-lg p-4 cursor-pointer hover:bg-zinc-700 transition-colors border border-zinc-700"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center">
                                {player.profileImageUrl ? (
                                  <PlayerImage 
                                    profileImageUrl={player.profileImageUrl} 
                                    className="w-12 h-12 rounded-full object-cover"
                                    alt={player.name}
                                  />
                                ) : (
                                  <Users className="w-6 h-6 text-zinc-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white truncate">{player.name}</h4>
                                <p className="text-sm text-zinc-400">{player.position || 'No position'}</p>
                              </div>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayerAssignment(player);
                              }}
                              className="mt-3 w-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Settings className="w-4 h-4" />
                              Assign Teams
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned Players */}
          {teamManagement.getUnassignedPlayers().length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-700">
              <div 
                onClick={() => toggleTeamExpansion('unassigned')}
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {expandedTeams.has('unassigned') ? (
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-zinc-400" />
                  )}
                  <div className="p-2 bg-zinc-500/10 rounded-lg">
                    <UserPlus className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Unassigned Players</h3>
                    <p className="text-sm text-zinc-400">
                      {teamManagement.getUnassignedPlayers().length} players not assigned to any team
                    </p>
                  </div>
                </div>
              </div>

              {expandedTeams.has('unassigned') && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {teamManagement.getUnassignedPlayers().map(player => (
                      <div
                        key={player.id}
                        onClick={() => handlePlayerClick(player.id)}
                        className="bg-zinc-800 rounded-lg p-4 cursor-pointer hover:bg-zinc-700 transition-colors border border-zinc-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center">
                                                         {player.profileImageUrl ? (
                               <PlayerImage 
                                 profileImageUrl={player.profileImageUrl} 
                                 className="w-12 h-12 rounded-full object-cover"
                                 alt={player.name}
                               />
                             ) : (
                               <Users className="w-6 h-6 text-zinc-400" />
                             )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{player.name}</h4>
                            <p className="text-sm text-zinc-400">{player.position || 'No position'}</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayerAssignment(player);
                          }}
                          className="mt-3 w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Assign to Team
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <TeamCreationModal
        isOpen={showTeamCreationModal}
        onClose={() => setShowTeamCreationModal(false)}
        onCreateTeam={handleCreateTeam}
      />

      <PlayerTeamAssignmentModal
        isOpen={showPlayerAssignmentModal}
        onClose={() => setShowPlayerAssignmentModal(false)}
        player={selectedPlayerForAssignment}
        teams={teamManagement.teams}
        onAssignPlayerToTeam={teamManagement.assignPlayerToTeam}
        onRemovePlayerFromTeam={teamManagement.removePlayerFromTeam}
      />
    </div>
  );
}; 