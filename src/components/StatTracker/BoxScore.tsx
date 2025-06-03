import React from 'react';
import { Award } from 'lucide-react';
import type { Player } from '../../types/game.types';
import { calculateFGPercentage, calculateFTPercentage, calculateTotalRebounds } from '../../utils/statCalculations';
import { formatTime } from '../../utils/timeFormatters';

interface BoxScoreProps {
  players: Player[];
  teamName: string;
}

export const BoxScore: React.FC<BoxScoreProps> = ({ players, teamName }) => {
  return (
    <div className="mt-6 bg-slate-900 rounded-lg p-4 border border-slate-700">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-yellow-400">
        <Award className="w-5 h-5" />
        {teamName} Box Score
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-600">
              <th className="text-left py-2 text-slate-300">Player</th>
              <th className="text-center px-2 text-slate-300">MIN</th>
              <th className="text-center px-2 text-slate-300">PTS</th>
              <th className="text-center px-2 text-slate-300">FG</th>
              <th className="text-center px-2 text-slate-300">FG%</th>
              <th className="text-center px-2 text-slate-300">FT</th>
              <th className="text-center px-2 text-slate-300">FT%</th>
              <th className="text-center px-2 text-slate-300">REB</th>
              <th className="text-center px-2 text-slate-300">AST</th>
              <th className="text-center px-2 text-slate-300">STL</th>
              <th className="text-center px-2 text-slate-300">BLK</th>
              <th className="text-center px-2 text-slate-300">TO</th>
              <th className="text-center px-2 text-slate-300">PF</th>
              <th className="text-center px-2 text-slate-300">+/-</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr key={player.id} className="border-b border-slate-700 hover:bg-slate-800">
                <td className="py-2 text-white font-medium">
                  {player.name}
                  {player.onCourt && (
                    <span className="ml-2 text-xs bg-emerald-600 px-1 rounded">ON</span>
                  )}
                </td>
                <td className="text-center text-slate-300">{formatTime(player.stats.timeOnCourt)}</td>
                <td className="text-center font-semibold text-yellow-400">{player.stats.points}</td>
                <td className="text-center text-slate-300">{player.stats.fgMade}/{player.stats.fgAttempts}</td>
                <td className="text-center text-slate-300">{calculateFGPercentage(player.stats.fgMade, player.stats.fgAttempts)}%</td>
                <td className="text-center text-slate-300">{player.stats.ftMade}/{player.stats.ftAttempts}</td>
                <td className="text-center text-slate-300">{calculateFTPercentage(player.stats.ftMade, player.stats.ftAttempts)}%</td>
                <td className="text-center text-slate-300">{calculateTotalRebounds(player.stats.offRebounds, player.stats.defRebounds)}</td>
                <td className="text-center text-slate-300">{player.stats.assists}</td>
                <td className="text-center text-slate-300">{player.stats.steals}</td>
                <td className="text-center text-slate-300">{player.stats.blocks}</td>
                <td className="text-center text-slate-300">{player.stats.turnovers}</td>
                <td className="text-center text-slate-300">{player.stats.fouls}</td>
                <td className={`text-center font-semibold ${player.stats.plusMinus >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {player.stats.plusMinus > 0 ? '+' : ''}{player.stats.plusMinus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Team Totals */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-slate-400">Total Points</div>
            <div className="text-xl font-bold text-yellow-400">
              {players.reduce((sum, p) => sum + p.stats.points, 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">Total Fouls</div>
            <div className="text-xl font-bold text-amber-400">
              {players.reduce((sum, p) => sum + p.stats.fouls, 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">Total Assists</div>
            <div className="text-xl font-bold text-cyan-400">
              {players.reduce((sum, p) => sum + p.stats.assists, 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">Total Rebounds</div>
            <div className="text-xl font-bold text-purple-400">
              {players.reduce((sum, p) => sum + calculateTotalRebounds(p.stats.offRebounds, p.stats.defRebounds), 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 