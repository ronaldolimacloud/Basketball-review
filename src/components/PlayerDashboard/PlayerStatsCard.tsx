import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PlayerStatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'yellow' | 'blue' | 'green' | 'purple' | 'red';
}

export const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color
}) => {
  const colorClasses = {
    yellow: 'from-yellow-500/10 to-yellow-600/10 border-yellow-500/20 text-yellow-400',
    blue: 'from-blue-500/10 to-blue-600/10 border-blue-500/20 text-blue-400',
    green: 'from-green-500/10 to-green-600/10 border-green-500/20 text-green-400',
    purple: 'from-purple-500/10 to-purple-600/10 border-purple-500/20 text-purple-400',
    red: 'from-red-500/10 to-red-600/10 border-red-500/20 text-red-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-3 sm:p-6`}>
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${colorClasses[color].split(' ')[2]}`} />
        <div className="text-right">
          <div className="text-lg sm:text-2xl font-bold text-white">{value}</div>
        </div>
      </div>
      <div className="text-xs sm:text-sm text-zinc-300">{title}</div>
    </div>
  );
};