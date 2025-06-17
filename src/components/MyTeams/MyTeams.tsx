import React, { useState } from 'react';
import { Users, ChevronDown, ChevronRight, Settings, UserPlus, FolderPlus, Trophy } from 'lucide-react';
import { StorageImage } from '@aws-amplify/ui-react-storage';
import type { Schema } from '../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { useTeamManagement, type Team, type PlayerWithTeam } from '../../hooks/useTeamManagement';
import { TeamCreationModal } from '../TeamManagement/TeamCreationModal';
import { TeamCard } from '../TeamManagement/TeamCard';
import { PlayerTeamAssignmentModal } from '../TeamManagement/PlayerTeamAssignmentModal';
import { PlayerImage } from '../PlayerProfiles/PlayerImage';

interface MyTeamsProps {
  client: ReturnType<typeof generateClient<Schema>>;
}

export const MyTeams: React.FC<MyTeamsProps> = ({ client }) => {
  const teamManagement = useTeamManagement(client);
  
  // UI State
  const [showTeamCreationModal, setShowTeamCreationModal] = useState(false);
  const [showPlayerAssignmentModal, setShowPlayerAssignmentModal] = useState(false);
  const [selectedPlayerForAssignment, setSelectedPlayerForAssignment] = useState<PlayerWithTeam | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  // Team operations
  const handleCreateTeam = async (name: string, description?: string, logoUrl?: string): Promise<boolean> => {
    const result = await teamManagement.createTeam(name, description, logoUrl);
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

  if (teamManagement.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading teams...</p>
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
              <Trophy className="w-8 h-8" />
              My Teams
            </h2>
            <p className="text-zinc-300">Create and manage your basketball teams</p>
            <div className="mt-3 flex items-center gap-6 text-sm text-zinc-400">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                Total Teams: {teamManagement.teams.length}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Assigned Players: {teamManagement.players.filter(p => p.teams.length > 0).length}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                Total Members: {teamManagement.players.reduce((sum, player) => sum + player.teams.length, 0)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-zinc-800 rounded-lg border border-zinc-700 p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'cards'
                    ? 'bg-yellow-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-yellow-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                List
              </button>
            </div>

            <button
              onClick={() => setShowTeamCreationModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-4 py-3 rounded-xl font-semibold text-black transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <FolderPlus className="w-5 h-5" />
              Create Team
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {teamManagement.teams.length === 0 ? (
        // Empty State
        <div className="text-center py-16">
          <div className="p-4 bg-zinc-800 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Trophy className="w-12 h-12 text-zinc-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Teams Created</h3>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">
            Create your first team to start organizing players and managing games. Teams help you organize players for different age groups, skill levels, or leagues.
          </p>
          <button
            onClick={() => setShowTeamCreationModal(true)}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-6 py-3 rounded-xl font-semibold text-black transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
          >
            <FolderPlus className="w-5 h-5" />
            Create Your First Team
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        // Cards View
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
      ) : (
        // List View - Teams with Players
        <div className="space-y-4">
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
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-700 flex items-center justify-center border border-zinc-600">
                      {team.logoUrl ? (
                        <StorageImage
                          path={team.logoUrl}
                          alt={`${team.name} logo`}
                          className="w-full h-full object-cover"
                          validateObjectExistence={true}
                          loadingElement={
                            <div className="w-full h-full animate-pulse bg-zinc-600/50 flex items-center justify-center">
                              <Trophy className="w-4 h-4 text-zinc-500/50" />
                            </div>
                          }
                          fallbackSrc=""
                          onGetUrlError={(error) => {
                            console.error(`❌ StorageImage error for team logo: ${team.logoUrl}`);
                            console.error('❌ Error details:', error);
                          }}
                        />
                      ) : (
                        <Trophy className="w-6 h-6 text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{team.name}</h3>
                      <p className="text-sm text-zinc-400">
                        {teamPlayers.length} players • {team.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-zinc-400">
                      Click to {isExpanded ? 'collapse' : 'expand'}
                    </div>
                  </div>
                </div>

                {/* Team Players */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-zinc-700">
                    <div className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white">Team Roster</h4>
                        <span className="text-sm text-zinc-400">{teamPlayers.length} players</span>
                      </div>
                      
                      {teamPlayers.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-zinc-700 rounded-lg">
                          <UserPlus className="w-8 h-8 mx-auto mb-3 text-zinc-600" />
                          <p className="text-zinc-400 mb-2">No players assigned to this team</p>
                          <p className="text-sm text-zinc-500">Go to the Players tab to assign players to this team</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {teamPlayers.map(player => (
                            <div
                              key={player.id}
                              className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 hover:border-zinc-600 transition-colors"
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
                                  <h5 className="font-medium text-white truncate">{player.name}</h5>
                                  <p className="text-sm text-zinc-400">{player.position || 'No position'}</p>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => handlePlayerAssignment(player)}
                                className="mt-3 w-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <Settings className="w-4 h-4" />
                                Manage Teams
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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