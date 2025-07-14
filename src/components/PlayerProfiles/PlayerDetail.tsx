import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, TrendingUp, Calendar, BarChart3, Clock, Star, Activity } from 'lucide-react';
import { PlayerImage } from './PlayerImage';
import { api } from '../../services/api';

interface PlayerDetailProps {
  player: any; // Player data passed from parent
  onBack: () => void;
}

export const PlayerDetail: React.FC<PlayerDetailProps> = ({ player, onBack }) => {
  const [gameStats, setGameStats] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    fetchGameStats();
  }, [player.id]);

  const fetchGameStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all games and filter for this player's stats
      const gamesResult = await api.games.list();
      if (gamesResult.success && gamesResult.data) {
        // Filter games where this player has stats
        const playerGames = gamesResult.data
          .filter((game: any) => game.playerStats && game.playerStats[player.id])
          .map((game: any) => ({
            ...game.playerStats[player.id],
            gameId: game.id,
            gameDate: game.createdAt,
            opponent: game.opponent
          }));
        setGameStats(playerGames);
      }
      
    } catch (error) {
      console.error('Error fetching game stats:', error);
    } finally {
      setLoading(false);
    }
  };


  const calculateAverages = () => {
    if (!player || gameStats.length === 0) return null;
    
    const totalGames = gameStats.length;
    const totals = gameStats.reduce((acc, game) => ({
      points: acc.points + (game.points || 0),
      assists: acc.assists + (game.assists || 0),
      rebounds: acc.rebounds + (game.offRebounds || 0) + (game.defRebounds || 0),
      steals: acc.steals + (game.steals || 0),
      blocks: acc.blocks + (game.blocks || 0),
      fgMade: acc.fgMade + (game.fgMade || 0),
      fgAttempts: acc.fgAttempts + (game.fgAttempts || 0),
      ftMade: acc.ftMade + (game.ftMade || 0),
      ftAttempts: acc.ftAttempts + (game.ftAttempts || 0),
      minutesPlayed: acc.minutesPlayed + (game.minutesPlayed || 0),
    }), {
      points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0,
      fgMade: 0, fgAttempts: 0, ftMade: 0, ftAttempts: 0, minutesPlayed: 0
    });

    return {
      ppg: (totals.points / totalGames).toFixed(1),
      apg: (totals.assists / totalGames).toFixed(1),
      rpg: (totals.rebounds / totalGames).toFixed(1),
      spg: (totals.steals / totalGames).toFixed(1),
      bpg: (totals.blocks / totalGames).toFixed(1),
      fgPct: totals.fgAttempts > 0 ? ((totals.fgMade / totals.fgAttempts) * 100).toFixed(1) : '0.0',
      ftPct: totals.ftAttempts > 0 ? ((totals.ftMade / totals.ftAttempts) * 100).toFixed(1) : '0.0',
      mpg: (totals.minutesPlayed / totalGames).toFixed(1),
      totalGames,
      ...totals
    };
  };

  if (!player) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-400">Player not found</p>
        <button
          onClick={onBack}
          className="mt-4 bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const averages = calculateAverages();

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-700 hover:from-zinc-700 hover:to-zinc-600 transition-all transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Player Profile
            </h1>
            <p className="text-zinc-400 mt-1">Detailed performance analysis and insights</p>
          </div>
        </div>
        
      </div>

      {/* Enhanced Player Info Card */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-8 border border-zinc-700 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Player Image Section */}
          <div className="flex-shrink-0 text-center lg:text-left">
            <div className="relative inline-block">
              <div className="w-56 h-56 mx-auto lg:mx-0 rounded-2xl overflow-hidden border-4 border-gradient-to-r from-yellow-500 to-yellow-600 shadow-2xl">
                <PlayerImage
                  profileImageUrl={player.profileImageUrl}
                  className="w-full h-full object-cover"
                  alt={player.name}
                />
              </div>
              {/* Status Indicator */}
              <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-zinc-900 ${player.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
            </div>
          </div>

          {/* Player Info Section */}
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                {player.name}
              </h2>
              <div className="flex flex-wrap gap-3 mb-4">
                {player.position && (
                  <span className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-lg text-sm font-medium">
                    <Star className="w-4 h-4 inline mr-1" />
                    {player.position}
                  </span>
                )}
                {player.jerseyNumber && (
                  <span className="bg-gradient-to-r from-zinc-800 to-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium">
                    #{player.jerseyNumber}
                  </span>
                )}
                <span className={`px-4 py-2 rounded-lg text-sm font-medium ${player.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <Activity className="w-4 h-4 inline mr-1" />
                  {player.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Enhanced Physical Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {player.height && (
                <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{player.height}</div>
                  <div className="text-xs text-zinc-400">Height</div>
                </div>
              )}
              {player.weight && (
                <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{player.weight}</div>
                  <div className="text-xs text-zinc-400">Weight</div>
                </div>
              )}
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-yellow-400">{player.totalGamesPlayed || 0}</div>
                <div className="text-xs text-zinc-400">Games</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-emerald-400">
                  {gameStats.length > 0 ? ((player.careerPoints || 0) / gameStats.length).toFixed(1) : '0.0'}
                </div>
                <div className="text-xs text-zinc-400">Avg PPG</div>
              </div>
            </div>

            {/* Enhanced Career Totals */}
            <div className="bg-zinc-800/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Career Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">{player.careerPoints || 0}</div>
                  <div className="text-sm text-zinc-400">Total Points</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-1">{player.careerAssists || 0}</div>
                  <div className="text-sm text-zinc-400">Total Assists</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-1">{player.careerRebounds || 0}</div>
                  <div className="text-sm text-zinc-400">Total Rebounds</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-1">{player.careerSteals || 0}</div>
                  <div className="text-sm text-zinc-400">Total Steals</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Season Averages */}
      {averages && (
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">Season Averages</h3>
            <span className="text-sm text-zinc-400">({averages.totalGames} games)</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{averages.ppg}</div>
              <div className="text-xs text-zinc-400">PPG</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{averages.apg}</div>
              <div className="text-xs text-zinc-400">APG</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{averages.rpg}</div>
              <div className="text-xs text-zinc-400">RPG</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{averages.fgPct}%</div>
              <div className="text-xs text-zinc-400">FG%</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-pink-400">{averages.ftPct}%</div>
              <div className="text-xs text-zinc-400">FT%</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{averages.spg}</div>
              <div className="text-xs text-zinc-400">SPG</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{averages.bpg}</div>
              <div className="text-xs text-zinc-400">BPG</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{averages.mpg}</div>
              <div className="text-xs text-zinc-400">MPG</div>
            </div>
          </div>
        </div>
      )}

      {/* Game History */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">Game History</h3>
        </div>
        
        {gameStats.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No games played yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {gameStats.slice().reverse().map((game, index) => (
              <div key={game.id} className="bg-zinc-800/50 rounded-lg p-4 hover:bg-zinc-800/70 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-white">Game #{gameStats.length - index}</div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Clock className="w-3 h-3" />
                    {game.minutesPlayed || 0} min
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">PTS</span>
                    <span className="font-bold text-emerald-400">{game.points || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">AST</span>
                    <span className="font-bold text-blue-400">{game.assists || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">REB</span>
                    <span className="font-bold text-purple-400">{(game.offRebounds || 0) + (game.defRebounds || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">STL</span>
                    <span className="font-bold text-green-400">{game.steals || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">BLK</span>
                    <span className="font-bold text-red-400">{game.blocks || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">FG</span>
                    <span className="font-bold text-orange-400">{game.fgMade || 0}/{game.fgAttempts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">FT</span>
                    <span className="font-bold text-pink-400">{game.ftMade || 0}/{game.ftAttempts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">+/-</span>
                    <span className={`font-bold ${(game.plusMinus || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {game.plusMinus > 0 ? '+' : ''}{game.plusMinus || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 