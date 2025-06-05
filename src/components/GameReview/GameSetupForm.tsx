import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Play, Users, Settings, User } from 'lucide-react';
import type { Schema } from '../../../amplify/data/resource';
import type { GameFormat } from '../../types/game.types';
import { PlayerImage } from '../PlayerProfiles/PlayerImage';

interface GameSetupFormProps {
  onSetupComplete: (team: string, opponent: string, format: GameFormat, players: any[]) => void;
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
  const [teamName, setTeamName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [gameFormat, setGameFormat] = useState<GameFormat>('quarters');
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const { data } = await client.models.Player.list();
      const activePlayers = (data || []).filter(player => player.isActive);
      setAvailablePlayers(activePlayers);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

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

    onSetupComplete(teamName.trim(), opponentName.trim(), gameFormat, gamePlayers);
  };

  const isValid = teamName.trim() && opponentName.trim() && selectedPlayerIds.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg p-8 max-w-4xl w-full border border-slate-700">
        <h1 className="text-3xl font-bold mb-8 text-center text-yellow-400 flex items-center justify-center gap-3">
          <Settings className="w-8 h-8" />
          Game Setup
        </h1>

        <div className="space-y-8">
          {/* Basic Game Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Your Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Opponent Team
              </label>
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="Enter opponent name"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Game Format
              </label>
              <select
                value={gameFormat}
                onChange={(e) => setGameFormat(e.target.value as GameFormat)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
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
              {availablePlayers.length === 0 && (
                <p className="text-sm text-slate-400">
                  No players found. Please add players in the Player Profiles tab first.
                </p>
              )}
            </div>

            {availablePlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {availablePlayers.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => handlePlayerToggle(player.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedPlayerIds.includes(player.id)
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Profile Picture */}
                        <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <PlayerImage 
                            profileImageUrl={player.profileImageUrl}
                            className="w-full h-full object-cover"
                            alt={player.name}
                          />
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-white">{player.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                            {player.position && (
                              <span className="bg-slate-700 px-2 py-0.5 rounded">{player.position}</span>
                            )}
                            {player.jerseyNumber && <span>#{player.jerseyNumber}</span>}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {player.totalGamesPlayed || 0} games played
                          </div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPlayerIds.includes(player.id)
                          ? 'border-yellow-500 bg-yellow-500'
                          : 'border-slate-500'
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
              <div className="text-center py-8 text-slate-400">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p>No active players available</p>
                <p className="text-sm mt-2">Add players in the Player Profiles tab to get started</p>
              </div>
            )}
          </div>

          {/* Game Info Summary */}
          {selectedPlayerIds.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h3 className="font-medium text-white mb-2">Game Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Starting 5:</span>
                  <div className="text-yellow-400 font-medium">
                    {selectedPlayerIds.slice(0, 5).map(id => 
                      availablePlayers.find(p => p.id === id)?.name
                    ).join(', ')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Bench:</span>
                  <div className="text-slate-300">
                    {selectedPlayerIds.length > 5 ? `${selectedPlayerIds.length - 5} players` : 'None'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Format:</span>
                  <div className="text-slate-300">
                    {gameFormat === 'quarters' ? '4 Quarters' : '2 Halves'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Total Players:</span>
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
              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-600 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-bold text-black text-lg transition-all flex items-center gap-3 mx-auto"
            >
              <Play className="w-6 h-6" />
              Start Game Review
            </button>
            {!isValid && (
              <p className="text-sm text-slate-400 mt-2">
                Please complete all fields and select at least one player
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 