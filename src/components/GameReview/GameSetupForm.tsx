import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Play, Users, Settings, Trophy } from 'lucide-react';
import type { Schema } from '../../../amplify/data/resource';
import type { GameFormat } from '../../types/game.types';
import { PlayerImage } from '../PlayerProfiles/PlayerImage';
import { useTeamManagement } from '../../hooks/useTeamManagement';

interface GameSetupFormProps {
  onSetupComplete: (teamId: string, teamName: string, opponent: string, format: GameFormat, players: any[]) => void;
  client: ReturnType<typeof generateClient<Schema>>;
}

interface GamePlayer {
  id: string;
  name: string;
  position?: string;
  profileImageUrl?: string;
  onCourt: boolean;
  stats: {
    points: number;
    fouls: number;
    turnovers: number;
    offRebounds: number;
    defRebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    fgMade: number;
    fgAttempts: number;
    ftMade: number;
    ftAttempts: number;
    plusMinus: number;
    timeOnCourt: number;
  };
  startTime: number | null;
}

export const GameSetupForm: React.FC<GameSetupFormProps> = ({ onSetupComplete, client }) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [opponentName, setOpponentName] = useState('');
  const [gameFormat, setGameFormat] = useState<GameFormat>('quarters');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  
  // Use team management hook
  const teamManagement = useTeamManagement(client);

  // Get available players based on selected team
  const availablePlayers = selectedTeamId 
    ? teamManagement.getTeamPlayers(selectedTeamId)
    : [];

  // Get selected team name
  const selectedTeam = teamManagement.teams.find(team => team.id === selectedTeamId);
  const teamName = selectedTeam?.name || '';

  // Clear selected players when team changes
  useEffect(() => {
    setSelectedPlayerIds([]);
  }, [selectedTeamId]);

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayerIds(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleStartGame = () => {
    if (!teamName.trim() || !opponentName.trim() || selectedPlayerIds.length === 0) {
      alert('Please fill in all fields and select at least one player');
      return;
    }

    if (selectedPlayerIds.length > 15) {
      alert('Maximum 15 players allowed per game');
      return;
    }

    // Convert selected players to game format
    const gamePlayers: GamePlayer[] = selectedPlayerIds.map((playerId, index) => {
      const player = availablePlayers.find(p => p.id === playerId);
      if (!player) {
        throw new Error(`Player with ID ${playerId} not found`);
      }
      return {
        id: player.id,
        name: player.name,
        position: player.position,
        profileImageUrl: player.profileImageUrl,
        onCourt: index < 5, // First 5 players start on court
        stats: {
          points: 0,
          fouls: 0,
          turnovers: 0,
          offRebounds: 0,
          defRebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          fgMade: 0,
          fgAttempts: 0,
          ftMade: 0,
          ftAttempts: 0,
          plusMinus: 0,
          timeOnCourt: 0
        },
        startTime: index < 5 ? 0 : null
      };
    });

    onSetupComplete(selectedTeamId, teamName.trim(), opponentName.trim(), gameFormat, gamePlayers);
  };

  const isValid = selectedTeamId && opponentName.trim() && selectedPlayerIds.length > 0;

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
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg p-8 max-w-4xl w-full border border-zinc-700">
        <h1 className="text-3xl font-bold mb-8 text-center text-yellow-400 flex items-center justify-center gap-3">
          <Settings className="w-8 h-8" />
          Game Setup
        </h1>

        <div className="space-y-8">
          {/* Basic Game Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Select Your Team
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
              >
                <option value="">Choose a team...</option>
                {teamManagement.teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({teamManagement.getTeamPlayers(team.id).length} players)
                  </option>
                ))}
              </select>
              {teamManagement.teams.length === 0 && (
                <p className="text-xs text-zinc-400 mt-1">
                  No teams found. Create teams in the "My Teams" tab first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Opponent Team
              </label>
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="Enter opponent name"
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Game Format
              </label>
              <select
                value={gameFormat}
                onChange={(e) => setGameFormat(e.target.value as GameFormat)}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
              >
                <option value="quarters">4 Quarters</option>
                <option value="halves">2 Halves</option>
              </select>
            </div>
          </div>

          {/* Player Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-yellow-400 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select Players ({selectedPlayerIds.length} selected)
              </h2>
              {!selectedTeamId && (
                <p className="text-sm text-zinc-400">
                  Please select a team first to see available players.
                </p>
              )}
              {selectedTeamId && availablePlayers.length === 0 && (
                <p className="text-sm text-zinc-400">
                  No players assigned to this team. Assign players in the "Players" tab.
                </p>
              )}
            </div>

            {selectedTeamId && availablePlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {availablePlayers.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => handlePlayerToggle(player.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedPlayerIds.includes(player.id)
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-zinc-600 bg-zinc-800 hover:border-zinc-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Profile Picture */}
                        <div className="w-10 h-10 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <PlayerImage 
                            profileImageUrl={player.profileImageUrl}
                            className="w-full h-full object-cover"
                            alt={player.name}
                          />
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-white">{player.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                            {player.position && (
                              <span className="bg-zinc-700 px-2 py-0.5 rounded">{player.position}</span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">
                            {player.teams.length > 0 ? `Member of ${player.teams.length} team(s)` : 'No team assignments'}
                          </div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPlayerIds.includes(player.id)
                          ? 'border-yellow-500 bg-yellow-500'
                          : 'border-zinc-500'
                      }`}>
                        {selectedPlayerIds.includes(player.id) && (
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-400">
                {!selectedTeamId ? (
                  <>
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                    <p>Select a team to see available players</p>
                    <p className="text-sm mt-2">Choose your team from the dropdown above</p>
                  </>
                ) : (
                  <>
                    <Users className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                    <p>No players assigned to this team</p>
                    <p className="text-sm mt-2">Assign players to this team in the "Players" tab</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Game Info Summary */}
          {selectedPlayerIds.length > 0 && (
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <h3 className="font-medium text-white mb-2">Game Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-zinc-400">Starting 5:</span>
                  <div className="text-yellow-400 font-medium">
                    {selectedPlayerIds.slice(0, 5).map(id => 
                      availablePlayers.find(p => p.id === id)?.name
                    ).join(', ')}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-400">Bench:</span>
                  <div className="text-zinc-300">
                    {selectedPlayerIds.length > 5 ? `${selectedPlayerIds.length - 5} players` : 'None'}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-400">Format:</span>
                  <div className="text-zinc-300">
                    {gameFormat === 'quarters' ? '4 Quarters' : '2 Halves'}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-400">Total Players:</span>
                  <div className="text-emerald-400 font-medium">{selectedPlayerIds.length}</div>
                </div>
              </div>
            </div>
          )}

          {/* Start Game Button */}
          <div className="text-center">
            <button
              onClick={handleStartGame}
              disabled={!isValid}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-zinc-600 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-bold text-black text-lg transition-all flex items-center gap-3 mx-auto"
            >
              <Play className="w-6 h-6" />
              Start Game Review
            </button>
            {!isValid && (
              <p className="text-sm text-zinc-400 mt-2">
                Please select a team, enter opponent name, and choose at least one player
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 