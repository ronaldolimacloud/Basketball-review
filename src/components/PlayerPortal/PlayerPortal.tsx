import React, { useState } from 'react';
import { PlayerAccessForm } from './PlayerAccessForm';
import { PlayerDashboard } from './PlayerDashboard';

export const PlayerPortal: React.FC = () => {
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);

  const handlePlayerLogin = (player: any) => {
    setCurrentPlayer(player);
  };

  const handlePlayerLogout = () => {
    setCurrentPlayer(null);
  };

  return (
    <>
      {!currentPlayer ? (
        <PlayerAccessForm onPlayerLogin={handlePlayerLogin} />
      ) : (
        <PlayerDashboard player={currentPlayer} onLogout={handlePlayerLogout} />
      )}
    </>
  );
};