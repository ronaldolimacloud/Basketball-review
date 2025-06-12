import React, { useState, useEffect } from 'react';
import { Radio, Eye, Users, Clock, Trophy } from 'lucide-react';
import type { Schema } from '../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { LiveGameFeed } from './LiveGameFeed';

interface LiveGamesProps {
  client: ReturnType<typeof generateClient<Schema>>;
}

interface LiveGame {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamScore: number;
  awayTeamScore: number;
  currentPeriod: string;
  gameTime: string;
  isLive: boolean;
  status: string;
}

export const LiveGames: React.FC<LiveGamesProps> = ({ client }) => {
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveGames();
  }, []);

  const fetchLiveGames = async () => {
    try {
      setLoading(true);
      // Fetch active games from the database
      const result = await client.models.Game.list({
        filter: { isCompleted: { eq: false } }
      });
      
      // Transform the data to match our LiveGame interface
      const games: LiveGame[] = (result.data || []).map(game => ({
        id: game.id,
        homeTeamName: game.homeTeamName,
        awayTeamName: game.awayTeamName,
        homeTeamScore: game.homeTeamScore || 0,
        awayTeamScore: game.awayTeamScore || 0,
        currentPeriod: determinePeriod(game),
        gameTime: '12:00', // You might want to calculate this based on game data
        isLive: !game.isCompleted,
        status: game.isCompleted ? 'Final' : 'Live'
      }));
      
      setLiveGames(games);
    } catch (error) {
      console.error('Error fetching live games:', error);
    } finally {
      setLoading(false);
    }
  };

  const determinePeriod = (game: any) => {
    // This is a simple implementation - you might want to make this more sophisticated
    if (game.gameFormat === 'quarters') {
      return '4th Quarter';
    } else {
      return '2nd Half';
    }
  };

  // If a game is selected, show the live feed
  if (selectedGameId) {
    const selectedGame = liveGames.find(game => game.id === selectedGameId);
    return (
      <LiveGameFeed 
        game={selectedGame!}
        onBack={() => setSelectedGameId(null)}
        client={client}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading live games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-yellow-400 flex items-center gap-3 mb-2">
              <Radio className="w-8 h-8" />
              Live Games Feed
            </h2>
            <p className="text-zinc-300">Follow live basketball games and real-time play-by-play action</p>
            <div className="mt-3 flex items-center gap-6 text-sm text-zinc-400">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                Live Games: {liveGames.filter(g => g.isLive).length}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                Total Games: {liveGames.length}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-emerald-400">LIVE</div>
            <div className="text-sm text-zinc-400">Basketball</div>
          </div>
        </div>
      </div>

      {/* Live Games List */}
      {liveGames.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-16">
            <div className="bg-zinc-900 rounded-full p-8 inline-block mb-6 border border-zinc-700">
              <Radio className="w-16 h-16 text-zinc-600" />
            </div>
            <h3 className="text-2xl font-semibold text-zinc-300 mb-3">No Live Games Available</h3>
            <p className="text-zinc-500 mb-6 max-w-md mx-auto">There are currently no live games in progress. Check back later or start a new game to begin tracking.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {liveGames.map((game) => (
            <div 
              key={game.id} 
              className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700 hover:border-zinc-600 transition-all duration-200 transform hover:scale-[1.01] shadow-lg cursor-pointer group"
              onClick={() => setSelectedGameId(game.id)}
            >
              <div className="flex items-center justify-between">
                
                {/* Left Side - Game Info */}
                <div className="flex items-center gap-6">
                  
                  {/* Live Indicator */}
                  <div className="flex flex-col items-center">
                    {game.isLive ? (
                      <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse mb-1"></div>
                    ) : (
                      <div className="w-4 h-4 bg-red-400 rounded-full mb-1"></div>
                    )}
                    <span className={`text-xs font-bold ${game.isLive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {game.status}
                    </span>
                  </div>

                  {/* Team Names and Score */}
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white uppercase tracking-wide mb-1">
                        {game.homeTeamName}
                      </div>
                      <div className="text-4xl font-black text-emerald-400">
                        {game.homeTeamScore}
                      </div>
                    </div>
                    
                    <div className="text-3xl font-bold text-zinc-400">VS</div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white uppercase tracking-wide mb-1">
                        {game.awayTeamName}
                      </div>
                      <div className="text-4xl font-black text-red-400">
                        {game.awayTeamScore}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Game Status and Action */}
                <div className="flex items-center gap-6">
                  
                  {/* Game Time Info */}
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-zinc-300 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{game.gameTime}</span>
                    </div>
                    <div className="text-sm text-zinc-400">{game.currentPeriod}</div>
                  </div>

                  {/* Watch Button */}
                  <div className="flex items-center gap-3">
                    <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-6 py-3 rounded-xl font-bold text-black transition-all transform group-hover:scale-105 shadow-lg flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Watch Live
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Info Bar */}
              <div className="mt-4 pt-4 border-t border-zinc-700/50 flex items-center justify-between text-sm text-zinc-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Players Active
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    Season Game
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    Click to view play-by-play
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 