import React, { useState } from 'react';
import { X, Download, FileText, Database, Eye } from 'lucide-react';
import type { Player } from '../../types/game.types';
import { exportGameSummaryAsCSV, exportGameSummaryAsJSON, generateGameSummary } from '../../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  teamName: string;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
  players: Player[];
  gameDate?: Date;
  totalDuration?: number;
  onCancel: () => void;
}

type ExportFormat = 'csv' | 'json';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  teamName,
  opponentName,
  teamScore,
  opponentScore,
  players,
  gameDate,
  totalDuration,
  onCancel,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const gameSummary = generateGameSummary(
    teamName,
    opponentName,
    teamScore,
    opponentScore,
    players,
    gameDate,
    totalDuration
  );

  const handleExport = () => {
    if (selectedFormat === 'csv') {
      exportGameSummaryAsCSV(gameSummary);
    } else {
      exportGameSummaryAsJSON(gameSummary);
    }
    onCancel();
  };

  const formatOptions = [
    {
      id: 'csv' as ExportFormat,
      name: 'CSV (Excel)',
      description: 'Compatible with Excel, Google Sheets, and other spreadsheet applications',
      icon: FileText,
      extension: '.csv'
    },
    {
      id: 'json' as ExportFormat,
      name: 'JSON',
      description: 'Structured data format perfect for developers and data analysis',
      icon: Database,
      extension: '.json'
    }
  ];

  const PreviewSection = () => {
    if (!showPreview) return null;

    return (
      <div className="mt-4 p-4 bg-zinc-800 rounded-lg border border-zinc-600">
        <h4 className="text-sm font-medium text-yellow-400 mb-3">Data Preview</h4>
        
        {/* Game Info */}
        <div className="mb-4">
          <h5 className="text-xs font-medium text-emerald-400 mb-2">Game Information</h5>
          <div className="text-xs text-zinc-300 space-y-1">
            <div>Teams: {gameSummary.gameInfo.teamName} vs {gameSummary.gameInfo.opponentName}</div>
            <div>Final Score: {gameSummary.gameInfo.finalScore}</div>
            <div>Date: {gameSummary.gameInfo.gameDate}</div>
            <div>Duration: {gameSummary.gameInfo.totalDuration}</div>
          </div>
        </div>

        {/* Player Stats Sample */}
        <div>
          <h5 className="text-xs font-medium text-cyan-400 mb-2">Player Statistics ({players.length} players)</h5>
          <div className="text-xs text-zinc-300">
            <div className="grid grid-cols-4 gap-2 font-medium text-zinc-400 mb-1">
              <div>Player</div>
              <div>Points</div>
              <div>Rebounds</div>
              <div>Assists</div>
            </div>
            {players.slice(0, 3).map((player, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 py-1">
                <div>{player.name}</div>
                <div>{player.stats.points}</div>
                <div>{player.stats.offRebounds + player.stats.defRebounds}</div>
                <div>{player.stats.assists}</div>
              </div>
            ))}
            {players.length > 3 && (
              <div className="text-zinc-500 text-center py-1">
                ... and {players.length - 3} more players
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 max-w-lg w-full mx-4 border border-zinc-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Game Summary
          </h3>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Format Selection */}
          <div>
            <h4 className="text-sm font-medium text-zinc-300 mb-3">Choose Export Format</h4>
            <div className="space-y-2">
              {formatOptions.map((format) => {
                const Icon = format.icon;
                return (
                  <label
                    key={format.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedFormat === format.id
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-zinc-600 bg-zinc-800 hover:border-zinc-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value={format.id}
                      checked={selectedFormat === format.id}
                      onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                      className="mt-1"
                    />
                    <Icon className={`w-5 h-5 mt-0.5 ${selectedFormat === format.id ? 'text-yellow-400' : 'text-zinc-400'}`} />
                    <div className="flex-1">
                      <div className={`font-medium ${selectedFormat === format.id ? 'text-yellow-400' : 'text-white'}`}>
                        {format.name} <span className="text-xs text-zinc-500">{format.extension}</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">
                        {format.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Preview Toggle */}
          <div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Hide' : 'Show'} Data Preview
            </button>
          </div>

          <PreviewSection />

          {/* File Info */}
          <div className="p-3 bg-zinc-800 rounded-lg border border-zinc-600">
            <div className="text-sm text-zinc-300">
              <div className="font-medium mb-2">Export Details:</div>
              <div className="text-xs space-y-1 text-zinc-400">
                <div>• File name: {teamName}_vs_{opponentName}_{new Date().toISOString().split('T')[0]}.{selectedFormat}</div>
                <div>• Includes: Game info, all player statistics, team totals</div>
                <div>• Format: {formatOptions.find(f => f.id === selectedFormat)?.name}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-zinc-300"
          >
            Cancel
          </button>
          
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors text-white font-medium flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export {selectedFormat.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};