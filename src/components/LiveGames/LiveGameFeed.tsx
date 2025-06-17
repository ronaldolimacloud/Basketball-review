import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, Trophy, Target } from 'lucide-react';
import type { Schema } from '../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';

interface LiveGameFeedProps {
  game: {
    id: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamScore: number;
    awayTeamScore: number;
    currentPeriod: string;
    gameTime: string;
    isLive: boolean;
    status: string;
  };
  onBack: () => void;
  client: ReturnType<typeof generateClient<Schema>>;
}

interface GameEvent {
  id: string;
  timestamp: string;
  period: string;
  teamName: string;
  playerName: string;
  playerNumber: string;
  actionType: 'PTS' | 'Foul' | 'AST' | 'REB' | 'STL' | 'BLK' | 'TO';
  actionDetail: string;
  points?: number;
  teamScore: number;
  opponentScore: number;
  isHomeTeam: boolean;
}

interface PlayerStats {
  name: string;
  number: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fouls: number;
  fieldGoals: string;
  freeThrows: string;
  turnovers: number;
}

export const LiveGameFeed: React.FC<LiveGameFeedProps> = ({ game, onBack, client }) => {
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [boxScore, setBoxScore] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'summary' | 'statistics' | 'play-by-play'>('play-by-play');

  useEffect(() => {
    fetchGameEvents();
    fetchBoxScore();
  }, [game.id]);

  const fetchGameEvents = async () => {
    try {
      // Fetch game stats to create play-by-play events
      const gameStatsResult = await client.models.GameStat.list({
        filter: { gameId: { eq: game.id } }
      });

      const events: GameEvent[] = [];
      
             // Create sample events based on game stats
       (gameStatsResult.data || []).forEach((stat, index) => {
         // Add points events
         if ((stat.points || 0) > 0) {
           // const pointsPerEvent = (stat.points || 0) / Math.max(1, (stat.fgMade || 0) + (stat.ftMade || 0));
           for (let i = 0; i < (stat.fgMade || 0); i++) {
            events.push({
              id: `${stat.id}-fg-${i}`,
              timestamp: `${Math.floor(Math.random() * 12)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
              period: '2nd Half',
              teamName: game.homeTeamName,
              playerName: `Player ${index + 1}`,
              playerNumber: String(index + 1),
              actionType: 'PTS',
              actionDetail: '2PT',
              points: 2,
              teamScore: game.homeTeamScore,
              opponentScore: game.awayTeamScore,
              isHomeTeam: true
            });
          }
        }
        
                 // Add foul events
         if ((stat.fouls || 0) > 0) {
          events.push({
            id: `${stat.id}-foul`,
            timestamp: `${Math.floor(Math.random() * 12)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            period: '2nd Half',
            teamName: game.homeTeamName,
            playerName: `Player ${index + 1}`,
            playerNumber: String(index + 1),
            actionType: 'Foul',
            actionDetail: 'Personal Foul',
            teamScore: game.homeTeamScore,
            opponentScore: game.awayTeamScore,
            isHomeTeam: true
          });
        }
      });

      // Sort events by timestamp (most recent first)
      events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setGameEvents(events);
    } catch (error) {
      console.error('Error fetching game events:', error);
    }
  };

  const fetchBoxScore = async () => {
    try {
      // Fetch player stats for box score
      const gameStatsResult = await client.models.GameStat.list({
        filter: { gameId: { eq: game.id } }
      });

      const players: PlayerStats[] = await Promise.all(
        (gameStatsResult.data || []).map(async (stat, index) => {
          try {
            const playerResult = await client.models.Player.get({ id: stat.playerId });
            const player = playerResult.data;
            
            return {
              name: player?.name || `Player ${index + 1}`,
              number: String(index + 1),
              minutes: Math.floor((stat.minutesPlayed || 0) / 60),
              points: stat.points || 0,
              rebounds: (stat.offRebounds || 0) + (stat.defRebounds || 0),
              assists: stat.assists || 0,
              steals: stat.steals || 0,
              blocks: stat.blocks || 0,
              fouls: stat.fouls || 0,
              fieldGoals: `${stat.fgMade || 0}/${stat.fgAttempts || 0}`,
              freeThrows: `${stat.ftMade || 0}/${stat.ftAttempts || 0}`,
              turnovers: stat.turnovers || 0
            };
          } catch (error) {
            return {
              name: `Player ${index + 1}`,
              number: String(index + 1),
              minutes: 0,
              points: 0,
              rebounds: 0,
              assists: 0,
              steals: 0,
              blocks: 0,
              fouls: 0,
              fieldGoals: '0/0',
              freeThrows: '0/0',
              turnovers: 0
            };
          }
        })
      );

      setBoxScore(players);
    } catch (error) {
      console.error('Error fetching box score:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'PTS':
        return 'bg-cyan-500 text-white';
      case 'Foul':
        return 'bg-zinc-700 text-zinc-300';
      case 'AST':
        return 'bg-blue-500 text-white';
      case 'REB':
        return 'bg-purple-500 text-white';
      case 'STL':
        return 'bg-green-500 text-white';
      case 'BLK':
        return 'bg-red-500 text-white';
      default:
        return 'bg-zinc-600 text-zinc-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header with Score */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg font-medium">Back</span>
          </button>
          
          <div className="text-right">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold">LIVE</span>
            </div>
          </div>
        </div>

        {/* Score Display */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-6 mb-2">
            <div className="text-4xl font-bold text-zinc-400">{game.homeTeamScore}</div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{game.homeTeamName.substring(0, 3).toUpperCase()}</span>
              </div>
              <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{game.awayTeamName.substring(0, 3).toUpperCase()}</span>
              </div>
            </div>
            <div className="text-4xl font-bold text-zinc-400">{game.awayTeamScore}</div>
          </div>
          <div className="text-zinc-400 text-sm">{game.homeTeamName} vs {game.awayTeamName}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700">
        <div className="flex border-b border-zinc-700">
          {[
            { id: 'summary', label: 'Summary' },
            { id: 'statistics', label: 'Statistics' },
            { id: 'play-by-play', label: 'Play-by-play' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-zinc-800/50'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {selectedTab === 'play-by-play' && (
            <div className="space-y-6">
              {/* Period Header */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Play-by-play</h3>
                <h4 className="text-xl font-semibold text-zinc-300 mb-4">{game.currentPeriod}</h4>
              </div>

              {/* Play-by-play Events */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {gameEvents.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No game events available</p>
                  </div>
                ) : (
                  gameEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                      {/* Timestamp */}
                      <div className="text-sm font-mono text-zinc-400 w-16">
                        {event.timestamp}
                      </div>

                      {/* Team Logo */}
                      <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {event.teamName.substring(0, 3).toUpperCase()}
                        </span>
                      </div>

                      {/* Action Badge */}
                      <div className={`px-3 py-1 rounded-full text-sm font-bold flex-shrink-0 ${getActionBadgeColor(event.actionType)}`}>
                        {event.actionType === 'PTS' ? event.actionDetail : event.actionType}
                      </div>

                      {/* Event Description */}
                      <div className="flex-1">
                        <div className="text-white font-medium">{event.teamName}</div>
                        <div className="text-sm text-zinc-400">
                          {event.playerNumber}. {event.playerName}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right text-zinc-400 font-mono">
                        {event.teamScore} - {event.opponentScore}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {selectedTab === 'statistics' && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Team Statistics</h3>
              <div className="text-center py-8 text-zinc-400">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Detailed statistics coming soon</p>
              </div>
            </div>
          )}

          {selectedTab === 'summary' && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Game Summary</h3>
              <div className="text-center py-8 text-zinc-400">
                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Game summary coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Box Score */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Box Score
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-2 text-zinc-400 font-medium">Player</th>
                <th className="text-center py-2 text-zinc-400 font-medium w-12">MIN</th>
                <th className="text-center py-2 text-zinc-400 font-medium w-12">PTS</th>
                <th className="text-center py-2 text-zinc-400 font-medium w-12">REB</th>
                <th className="text-center py-2 text-zinc-400 font-medium w-12">AST</th>
                <th className="text-center py-2 text-zinc-400 font-medium w-12">STL</th>
                <th className="text-center py-2 text-zinc-400 font-medium w-12">BLK</th>
                <th className="text-center py-2 text-zinc-400 font-medium w-12">FLS</th>
                <th className="text-center py-2 text-zinc-400 font-medium w-16">FG</th>
                <th className="text-center py-2 text-zinc-400 font-medium w-16">FT</th>
                <th className="text-center py-2 text-zinc-400 font-medium w-12">TO</th>
              </tr>
            </thead>
            <tbody>
              {boxScore.map((player, index) => (
                <tr key={index} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-3 text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">#{player.number}</span>
                      <span>{player.name}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 text-zinc-300">{player.minutes}</td>
                  <td className="text-center py-3 text-emerald-400 font-bold">{player.points}</td>
                  <td className="text-center py-3 text-zinc-300">{player.rebounds}</td>
                  <td className="text-center py-3 text-blue-400">{player.assists}</td>
                  <td className="text-center py-3 text-green-400">{player.steals}</td>
                  <td className="text-center py-3 text-red-400">{player.blocks}</td>
                  <td className="text-center py-3 text-orange-400">{player.fouls}</td>
                  <td className="text-center py-3 text-zinc-300 font-mono text-xs">{player.fieldGoals}</td>
                  <td className="text-center py-3 text-zinc-300 font-mono text-xs">{player.freeThrows}</td>
                  <td className="text-center py-3 text-zinc-300">{player.turnovers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 