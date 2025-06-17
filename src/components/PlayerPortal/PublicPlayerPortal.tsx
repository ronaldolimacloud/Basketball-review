import React, { useState } from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { PlayerAccessForm } from './PlayerAccessForm';
import { PlayerDashboard } from './PlayerDashboard';

/**
 * Public Player Portal - Accessible without coach authentication
 * This is the entry point for players to access their personal dashboard
 * using their unique access codes provided by their coach.
 */
export const PublicPlayerPortal: React.FC = () => {
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);

  const handlePlayerLogin = (player: any) => {
    setCurrentPlayer(player);
  };

  const handlePlayerLogout = () => {
    setCurrentPlayer(null);
  };

  const handleBackToCoachSite = () => {
    // Navigate to the coach dashboard
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Top Navigation Bar */}
      <nav className="bg-zinc-800 border-b border-zinc-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-yellow-400">
              🏀 Basketball Review - Player Portal
            </h1>
          </div>
          
          {!currentPlayer && (
            <button
              onClick={handleBackToCoachSite}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Coach Dashboard
            </button>
          )}
          
          {currentPlayer && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400">
                Welcome, {currentPlayer.name}
              </span>
              <button
                onClick={handleBackToCoachSite}
                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Coach Site
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {!currentPlayer ? (
          <PlayerAccessForm onPlayerLogin={handlePlayerLogin} />
        ) : (
          <PlayerDashboard player={currentPlayer} onLogout={handlePlayerLogout} />
        )}
      </main>
    </div>
  );
};