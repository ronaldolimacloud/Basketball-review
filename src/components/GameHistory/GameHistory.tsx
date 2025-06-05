import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Users, Clock } from 'lucide-react';
import type { Schema } from '../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';

interface GameHistoryProps {
  client: ReturnType<typeof generateClient<Schema>>;
}

export const GameHistory: React.FC<GameHistoryProps> = ({ client }) => {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { data } = await client.models.Game.list();
      // Sort by date, most recent first
      const sortedGames = (data || []).sort((a, b) => 
        new Date(b.gameDate || b.createdAt).getTime() - new Date(a.gameDate || a.createdAt).getTime()
      );
      setGames(sortedGames);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${remainingMins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading game history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          Game History
        </h2>
        <p className="text-slate-400 mt-1">Review past games and statistics</p>
      </div>

      {/* Games List */}
      {games.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No games found</h3>
          <p className="text-slate-500 mb-4">Start by creating your first game review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-slate-900 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Game Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      {game.homeTeamName} vs {game.awayTeamName}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      game.isCompleted
                        ? 'bg-emerald-900 text-emerald-300'
                        : 'bg-yellow-900 text-yellow-300'
                    }`}>
                      {game.isCompleted ? 'Completed' : 'In Progress'}
                    </span>
                  </div>

                  {/* Game Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(game.gameDate || game.createdAt)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{game.gameFormat === 'quarters' ? '4 Quarters' : '2 Halves'}</span>
                    </div>
                    
                    {game.totalDuration && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Duration: {formatDuration(game.totalDuration)}</span>
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  {game.isCompleted && (
                    <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          <span className="text-yellow-400">{game.homeTeamScore}</span>
                          <span className="text-slate-500 mx-3">-</span>
                          <span className="text-orange-400">{game.awayTeamScore}</span>
                        </div>
                        <div className="text-sm text-slate-400 mt-1">Final Score</div>
                      </div>
                    </div>
                  )}

                  {/* Game Notes */}
                  {game.notes && (
                    <div className="mt-4 p-3 bg-slate-800 rounded border-l-4 border-yellow-400">
                      <p className="text-sm text-slate-300">{game.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-sm transition-colors"
                    onClick={() => {
                      // TODO: Implement view game details
                      console.log('View game details:', game.id);
                    }}
                  >
                    View Details
                  </button>
                  {game.isCompleted && (
                    <button
                      className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1.5 rounded text-sm transition-colors"
                      onClick={() => {
                        // TODO: Implement export/share functionality
                        console.log('Export game:', game.id);
                      }}
                    >
                      Export
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 