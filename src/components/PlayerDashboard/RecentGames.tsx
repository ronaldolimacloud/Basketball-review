import React, { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface RecentGamesProps {
  games: any[];
  client: any;
}

export const RecentGames: React.FC<RecentGamesProps> = ({ games, client }) => {
  const [gamesWithDetails, setGamesWithDetails] = useState<any[]>([]);

  useEffect(() => {
    fetchGameDetails();
  }, [games]);

  const fetchGameDetails = async () => {
    const detailedGames = [];
    
    for (const gameStat of games) {
      try {
        const gameResponse = await client.models.Game.get({ id: gameStat.gameId });
        if (gameResponse.data) {
          detailedGames.push({
            ...gameStat,
            game: gameResponse.data
          });
        }
      } catch (error) {
        console.error('Error fetching game details:', error);
      }
    }
    
    setGamesWithDetails(detailedGames);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMinutes = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-yellow-400" />
        <h3 className="text-xl font-semibold text-white">Recent Games</h3>
      </div>

      {gamesWithDetails.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <p className="text-zinc-400">No games played yet</p>
          <p className="text-sm text-zinc-500">Your game history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {gamesWithDetails.map((gameStat) => (
            <div
              key={gameStat.id}
              className="bg-zinc-700 border border-zinc-600 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-white">
                    {gameStat.game.homeTeamName} vs {gameStat.game.awayTeamName}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(gameStat.game.gameDate || gameStat.game.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatMinutes(gameStat.minutesPlayed || 0)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-400">
                    {gameStat.points} PTS
                  </div>
                  <div className="text-xs text-zinc-400">
                    {gameStat.fgMade}/{gameStat.fgAttempts} FG
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-sm font-medium text-white">
                    {(gameStat.offRebounds || 0) + (gameStat.defRebounds || 0)}
                  </div>
                  <div className="text-xs text-zinc-400">REB</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    {gameStat.assists || 0}
                  </div>
                  <div className="text-xs text-zinc-400">AST</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    {gameStat.steals || 0}
                  </div>
                  <div className="text-xs text-zinc-400">STL</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    {gameStat.blocks || 0}
                  </div>
                  <div className="text-xs text-zinc-400">BLK</div>
                </div>
              </div>

              {/* Performance Indicator */}
              <div className="mt-3 pt-3 border-t border-zinc-600">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Performance</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      (gameStat.points || 0) >= 10 ? 'bg-green-400' : 
                      (gameStat.points || 0) >= 5 ? 'bg-yellow-400' : 'bg-zinc-400'
                    }`}></div>
                    <span className="text-zinc-400">
                      {(gameStat.points || 0) >= 10 ? 'Great' : 
                       (gameStat.points || 0) >= 5 ? 'Good' : 'Average'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};