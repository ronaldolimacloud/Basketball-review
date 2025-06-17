import React, { useState, useEffect } from 'react';
import { 
  User, 
  TrendingUp, 
  Calendar, 
  Video, 
  MessageSquare, 
  Target,
  Trophy,
  Clock,
  BarChart3,
  LogOut,
  Star,
  Award,
  Activity
} from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { PlayerImage } from '../PlayerProfiles/PlayerImage';

interface PlayerDashboardProps {
  player: any;
  onLogout: () => void;
}

interface PlayerStats {
  totalGames: number;
  averagePoints: number;
  averageAssists: number;
  averageRebounds: number;
  fieldGoalPercentage: number;
  recentGames: any[];
}

const client = generateClient<Schema>();

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ player, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'videos' | 'feedback'>('overview');
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [playerClips, setPlayerClips] = useState<any[]>([]);
  const [playerFeedback, setPlayerFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerData();
  }, [player.id]);

  const loadPlayerData = async () => {
    try {
      setLoading(true);

      // Load player game stats
      const gameStatsResponse = await client.models.GameStat.list({
        filter: {
          playerId: {
            eq: player.id
          }
        }
      });

      // Load player-specific video clips
      const clipsResponse = await client.models.VideoClip.list({
        filter: {
          visibility: {
            eq: 'player'
          }
        }
      });

      // Filter clips assigned to this player
      const playerSpecificClips = clipsResponse.data?.filter(clip => {
        if (clip.assignedPlayerIds) {
          const assignedIds = typeof clip.assignedPlayerIds === 'string' 
            ? JSON.parse(clip.assignedPlayerIds) 
            : clip.assignedPlayerIds;
          return assignedIds.includes(player.id);
        }
        return false;
      }) || [];

      // Load feedback for this player
      const feedbackResponse = await client.models.ClipFeedback.list({
        filter: {
          playerId: {
            eq: player.id
          }
        }
      });

      // Calculate stats
      if (gameStatsResponse.data) {
        const stats = gameStatsResponse.data;
        const totalGames = stats.length;
        
        const totals = stats.reduce((acc, stat) => ({
          points: acc.points + (stat.points || 0),
          assists: acc.assists + (stat.assists || 0),
          rebounds: acc.rebounds + ((stat.offRebounds || 0) + (stat.defRebounds || 0)),
          fgMade: acc.fgMade + (stat.fgMade || 0),
          fgAttempts: acc.fgAttempts + (stat.fgAttempts || 0)
        }), { points: 0, assists: 0, rebounds: 0, fgMade: 0, fgAttempts: 0 });

        setPlayerStats({
          totalGames,
          averagePoints: totalGames > 0 ? totals.points / totalGames : 0,
          averageAssists: totalGames > 0 ? totals.assists / totalGames : 0,
          averageRebounds: totalGames > 0 ? totals.rebounds / totalGames : 0,
          fieldGoalPercentage: totals.fgAttempts > 0 ? (totals.fgMade / totals.fgAttempts) * 100 : 0,
          recentGames: stats.slice(-5) // Last 5 games
        });
      }

      setPlayerClips(playerSpecificClips);
      setPlayerFeedback(feedbackResponse.data || []);

    } catch (error) {
      console.error('Error loading player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'text-yellow-400' }: any) => (
    <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg bg-opacity-20 ${color.includes('yellow') ? 'bg-yellow-500' : color.includes('blue') ? 'bg-blue-500' : color.includes('green') ? 'bg-green-500' : 'bg-purple-500'}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-zinc-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-zinc-500 text-xs">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'stats', label: 'My Stats', icon: BarChart3 },
    { id: 'videos', label: 'My Videos', icon: Video },
    { id: 'feedback', label: 'Coach Feedback', icon: MessageSquare }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full overflow-hidden flex items-center justify-center">
              <PlayerImage 
                profileImageUrl={player.profileImageUrl}
                className="w-full h-full rounded-full"
                alt={player.name}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{player.name}</h1>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <span>#{player.jerseyNumber || 'N/A'}</span>
                <span>•</span>
                <span>{player.position || 'Position TBD'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last accessed: {player.lastAccessDate ? new Date(player.lastAccessDate).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-zinc-300 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-zinc-800 border-r border-zinc-700 min-h-screen p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                      : 'hover:bg-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-400' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Stats Sidebar */}
          <div className="mt-8 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Season Highlights</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-sm">Games Played</span>
                <span className="text-yellow-400 font-medium">{playerStats?.totalGames || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-sm">Avg Points</span>
                <span className="text-yellow-400 font-medium">{playerStats?.averagePoints.toFixed(1) || '0.0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-sm">Video Clips</span>
                <span className="text-yellow-400 font-medium">{playerClips.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-sm">Feedback</span>
                <span className="text-yellow-400 font-medium">{playerFeedback.length}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back, {player.name}!</h2>
                <p className="text-zinc-400">Here's your basketball progress and recent activity.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Trophy}
                  title="Total Games"
                  value={playerStats?.totalGames || 0}
                  subtitle="This season"
                  color="text-yellow-400"
                />
                <StatCard
                  icon={TrendingUp}
                  title="Avg Points"
                  value={playerStats?.averagePoints.toFixed(1) || '0.0'}
                  subtitle="Per game"
                  color="text-blue-400"
                />
                <StatCard
                  icon={Activity}
                  title="Avg Assists"
                  value={playerStats?.averageAssists.toFixed(1) || '0.0'}
                  subtitle="Per game"
                  color="text-green-400"
                />
                <StatCard
                  icon={Target}
                  title="FG%"
                  value={`${playerStats?.fieldGoalPercentage.toFixed(1) || '0.0'}%`}
                  subtitle="Field goal percentage"
                  color="text-purple-400"
                />
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Videos */}
                <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Video className="w-5 h-5 text-yellow-400" />
                    Recent Videos ({playerClips.length})
                  </h3>
                  {playerClips.length > 0 ? (
                    <div className="space-y-3">
                      {playerClips.slice(0, 3).map((clip, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-zinc-700 rounded-lg">
                          <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <Video className="w-4 h-4 text-yellow-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">{clip.title}</p>
                            <p className="text-zinc-400 text-xs">{clip.playType || 'General'}</p>
                          </div>
                          <div className="text-xs text-zinc-500">
                            {new Date(clip.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-400 text-center py-4">No videos assigned yet</p>
                  )}
                </div>

                {/* Recent Feedback */}
                <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-yellow-400" />
                    Coach Feedback ({playerFeedback.length})
                  </h3>
                  {playerFeedback.length > 0 ? (
                    <div className="space-y-3">
                      {playerFeedback.slice(0, 3).map((feedback, index) => (
                        <div key={index} className="p-3 bg-zinc-700 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-xs text-zinc-400 capitalize">{feedback.feedbackType}</span>
                          </div>
                          <p className="text-white text-sm">{feedback.feedbackText}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-400 text-center py-4">No feedback yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">My Statistics</h2>
              
              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  icon={Trophy}
                  title="Total Points"
                  value={player.careerPoints || 0}
                  subtitle="Career total"
                  color="text-yellow-400"
                />
                <StatCard
                  icon={Award}
                  title="Total Assists"
                  value={player.careerAssists || 0}
                  subtitle="Career total"
                  color="text-blue-400"
                />
                <StatCard
                  icon={TrendingUp}
                  title="Total Rebounds"
                  value={player.careerRebounds || 0}
                  subtitle="Career total"
                  color="text-green-400"
                />
                <StatCard
                  icon={Target}
                  title="Field Goals Made"
                  value={player.careerFgMade || 0}
                  subtitle={`${player.careerFgAttempts || 0} attempts`}
                  color="text-purple-400"
                />
                <StatCard
                  icon={Clock}
                  title="Minutes Played"
                  value={player.careerMinutesPlayed || 0}
                  subtitle="Career total"
                  color="text-orange-400"
                />
                <StatCard
                  icon={Calendar}
                  title="Games Played"
                  value={player.totalGamesPlayed || 0}
                  subtitle="This season"
                  color="text-pink-400"
                />
              </div>

              {/* Recent Games Performance */}
              {playerStats?.recentGames && playerStats.recentGames.length > 0 && (
                <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Games</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-700">
                          <th className="text-left py-2 text-zinc-400">Date</th>
                          <th className="text-center py-2 text-zinc-400">PTS</th>
                          <th className="text-center py-2 text-zinc-400">AST</th>
                          <th className="text-center py-2 text-zinc-400">REB</th>
                          <th className="text-center py-2 text-zinc-400">FG%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerStats.recentGames.map((game, index) => (
                          <tr key={index} className="border-b border-zinc-800">
                            <td className="py-2 text-zinc-300">Game {index + 1}</td>
                            <td className="text-center py-2 text-white">{game.points || 0}</td>
                            <td className="text-center py-2 text-white">{game.assists || 0}</td>
                            <td className="text-center py-2 text-white">{(game.offRebounds || 0) + (game.defRebounds || 0)}</td>
                            <td className="text-center py-2 text-white">
                              {game.fgAttempts > 0 ? ((game.fgMade / game.fgAttempts) * 100).toFixed(1) : '0.0'}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">My Video Clips</h2>
              
              {playerClips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playerClips.map((clip, index) => (
                    <div key={index} className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden hover:border-yellow-500/30 transition-colors">
                      <div className="aspect-video bg-zinc-900 flex items-center justify-center">
                        <Video className="w-12 h-12 text-zinc-600" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-white mb-1">{clip.title}</h3>
                        <p className="text-sm text-zinc-400 mb-2">{clip.description}</p>
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>{clip.playType || 'General'}</span>
                          <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Videos Yet</h3>
                  <p className="text-zinc-400">Your coach hasn't assigned any video clips to you yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Coach Feedback</h2>
              
              {playerFeedback.length > 0 ? (
                <div className="space-y-4">
                  {playerFeedback.map((feedback, index) => (
                    <div key={index} className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-yellow-400 capitalize">{feedback.feedbackType}</span>
                            <span className="text-zinc-500">•</span>
                            <span className="text-xs text-zinc-400">
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-white">{feedback.feedbackText}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Feedback Yet</h3>
                  <p className="text-zinc-400">Your coach hasn't provided any feedback yet.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};