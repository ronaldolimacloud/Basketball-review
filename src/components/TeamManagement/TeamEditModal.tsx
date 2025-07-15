import React, { useState, useEffect } from 'react';
import { X, Users, Upload, UserPlus, UserMinus, Save, Loader2 } from 'lucide-react';
import type { Team, PlayerWithTeam } from '../../hooks/useTeamManagement';
import { PlayerImage } from '../PlayerProfiles/PlayerImage';

interface TeamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  players: PlayerWithTeam[];
  onUpdateTeam: (teamId: string, updates: Partial<Team>) => Promise<boolean>;
  onAssignPlayerToTeam: (playerId: string, teamId: string) => Promise<boolean>;
  onRemovePlayerFromTeam: (playerId: string, teamId: string) => Promise<boolean>;
}

export const TeamEditModal: React.FC<TeamEditModalProps> = ({
  isOpen,
  onClose,
  team,
  players,
  onUpdateTeam,
  onAssignPlayerToTeam,
  onRemovePlayerFromTeam
}) => {
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamLogoUrl, setTeamLogoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'players'>('details');
  const [searchQuery, setSearchQuery] = useState('');

  // Get players that belong to this team
  const teamPlayers = players.filter(player => 
    player.teams.some(t => t.id === team?.id)
  );

  // Get players that don't belong to this team (available to add)
  const availablePlayers = players.filter(player => 
    !player.teams.some(t => t.id === team?.id)
  );

  // Filter available players based on search
  const filteredAvailablePlayers = availablePlayers.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (team) {
      setTeamName(team.name);
      setTeamDescription(team.description || '');
      setTeamLogoUrl(team.logoUrl || '');
      setError(null);
      setSuccess(null);
    }
  }, [team]);

  if (!isOpen || !team) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeamLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTeamDetails = async () => {
    if (!team || processing) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const updates: Partial<Team> = {
        name: teamName.trim(),
        description: teamDescription.trim(),
        logoUrl: teamLogoUrl
      };

      const success = await onUpdateTeam(team.id, updates);
      if (success) {
        setSuccess('Team details updated successfully');
        // Reset file selection after successful save
        setSelectedFile(null);
      } else {
        setError('Failed to update team details');
      }
    } catch (err) {
      setError('An error occurred while updating the team');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddPlayer = async (playerId: string) => {
    if (!team || processing) return;

    setProcessing(true);
    setError(null);

    try {
      const success = await onAssignPlayerToTeam(playerId, team.id);
      if (!success) {
        setError('Failed to add player to team');
      }
    } catch (err) {
      setError('An error occurred while adding the player');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!team || processing) return;

    setProcessing(true);
    setError(null);

    try {
      const success = await onRemovePlayerFromTeam(playerId, team.id);
      if (!success) {
        setError('Failed to remove player from team');
      }
    } catch (err) {
      setError('An error occurred while removing the player');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-zinc-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Edit Team</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-700">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Team Details
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
              activeTab === 'players'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Manage Players ({teamPlayers.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Team Logo */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Team Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center border border-zinc-700">
                    {teamLogoUrl ? (
                      <img
                        src={teamLogoUrl}
                        alt="Team logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-8 h-8 text-zinc-600" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-white cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </label>
                    {selectedFile && (
                      <p className="text-xs text-zinc-400 mt-2">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Name */}
              <div>
                <label htmlFor="team-name" className="block text-sm font-medium text-zinc-300 mb-2">
                  Team Name
                </label>
                <input
                  id="team-name"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter team name"
                />
              </div>

              {/* Team Description */}
              <div>
                <label htmlFor="team-description" className="block text-sm font-medium text-zinc-300 mb-2">
                  Description
                </label>
                <textarea
                  id="team-description"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                  placeholder="Enter team description"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveTeamDetails}
                disabled={processing || !teamName.trim()}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-zinc-700 disabled:to-zinc-800 px-6 py-3 rounded-lg font-semibold text-black disabled:text-zinc-500 transition-all flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Team Details
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Team Players */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Current Players</h3>
                {teamPlayers.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-zinc-700 rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-3 text-zinc-600" />
                    <p className="text-zinc-400">No players in this team</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {teamPlayers.map(player => (
                      <div
                        key={player.id}
                        className="bg-zinc-800 rounded-lg p-3 border border-zinc-700 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center">
                            {player.profileImageUrl ? (
                              <PlayerImage 
                                profileImageUrl={player.profileImageUrl} 
                                className="w-10 h-10 rounded-full object-cover"
                                alt={player.name}
                              />
                            ) : (
                              <Users className="w-5 h-5 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{player.name}</p>
                            <p className="text-xs text-zinc-400">{player.position || 'No position'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          disabled={processing}
                          className="p-2 text-red-400 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove from team"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Players Section */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Add Players</h3>
                
                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search players..."
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                {/* Available Players */}
                {filteredAvailablePlayers.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-zinc-700 rounded-lg">
                    <UserPlus className="w-8 h-8 mx-auto mb-3 text-zinc-600" />
                    <p className="text-zinc-400">
                      {searchQuery ? 'No players found' : 'All players are already in this team'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {filteredAvailablePlayers.map(player => (
                      <div
                        key={player.id}
                        className="bg-zinc-800 rounded-lg p-3 border border-zinc-700 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center">
                            {player.profileImageUrl ? (
                              <PlayerImage 
                                profileImageUrl={player.profileImageUrl} 
                                className="w-10 h-10 rounded-full object-cover"
                                alt={player.name}
                              />
                            ) : (
                              <Users className="w-5 h-5 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{player.name}</p>
                            <p className="text-xs text-zinc-400">{player.position || 'No position'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddPlayer(player.id)}
                          disabled={processing}
                          className="p-2 text-green-400 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                          title="Add to team"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};