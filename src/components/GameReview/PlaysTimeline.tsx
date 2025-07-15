import React from 'react';
import { Clock, Activity } from 'lucide-react';
import type { GameEvent } from '../../hooks/useGameEvents';

interface PlaysTimelineProps {
  events: GameEvent[];
  teamName: string;
  opponentName: string;
}

export const PlaysTimeline: React.FC<PlaysTimelineProps> = ({ events, teamName, opponentName }) => {
  const formatGameTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'SCORE':
      case 'FREE_THROW_MADE':
        return '🏀';
      case 'FOUL':
        return '🛑';
      case 'REBOUND':
        return '🔄';
      case 'ASSIST':
        return '🤝';
      case 'STEAL':
        return '🏃';
      case 'BLOCK':
        return '🚫';
      case 'TURNOVER':
        return '❌';
      case 'TIMEOUT':
        return '⏸️';
      case 'SUBSTITUTION':
        return '🔄';
      case 'PERIOD_END':
        return '⏱️';
      case 'GAME_START':
        return '🎯';
      case 'FREE_THROW_MISSED':
      case 'FIELD_GOAL_MISSED':
        return '❌';
      default:
        return '•';
    }
  };

  const getEventColor = (teamName: string, currentTeam: string) => {
    return teamName === currentTeam ? 'text-emerald-400' : 'text-red-400';
  };

  if (events.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-8">
        <div className="text-center text-zinc-400">
          <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No plays recorded yet</p>
          <p className="text-sm mt-2">Game events will appear here as they happen</p>
        </div>
      </div>
    );
  }

  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Play-by-Play
        </h3>
        <div className="text-sm text-zinc-400">
          {events.length} plays recorded
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {sortedEvents.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
          >
            <div className="text-2xl flex-shrink-0">
              {getEventIcon(event.eventType)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className={`font-medium ${getEventColor(teamName, event.teamName)}`}>
                    {event.teamName}
                  </p>
                  <p className="text-white mt-1">
                    {event.description}
                  </p>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <div className="text-sm text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatGameTime(event.gameTime)}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Q{event.period}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-emerald-400">
                  {teamName}: {event.homeScore}
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-red-400">
                  {opponentName}: {event.awayScore}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};