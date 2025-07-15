import React from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import type { PeriodScore, GameFormat } from '../../types/game.types';

interface GameSummaryProps {
  periodScores: PeriodScore[];
  currentPeriod: number;
  teamName: string;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
  gameFormat: GameFormat;
}

export const GameSummary: React.FC<GameSummaryProps> = ({
  periodScores,
  currentPeriod,
  teamName,
  opponentName,
  teamScore,
  opponentScore,
  gameFormat
}) => {
  const maxPeriods = gameFormat === 'quarters' ? 4 : 2;
  const periodLabel = gameFormat === 'quarters' ? 'Q' : 'H';

  // Create array with all periods (including future ones)
  const allPeriods = Array.from({ length: maxPeriods }, (_, i) => {
    const periodNum = i + 1;
    const periodData = periodScores.find(ps => ps.period === periodNum);
    
    if (periodNum === currentPeriod && !periodData) {
      // Current period in progress - use current scores
      const previousPeriodTotal = periodScores
        .filter(ps => ps.period < periodNum)
        .reduce((sum, ps) => sum + ps.teamScore, 0);
      const previousOpponentTotal = periodScores
        .filter(ps => ps.period < periodNum)
        .reduce((sum, ps) => sum + ps.opponentScore, 0);
      
      return {
        period: periodNum,
        teamScore: teamScore - previousPeriodTotal,
        opponentScore: opponentScore - previousOpponentTotal,
        isCompleted: false,
        isCurrent: true
      };
    }
    
    return {
      period: periodNum,
      teamScore: periodData?.teamScore || 0,
      opponentScore: periodData?.opponentScore || 0,
      isCompleted: periodNum < currentPeriod,
      isCurrent: false
    };
  });

  const getScoreDifference = (teamScore: number, opponentScore: number) => {
    const diff = teamScore - opponentScore;
    if (diff > 0) return `+${diff}`;
    if (diff < 0) return `${diff}`;
    return '0';
  };

  const getScoreColor = (teamScore: number, opponentScore: number) => {
    if (teamScore > opponentScore) return 'text-emerald-400';
    if (teamScore < opponentScore) return 'text-red-400';
    return 'text-zinc-400';
  };

  return (
    <div className="space-y-6">
      {/* Overall Game Summary */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Game Summary
          </h3>
          <div className="text-sm text-zinc-400">
            {currentPeriod > maxPeriods ? 'Game Complete' : `${periodLabel}${currentPeriod} in Progress`}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-sm text-zinc-400 mb-2">{teamName}</div>
            <div className="text-4xl font-bold text-emerald-400">{teamScore}</div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-2xl text-zinc-500">vs</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-zinc-400 mb-2">{opponentName}</div>
            <div className="text-4xl font-bold text-red-400">{opponentScore}</div>
          </div>
        </div>

        <div className="text-center">
          <div className={`text-lg font-medium ${getScoreColor(teamScore, opponentScore)}`}>
            {teamScore > opponentScore && `${teamName} leads by ${teamScore - opponentScore}`}
            {teamScore < opponentScore && `${opponentName} leads by ${opponentScore - teamScore}`}
            {teamScore === opponentScore && 'Tied Game'}
          </div>
        </div>
      </div>

      {/* Period Breakdown */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6">
        <h4 className="text-md font-semibold text-yellow-400 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Period Breakdown
        </h4>

        <div className="space-y-4">
          {/* Period Headers */}
          <div className="grid grid-cols-[2fr,repeat(5,1fr)] gap-2 text-sm">
            <div className="text-zinc-400">Team</div>
            {allPeriods.map((period) => (
              <div key={period.period} className="text-center">
                <span className={`
                  ${period.isCurrent ? 'text-yellow-400 font-semibold' : 'text-zinc-400'}
                  ${!period.isCompleted && !period.isCurrent ? 'opacity-50' : ''}
                `}>
                  {periodLabel}{period.period}
                </span>
              </div>
            ))}
            <div className="text-center text-zinc-400 font-semibold">Total</div>
          </div>

          {/* Team Scores */}
          <div className="grid grid-cols-[2fr,repeat(5,1fr)] gap-2 items-center">
            <div className="font-medium text-emerald-400">{teamName}</div>
            {allPeriods.map((period) => (
              <div key={`team-${period.period}`} className="text-center">
                <span className={`
                  ${period.isCompleted || period.isCurrent ? 'text-white' : 'text-zinc-600'}
                  ${period.isCurrent ? 'font-semibold' : ''}
                `}>
                  {period.isCompleted || period.isCurrent ? period.teamScore : '-'}
                </span>
              </div>
            ))}
            <div className="text-center font-bold text-emerald-400">{teamScore}</div>
          </div>

          {/* Opponent Scores */}
          <div className="grid grid-cols-[2fr,repeat(5,1fr)] gap-2 items-center">
            <div className="font-medium text-red-400">{opponentName}</div>
            {allPeriods.map((period) => (
              <div key={`opp-${period.period}`} className="text-center">
                <span className={`
                  ${period.isCompleted || period.isCurrent ? 'text-white' : 'text-zinc-600'}
                  ${period.isCurrent ? 'font-semibold' : ''}
                `}>
                  {period.isCompleted || period.isCurrent ? period.opponentScore : '-'}
                </span>
              </div>
            ))}
            <div className="text-center font-bold text-red-400">{opponentScore}</div>
          </div>

          {/* Period Differences */}
          <div className="grid grid-cols-[2fr,repeat(5,1fr)] gap-2 items-center pt-2 border-t border-zinc-700">
            <div className="text-sm text-zinc-400">Margin</div>
            {allPeriods.map((period) => (
              <div key={`diff-${period.period}`} className="text-center">
                {(period.isCompleted || period.isCurrent) && (
                  <span className={`text-sm font-medium ${getScoreColor(period.teamScore, period.opponentScore)}`}>
                    {getScoreDifference(period.teamScore, period.opponentScore)}
                  </span>
                )}
                {!period.isCompleted && !period.isCurrent && (
                  <span className="text-sm text-zinc-600">-</span>
                )}
              </div>
            ))}
            <div className="text-center">
              <span className={`text-sm font-bold ${getScoreColor(teamScore, opponentScore)}`}>
                {getScoreDifference(teamScore, opponentScore)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Trends */}
      {periodScores.length > 0 && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6">
          <h4 className="text-md font-semibold text-yellow-400 mb-4">Game Trends</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-zinc-400 mb-2">Highest Scoring {periodLabel}</div>
              <div className="text-lg">
                {(() => {
                  const highestScoringPeriod = periodScores.reduce((max, period) => 
                    (period.teamScore + period.opponentScore) > (max.teamScore + max.opponentScore) ? period : max
                  , periodScores[0]);
                  return `${periodLabel}${highestScoringPeriod.period} (${highestScoringPeriod.teamScore + highestScoringPeriod.opponentScore} pts)`;
                })()}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-zinc-400 mb-2">Best {periodLabel} for {teamName}</div>
              <div className="text-lg">
                {(() => {
                  const bestPeriod = periodScores.reduce((max, period) => 
                    period.teamScore > max.teamScore ? period : max
                  , periodScores[0]);
                  return `${periodLabel}${bestPeriod.period} (${bestPeriod.teamScore} pts)`;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};