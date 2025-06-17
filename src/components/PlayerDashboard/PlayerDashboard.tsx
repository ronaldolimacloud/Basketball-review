import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Target, Award } from 'lucide-react';
import { PlayerStatsCard } from './PlayerStatsCard';
import { RecentGames } from './RecentGames';
import { TeamsList } from './TeamsList';
import { JoinTeamModal } from './JoinTeamModal';

interface PlayerDashboardProps {
  client: any;
  userId: string;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ client, userId }) => {
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    fetchPlayerData();
  }, [userId]);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);

      // Get player profile
      const playerResponse = await client.models.Player.list({
        filter: { userId: { eq: userId } }
      });
      const player = playerResponse.data[0];
      setPlayerProfile(player);

      if (player) {
        // Get teams the player is part of
        const teamPlayersResponse = await client.models.TeamPlayer.list({
          filter: { 
            playerId: { eq: player.id },
            isActive: { eq: true }
          }
        });
        
        const teamIds = teamPlayersResponse.data.map((tp: any) => tp.teamId);
        const teamsData = [];
        
        for (const teamId of teamIds) {
          const teamResponse = await client.models.Team.get({ id: teamId });
          if (teamResponse.data) {
            teamsData.push(teamResponse.data);
          }
        }
        setTeams(teamsData);

        // Get recent games
        const gamesResponse = await client.models.GameStat.list({
          filter: { playerId: { eq: player.id } }
        });
        
        const recentGameStats = gamesResponse.data
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        
        setRecentGames(recentGameStats);

        // Calculate aggregate stats
        const aggregateStats = calculateAggregateStats(gamesResponse.data);
        setStats(aggregateStats);
      }
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAggregateStats = (gameStats: any[]) => {
    if (gameStats.length === 0) return null;

    const totals = gameStats.reduce((acc, game) => ({
      points: acc.points + (game.points || 0),
      assists: acc.assists + (game.assists || 0),
      rebounds: acc.rebounds + ((game.offRebounds || 0) + (game.defRebounds || 0)),
      steals: acc.steals + (game.steals || 0),
      blocks: acc.blocks + (game.blocks || 0),
      fgMade: acc.fgMade + (game.fgMade || 0),
      fgAttempts: acc.fgAttempts + (game.fgAttempts || 0),
      ftMade: acc.ftMade + (game.ftMade || 0),
      ftAttempts: acc.ftAttempts + (game.ftAttempts || 0),
      minutesPlayed: acc.minutesPlayed + (game.minutesPlayed || 0),
      gamesPlayed: acc.gamesPlayed + 1,
    }), {
      points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0,
      fgMade: 0, fgAttempts: 0, ftMade: 0, ftAttempts: 0,
      minutesPlayed: 0, gamesPlayed: 0
    });

    return {
      ...totals,
      avgPoints: (totals.points / totals.gamesPlayed).toFixed(1),
      avgAssists: (totals.assists / totals.gamesPlayed).toFixed(1),
      avgRebounds: (totals.rebounds / totals.gamesPlayed).toFixed(1),
      fgPercentage: totals.fgAttempts > 0 ? ((totals.fgMade / totals.fgAttempts) * 100).toFixed(1) : '0.0',
      ftPercentage: totals.ftAttempts > 0 ? ((totals.ftMade / totals.ftAttempts) * 100).toFixed(1) : '0.0',
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zinc-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-zinc-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playerProfile) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white p-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="p-8 bg-zinc-800 border border-zinc-700 rounded-xl">
            <Users className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome to Basketball Pro
            </h2>
            <p className="text-zinc-400 mb-6">
              You don't have a player profile yet. Join a team to get started!
            </p>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              Join a Team
            </button>
          </div>
        </div>
        
        <JoinTeamModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onJoinSuccess={fetchPlayerData}
          client={client}
          userId={userId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Welcome back, {playerProfile.name}
            </h1>
            <p className="text-zinc-400">
              {playerProfile.position} • {teams.length} team{teams.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            Join Another Team
          </button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <PlayerStatsCard
              title="Points Per Game"
              value={stats.avgPoints}
              icon={Target}
              color="yellow"
            />
            <PlayerStatsCard
              title="Assists Per Game"
              value={stats.avgAssists}
              icon={Users}
              color="blue"
            />
            <PlayerStatsCard
              title="Rebounds Per Game"
              value={stats.avgRebounds}
              icon={TrendingUp}
              color="green"
            />
            <PlayerStatsCard
              title="FG Percentage"
              value={`${stats.fgPercentage}%`}
              icon={Award}
              color="purple"
            />
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Games */}
          <div className="lg:col-span-2">
            <RecentGames 
              games={recentGames} 
              client={client}
            />
          </div>

          {/* Teams List */}
          <div>
            <TeamsList 
              teams={teams}
              playerProfile={playerProfile}
              client={client}
            />
          </div>
        </div>

        {/* Detailed Stats */}
        {stats && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              Career Statistics
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-white">{stats.gamesPlayed}</div>
                <div className="text-xs text-zinc-400">Games</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-white">{stats.points}</div>
                <div className="text-xs text-zinc-400">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-white">{stats.assists}</div>
                <div className="text-xs text-zinc-400">Total Assists</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-white">{stats.rebounds}</div>
                <div className="text-xs text-zinc-400">Total Rebounds</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-white">{stats.steals}</div>
                <div className="text-xs text-zinc-400">Steals</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-white">{stats.blocks}</div>
                <div className="text-xs text-zinc-400">Blocks</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-white">{stats.ftPercentage}%</div>
                <div className="text-xs text-zinc-400">FT%</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-white">{Math.floor(stats.minutesPlayed / 60)}</div>
                <div className="text-xs text-zinc-400">Total Minutes</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <JoinTeamModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoinSuccess={fetchPlayerData}
        client={client}
        userId={userId}
      />
    </div>
  );
};