import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Trash2, Edit3 } from 'lucide-react';
import type { Player } from '../../types/game.types';
import { calculateFGPercentage, calculateFTPercentage, calculateTotalRebounds } from '../../utils/statCalculations';
import { formatTime } from '../../utils/timeFormatters';

interface BoxScoreWithNavigationProps {
  players: Player[];
  teamName: string;
  onEditPlayerStats?: (player: Player) => void;
  onDeletePlayerStats?: (player: Player) => void;
}

export const BoxScoreWithNavigation: React.FC<BoxScoreWithNavigationProps> = ({ 
  players, 
  teamName, 
  onEditPlayerStats, 
  onDeletePlayerStats 
}) => {
  const navigate = useNavigate();

  const handlePlayerClick = (playerId: string | number) => {
    // Convert number ID to string if needed
    const id = typeof playerId === 'number' ? playerId.toString() : playerId;
    navigate(`/players/${id}`);
  };

  return (
    <div className="mt-6 bg-zinc-900 rounded-lg p-4 border border-zinc-700">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-yellow-400">
        <Award className="w-5 h-5" />
        {teamName} Box Score
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-600">
              <th className="text-left py-2 text-zinc-300">Player</th>
              <th className="text-center px-2 text-zinc-300">MIN</th>
              <th className="text-center px-2 text-zinc-300">PTS</th>
              <th className="text-center px-2 text-zinc-300">FG</th>
              <th className="text-center px-2 text-zinc-300">FG%</th>
              <th className="text-center px-2 text-zinc-300">FT</th>
              <th className="text-center px-2 text-zinc-300">FT%</th>
              <th className="text-center px-2 text-zinc-300">REB</th>
              <th className="text-center px-2 text-zinc-300">AST</th>
              <th className="text-center px-2 text-zinc-300">STL</th>
              <th className="text-center px-2 text-zinc-300">BLK</th>
              <th className="text-center px-2 text-zinc-300">TO</th>
              <th className="text-center px-2 text-zinc-300">PF</th>
              <th className="text-center px-2 text-zinc-300">+/-</th>
              {(onEditPlayerStats || onDeletePlayerStats) && (
                <th className="text-center px-2 text-zinc-300">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr key={player.id} className="border-b border-zinc-700 hover:bg-zinc-800">
                <td className="py-2 text-white font-medium">
                  <span 
                    className="hover:text-yellow-400 cursor-pointer transition-colors"
                    onClick={() => handlePlayerClick(player.id)}
                  >
                    {player.name}
                  </span>
                  {player.onCourt && (
                    <span className="ml-2 text-xs bg-emerald-500 text-black px-2 py-0.5 rounded-full">On Court</span>
                  )}
                </td>
                <td className="text-center text-zinc-300">{formatTime(player.stats.timeOnCourt)}</td>
                <td className="text-center font-bold text-yellow-400">{player.stats.points}</td>
                <td className="text-center text-zinc-300">
                  {player.stats.fgMade}-{player.stats.fgAttempts}
                </td>
                <td className="text-center text-zinc-300">{calculateFGPercentage(player)}</td>
                <td className="text-center text-zinc-300">
                  {player.stats.ftMade}-{player.stats.ftAttempts}
                </td>
                <td className="text-center text-zinc-300">{calculateFTPercentage(player)}</td>
                <td className="text-center text-zinc-300">{calculateTotalRebounds(player)}</td>
                <td className="text-center text-zinc-300">{player.stats.assists}</td>
                <td className="text-center text-zinc-300">{player.stats.steals}</td>
                <td className="text-center text-zinc-300">{player.stats.blocks}</td>
                <td className="text-center text-zinc-300">{player.stats.turnovers}</td>
                <td className="text-center text-zinc-300">{player.stats.fouls}</td>
                <td className={`text-center font-medium ${player.stats.plusMinus > 0 ? 'text-emerald-400' : player.stats.plusMinus < 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                  {player.stats.plusMinus > 0 ? '+' : ''}{player.stats.plusMinus}
                </td>
                {(onEditPlayerStats || onDeletePlayerStats) && (
                  <td className="text-center">
                    <div className="flex justify-center gap-1">
                      {onEditPlayerStats && (
                        <button
                          onClick={() => onEditPlayerStats(player)}
                          className="p-1.5 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-700 rounded transition-colors"
                          title="Edit Stats"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                      {onDeletePlayerStats && (
                        <button
                          onClick={() => onDeletePlayerStats(player)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded transition-colors"
                          title="Delete Stats"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          
          {/* Team Totals */}
          <tfoot>
            <tr className="border-t-2 border-zinc-600 font-bold">
              <td className="py-2 text-yellow-400">TEAM TOTALS</td>
              <td className="text-center text-zinc-300">-</td>
              <td className="text-center text-yellow-400">
                {players.reduce((sum, p) => sum + p.stats.points, 0)}
              </td>
              <td className="text-center text-zinc-300">
                {players.reduce((sum, p) => sum + p.stats.fgMade, 0)}-
                {players.reduce((sum, p) => sum + p.stats.fgAttempts, 0)}
              </td>
              <td className="text-center text-zinc-300">
                {(() => {
                  const totalMade = players.reduce((sum, p) => sum + p.stats.fgMade, 0);
                  const totalAttempts = players.reduce((sum, p) => sum + p.stats.fgAttempts, 0);
                  return totalAttempts > 0 ? `${((totalMade / totalAttempts) * 100).toFixed(1)}%` : '0.0%';
                })()}
              </td>
              <td className="text-center text-zinc-300">
                {players.reduce((sum, p) => sum + p.stats.ftMade, 0)}-
                {players.reduce((sum, p) => sum + p.stats.ftAttempts, 0)}
              </td>
              <td className="text-center text-zinc-300">
                {(() => {
                  const totalMade = players.reduce((sum, p) => sum + p.stats.ftMade, 0);
                  const totalAttempts = players.reduce((sum, p) => sum + p.stats.ftAttempts, 0);
                  return totalAttempts > 0 ? `${((totalMade / totalAttempts) * 100).toFixed(1)}%` : '0.0%';
                })()}
              </td>
              <td className="text-center text-zinc-300">
                {players.reduce((sum, p) => sum + p.stats.offRebounds + p.stats.defRebounds, 0)}
              </td>
              <td className="text-center text-zinc-300">
                {players.reduce((sum, p) => sum + p.stats.assists, 0)}
              </td>
              <td className="text-center text-zinc-300">
                {players.reduce((sum, p) => sum + p.stats.steals, 0)}
              </td>
              <td className="text-center text-zinc-300">
                {players.reduce((sum, p) => sum + p.stats.blocks, 0)}
              </td>
              <td className="text-center text-zinc-300">
                {players.reduce((sum, p) => sum + p.stats.turnovers, 0)}
              </td>
              <td className="text-center text-zinc-300">
                {players.reduce((sum, p) => sum + p.stats.fouls, 0)}
              </td>
              <td className="text-center text-zinc-300">-</td>
              {(onEditPlayerStats || onDeletePlayerStats) && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};