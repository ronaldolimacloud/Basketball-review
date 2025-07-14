import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Trophy, Target, TrendingUp, Calendar, Edit2 } from 'lucide-react';
import { api } from '../../services/api';
import type { Player } from '../../types/api.types';

export const PlayerDetailPage: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (playerId) {
      fetchPlayerDetails();
      fetchPlayerStats();
    }
  }, [playerId]);

  const fetchPlayerDetails = async () => {
    try {
      setLoading(true);
      const response = await api.players.getById(playerId!);
      if (response.success) {
        setPlayer(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch player details');
      }
    } catch (error) {
      console.error('Error fetching player:', error);
      setError(`Failed to fetch player: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerStats = async () => {
    try {
      const response = await api.stats.getPlayerStats(playerId!);
      if (response.success) {
        setStats(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-6 text-center">
            <p className="text-red-400">{error || 'Player not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate career averages
  const gamesPlayed = player.totalGamesPlayed || 0;
  const avgPoints = gamesPlayed > 0 ? ((player.careerPoints || 0) / gamesPlayed).toFixed(1) : '0.0';
  const avgAssists = gamesPlayed > 0 ? ((player.careerAssists || 0) / gamesPlayed).toFixed(1) : '0.0';
  const avgRebounds = gamesPlayed > 0 ? ((player.careerRebounds || 0) / gamesPlayed).toFixed(1) : '0.0';
  const fgPercentage = player.careerFgAttempts ? ((player.careerFgMade || 0) / player.careerFgAttempts * 100).toFixed(1) : '0.0';
  const ftPercentage = player.careerFtAttempts ? ((player.careerFtMade || 0) / player.careerFtAttempts * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Players
          </button>
          <button
            onClick={() => navigate(`/players/${playerId}/edit`)}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        </div>

        {/* Player Profile Card */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Profile Image */}
            <div className="w-32 h-32 bg-zinc-700 rounded-full overflow-hidden">
              {player.profileImageUrl ? (
                <img 
                  src={player.profileImageUrl} 
                  alt={player.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/default-player.png';
                  }}
                />
              ) : (
                <img 
                  src="/default-player.png" 
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">{player.name}</h1>
              <div className="flex flex-wrap gap-4 text-zinc-400 mb-4 justify-center md:justify-start">
                {player.position && (
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    Position: {player.position}
                  </span>
                )}
                {player.jerseyNumber && (
                  <span className="flex items-center gap-1">
                    #{player.jerseyNumber}
                  </span>
                )}
                {player.height && (
                  <span className="flex items-center gap-1">
                    Height: {player.height}
                  </span>
                )}
                {player.weight && (
                  <span className="flex items-center gap-1">
                    Weight: {player.weight}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 justify-center md:justify-start">
                <Calendar className="w-4 h-4" />
                <span>Joined: {new Date(player.createdAt || '').toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Career Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Career Totals */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Career Totals
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-zinc-400 text-sm">Games Played</p>
                <p className="text-2xl font-bold text-white">{gamesPlayed}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-zinc-400 text-sm">Total Points</p>
                <p className="text-2xl font-bold text-white">{player.careerPoints || 0}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-zinc-400 text-sm">Total Assists</p>
                <p className="text-2xl font-bold text-white">{player.careerAssists || 0}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-zinc-400 text-sm">Total Rebounds</p>
                <p className="text-2xl font-bold text-white">{player.careerRebounds || 0}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-zinc-400 text-sm">Total Steals</p>
                <p className="text-2xl font-bold text-white">{player.careerSteals || 0}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-zinc-400 text-sm">Total Blocks</p>
                <p className="text-2xl font-bold text-white">{player.careerBlocks || 0}</p>
              </div>
            </div>
          </div>

          {/* Career Averages */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Career Averages
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-zinc-400 text-sm">Points/Game</p>
                <p className="text-2xl font-bold text-white">{avgPoints}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-zinc-400 text-sm">Assists/Game</p>
                <p className="text-2xl font-bold text-white">{avgAssists}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-zinc-400 text-sm">Rebounds/Game</p>
                <p className="text-2xl font-bold text-white">{avgRebounds}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-zinc-400 text-sm">Minutes/Game</p>
                <p className="text-2xl font-bold text-white">
                  {gamesPlayed > 0 ? ((player.careerMinutesPlayed || 0) / gamesPlayed).toFixed(1) : '0.0'}
                </p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-zinc-400 text-sm">FG%</p>
                <p className="text-2xl font-bold text-white">{fgPercentage}%</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4">
                <p className="text-zinc-400 text-sm">FT%</p>
                <p className="text-2xl font-bold text-white">{ftPercentage}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Games */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">Recent Games</h2>
          {stats.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">No game statistics available yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-zinc-400 border-b border-zinc-700">
                    <th className="py-2">Date</th>
                    <th className="py-2">Opponent</th>
                    <th className="py-2 text-center">PTS</th>
                    <th className="py-2 text-center">AST</th>
                    <th className="py-2 text-center">REB</th>
                    <th className="py-2 text-center">STL</th>
                    <th className="py-2 text-center">BLK</th>
                    <th className="py-2 text-center">MIN</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.slice(0, 10).map((stat, index) => (
                    <tr key={index} className="border-b border-zinc-700/50">
                      <td className="py-3">{new Date(stat.gameDate).toLocaleDateString()}</td>
                      <td className="py-3">{stat.opponentName || 'Unknown'}</td>
                      <td className="py-3 text-center font-medium">{stat.points}</td>
                      <td className="py-3 text-center">{stat.assists}</td>
                      <td className="py-3 text-center">{stat.offRebounds + stat.defRebounds}</td>
                      <td className="py-3 text-center">{stat.steals}</td>
                      <td className="py-3 text-center">{stat.blocks}</td>
                      <td className="py-3 text-center">{stat.minutesPlayed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};