import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Trophy, 
  MessageSquare, 
  Target,
  Calendar,
  Award,
  Activity,
  Zap,
  Brain,
  PieChart
} from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { TeamAnalyticsChat } from './TeamAnalyticsChat';
import { BedrockService } from '../../services/bedrockService';

interface AnalyticsDashboardProps {
  client: ReturnType<typeof generateClient<Schema>>;
}

interface TeamMetrics {
  totalPlayers: number;
  totalGames: number;
  averageTeamScore: number;
  topScorer: { name: string; points: number } | null;
  topAssister: { name: string; assists: number } | null;
  totalVideoClips: number;
  activePlayers: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ client }) => {
  const [activeView, setActiveView] = useState<'overview' | 'chat' | 'insights'>('overview');
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameInsights, setGameInsights] = useState<string>('');
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const bedrockService = BedrockService.getInstance();

  useEffect(() => {
    loadTeamMetrics();
  }, []);

  const loadTeamMetrics = async () => {
    try {
      setLoading(true);
      
      const [playersResponse, gamesResponse, , clipsResponse] = await Promise.all([
        client.models.Player.list(),
        client.models.Game.list(),
        client.models.GameStat.list(),
        client.models.VideoClip.list()
      ]);

      const players = playersResponse.data || [];
      const games = gamesResponse.data || [];
      const clips = clipsResponse.data || [];

      // Calculate top performers
      const playersWithStats = players.map(player => ({
        ...player,
        totalPoints: player.careerPoints || 0,
        totalAssists: player.careerAssists || 0
      }));

      const topScorer = playersWithStats.reduce((top, player) => 
        player.totalPoints > (top?.totalPoints || 0) ? player : top
      , null as any);

      const topAssister = playersWithStats.reduce((top, player) => 
        player.totalAssists > (top?.totalAssists || 0) ? player : top
      , null as any);

      const averageScore = games.length > 0 
        ? games.reduce((sum, game) => sum + (game.homeTeamScore || 0), 0) / games.length 
        : 0;

      const metrics: TeamMetrics = {
        totalPlayers: players.length,
        totalGames: games.length,
        averageTeamScore: averageScore,
        topScorer: topScorer ? { name: topScorer.name, points: topScorer.totalPoints } : null,
        topAssister: topAssister ? { name: topAssister.name, assists: topAssister.totalAssists } : null,
        totalVideoClips: clips.length,
        activePlayers: players.filter(p => p.isActive).length
      };

      setTeamMetrics(metrics);
    } catch (error) {
      console.error('Error loading team metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTeamInsights = async () => {
    if (!teamMetrics) return;

    setGeneratingInsights(true);
    try {
      // Get recent game for insights
      const recentGamesResponse = await client.models.Game.list();
      if (recentGamesResponse.data && recentGamesResponse.data.length > 0) {
        const mostRecentGame = recentGamesResponse.data
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        
        const insights = await bedrockService.generateGameInsights(mostRecentGame.id);
        setGameInsights(insights);
      } else {
        const playersResponse = await client.models.Player.list();
        const gamesResponse = await client.models.Game.list();
        const gameStatsResponse = await client.models.GameStat.list();

        const context = {
          players: playersResponse.data || [],
          games: gamesResponse.data || [],
          gameStats: gameStatsResponse.data || [],
          teamName: 'Your Team',
          totalGames: teamMetrics.totalGames,
          averageTeamScore: teamMetrics.averageTeamScore
        };

        const insights = await bedrockService.analyzeTeamPerformance(context, "Give me a comprehensive team analysis");
        setGameInsights(insights);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      setGameInsights('Unable to generate insights at this time. Please try again later.');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const MetricCard = ({ icon: Icon, title, value, subtitle, color = 'text-yellow-400' }: any) => (
    <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 hover:border-zinc-600 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg bg-opacity-20 ${color.includes('yellow') ? 'bg-yellow-500' : color.includes('blue') ? 'bg-blue-500' : color.includes('green') ? 'bg-green-500' : color.includes('purple') ? 'bg-purple-500' : 'bg-red-500'}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div className="flex-1">
          <p className="text-zinc-400 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${color} mb-1`}>{value}</p>
          {subtitle && <p className="text-zinc-500 text-xs">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Brain className="w-7 h-7 text-yellow-400" />
            Team Analytics & AI Insights
          </h2>
          <p className="text-zinc-400 mt-1">AI-powered performance analysis and coaching recommendations</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1 border border-zinc-700">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'overview'
                ? 'bg-yellow-500 text-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveView('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'chat'
                ? 'bg-yellow-500 text-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            AI Chat
          </button>
          <button
            onClick={() => setActiveView('insights')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'insights'
                ? 'bg-yellow-500 text-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Insights
          </button>
        </div>
      </div>

      {activeView === 'overview' && teamMetrics && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={Users}
              title="Total Players"
              value={teamMetrics.totalPlayers}
              subtitle={`${teamMetrics.activePlayers} active`}
              color="text-blue-400"
            />
            <MetricCard
              icon={Trophy}
              title="Games Played"
              value={teamMetrics.totalGames}
              subtitle="This season"
              color="text-yellow-400"
            />
            <MetricCard
              icon={TrendingUp}
              title="Avg Team Score"
              value={teamMetrics.averageTeamScore.toFixed(1)}
              subtitle="Points per game"
              color="text-green-400"
            />
            <MetricCard
              icon={Activity}
              title="Video Clips"
              value={teamMetrics.totalVideoClips}
              subtitle="Analysis content"
              color="text-purple-400"
            />
          </div>

          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Top Performers
              </h3>
              
              <div className="space-y-4">
                {teamMetrics.topScorer && (
                  <div className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{teamMetrics.topScorer.name}</p>
                      <p className="text-zinc-400 text-sm">Leading Scorer</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 text-lg font-bold">{teamMetrics.topScorer.points}</p>
                      <p className="text-zinc-500 text-xs">Career Points</p>
                    </div>
                  </div>
                )}
                
                {teamMetrics.topAssister && (
                  <div className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{teamMetrics.topAssister.name}</p>
                      <p className="text-zinc-400 text-sm">Top Playmaker</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-400 text-lg font-bold">{teamMetrics.topAssister.assists}</p>
                      <p className="text-zinc-500 text-xs">Career Assists</p>
                    </div>
                  </div>
                )}

                {(!teamMetrics.topScorer && !teamMetrics.topAssister) && (
                  <div className="text-center py-8 text-zinc-500">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No performance data yet</p>
                    <p className="text-sm">Stats will appear after games are played</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-green-400" />
                Quick Analysis
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-zinc-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white text-sm font-medium">Team Depth</span>
                  </div>
                  <p className="text-zinc-400 text-xs">
                    {teamMetrics.activePlayers} active players provide good rotation options
                  </p>
                </div>
                
                <div className="p-3 bg-zinc-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-white text-sm font-medium">Experience Level</span>
                  </div>
                  <p className="text-zinc-400 text-xs">
                    {teamMetrics.totalGames} games played - building experience
                  </p>
                </div>
                
                <div className="p-3 bg-zinc-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-white text-sm font-medium">Video Analysis</span>
                  </div>
                  <p className="text-zinc-400 text-xs">
                    {teamMetrics.totalVideoClips} clips for detailed performance review
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Get AI-Powered Insights</h3>
                <p className="text-zinc-300">
                  Chat with our AI assistant to get personalized coaching recommendations, 
                  performance analysis, and strategic insights based on your team's data.
                </p>
              </div>
              <button
                onClick={() => setActiveView('chat')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {activeView === 'chat' && (
        <div className="h-[800px]">
          <TeamAnalyticsChat client={client} />
        </div>
      )}

      {activeView === 'insights' && (
        <div className="space-y-6">
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                AI-Generated Team Insights
              </h3>
              <button
                onClick={generateTeamInsights}
                disabled={generatingInsights}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-zinc-600 text-black disabled:text-zinc-400 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {generatingInsights ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Generate Insights
                  </>
                )}
              </button>
            </div>

            {gameInsights ? (
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-600">
                <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed">
                  {gameInsights}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h4 className="text-lg font-medium text-white mb-2">No Insights Generated Yet</h4>
                <p className="mb-4">Click "Generate Insights" to get AI-powered analysis of your team's performance</p>
                <button
                  onClick={generateTeamInsights}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Insight Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
              <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Performance Trends
              </h4>
              <p className="text-zinc-400 text-sm">Track your team's progress over time and identify improvement patterns</p>
            </div>

            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
              <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                Areas to Focus
              </h4>
              <p className="text-zinc-400 text-sm">Get specific recommendations on skills and strategies to work on</p>
            </div>

            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
              <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                Game Analysis
              </h4>
              <p className="text-zinc-400 text-sm">Detailed breakdowns of recent games with actionable insights</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};