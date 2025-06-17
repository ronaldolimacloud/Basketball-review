import React from 'react';
import { Users, Calendar, Star } from 'lucide-react';

interface TeamsListProps {
  teams: any[];
  playerProfile: any;
  client: any;
}

export const TeamsList: React.FC<TeamsListProps> = ({ teams }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-yellow-400" />
        <h3 className="text-xl font-semibold text-white">My Teams</h3>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <p className="text-zinc-400">No teams yet</p>
          <p className="text-sm text-zinc-500">Join a team to start playing</p>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-zinc-700 border border-zinc-600 rounded-lg p-4 hover:bg-zinc-650 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-1">{team.name}</h4>
                  {team.description && (
                    <p className="text-sm text-zinc-400 mb-2">{team.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Joined {formatDate(team.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-400 mb-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs">Active</span>
                  </div>
                </div>
              </div>

              {/* Team Stats Preview */}
              <div className="pt-3 border-t border-zinc-600">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Role: Player</span>
                  <button className="text-yellow-400 hover:text-yellow-300 transition-colors">
                    View Team →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-zinc-700">
        <div className="text-xs text-zinc-400 mb-2">Quick Actions</div>
        <div className="space-y-2">
          <button className="w-full text-left text-sm text-zinc-300 hover:text-white transition-colors">
            📊 View All Stats
          </button>
          <button className="w-full text-left text-sm text-zinc-300 hover:text-white transition-colors">
            🏆 Game History
          </button>
          <button className="w-full text-left text-sm text-zinc-300 hover:text-white transition-colors">
            ⚙️ Profile Settings
          </button>
        </div>
      </div>
    </div>
  );
};