import React, { useState } from 'react';
import type { GameFormat, PeriodScore, StatType } from './types/game.types';

// Components
import { VideoPlayer } from './components/VideoPlayer';
import { GameClock } from './components/GameClock';
import { ScoreBoard } from './components/ScoreBoard';
import { PlayerList, SubstitutionModal } from './components/PlayerManagement';
import { StatButtons, BoxScore } from './components/StatTracker';
import { SetupForm } from './components/GameSetup';

// Hooks
import { useGameClock } from './hooks/useGameClock';
import { usePlayerStats } from './hooks/usePlayerStats';

// Utils
import { calculateTeamFouls, getPlayersOnCourt } from './utils/statCalculations';
import { createInitialPlayers, createPeriodScore, getMaxPeriods } from './utils/gameHelpers';

const BasketballReviewApp = () => {
  // Setup state
  const [isSetup, setIsSetup] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [gameFormat, setGameFormat] = useState<GameFormat>('quarters');
  
  // Game state
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [teamScore, setTeamScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [teamTimeouts, setTeamTimeouts] = useState(0);
  const [opponentTimeouts, setOpponentTimeouts] = useState(0);
  const [periodScores, setPeriodScores] = useState<PeriodScore[]>([]);
  const [periodStartScore, setPeriodStartScore] = useState({ team: 0, opponent: 0 });
  
  // Substitution state
  const [showSubModal, setShowSubModal] = useState(false);
  const [playerSubbingIn, setPlayerSubbingIn] = useState<number | null>(null);
  
  // Initialize hooks
  const playerStats = usePlayerStats(createInitialPlayers());
  const gameClock = useGameClock(playerStats.setPlayers);
  
  // Calculated values
  const teamFouls = calculateTeamFouls(playerStats.players);
  const playersOnCourt = getPlayersOnCourt(playerStats.players);
  const playerComingIn = playerStats.players.find(p => p.id === playerSubbingIn) || null;

  // Setup handler
  const handleSetupComplete = (team: string, opponent: string, format: GameFormat) => {
    setTeamName(team);
    setOpponentName(opponent);
    setGameFormat(format);
    setIsSetup(false);
  };

  // Period management
  const handlePeriodChange = (newPeriod: number) => {
    setCurrentPeriod(newPeriod);
  };

  const handleEndPeriod = () => {
    const periodScore = createPeriodScore(
      currentPeriod,
      gameFormat,
      teamScore,
      opponentScore,
      periodStartScore.team,
      periodStartScore.opponent
    );
    
    setPeriodScores([...periodScores, periodScore]);
    setPeriodStartScore({ team: teamScore, opponent: opponentScore });
    
    if (currentPeriod < getMaxPeriods(gameFormat)) {
      setCurrentPeriod(currentPeriod + 1);
    }
    
    gameClock.resetClock();
  };

  // Scoring handlers
  const handleStatUpdate = (statType: StatType, value?: number) => {
    if (!playerStats.selectedPlayerId) return;
    
    playerStats.updatePlayerStat(playerStats.selectedPlayerId, statType, value);
    
    // Handle point scoring
    if (statType === 'points' && value) {
      setTeamScore(prev => prev + value);
      playerStats.updatePlusMinus(value, true);
    }
  };

  const handleOpponentScore = (points: number) => {
    setOpponentScore(prev => prev + points);
    playerStats.updatePlusMinus(points, false);
  };

  // Substitution handlers
  const handleSubstitutionRequest = (playerInId: number) => {
    setPlayerSubbingIn(playerInId);
    setShowSubModal(true);
  };

  const handleSubstitution = (playerOutId: number) => {
    if (playerSubbingIn) {
      playerStats.substitutePlayer(playerSubbingIn, playerOutId, gameClock.gameClock);
      setShowSubModal(false);
      setPlayerSubbingIn(null);
      playerStats.setSelectedPlayerId(null);
    }
  };

  const handleCancelSubstitution = () => {
    setShowSubModal(false);
    setPlayerSubbingIn(null);
  };

  // Show setup screen
  if (isSetup) {
    return <SetupForm onSetupComplete={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400">Basketball Game Review</h1>
          <p className="text-xl text-slate-400 mt-2">{teamName} vs {opponentName}</p>
        </div>
        
        {/* Substitution Modal */}
        <SubstitutionModal
          isOpen={showSubModal}
          playerComingIn={playerComingIn}
          playersOnCourt={playersOnCourt}
          onSubstitute={handleSubstitution}
          onCancel={handleCancelSubstitution}
        />
        
        {/* Main Game Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Player */}
          <VideoPlayer />
          
          {/* Game Controls */}
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <GameClock
              gameClock={gameClock.gameClock}
              isClockRunning={gameClock.isClockRunning}
              currentPeriod={currentPeriod}
              gameFormat={gameFormat}
              onClockToggle={gameClock.toggleClock}
              onPeriodChange={handlePeriodChange}
              onEndPeriod={handleEndPeriod}
            />
            
            <ScoreBoard
              teamName={teamName}
              opponentName={opponentName}
              teamScore={teamScore}
              opponentScore={opponentScore}
              teamFouls={teamFouls}
              teamTimeouts={teamTimeouts}
              opponentTimeouts={opponentTimeouts}
              onOpponentScore={handleOpponentScore}
              onTeamTimeout={() => setTeamTimeouts(prev => prev + 1)}
              onOpponentTimeout={() => setOpponentTimeouts(prev => prev + 1)}
            />
            
            {/* Period Summary */}
            {periodScores.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-3 mt-4 border border-slate-600">
                <h4 className="text-sm font-semibold mb-2 text-yellow-400">Period Breakdown</h4>
                <div className="space-y-1">
                  {periodScores.map((period, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-slate-400">{period.periodLabel}:</span>
                      <span>
                        <span className="text-yellow-400">{teamName} {period.teamScore}</span>
                        <span className="mx-2 text-slate-500">-</span>
                        <span className="text-orange-400">{opponentName} {period.opponentScore}</span>
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-slate-600 pt-1 mt-1">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-slate-300">Total:</span>
                      <span>
                        <span className="text-yellow-400">{teamScore}</span>
                        <span className="mx-2 text-slate-500">-</span>
                        <span className="text-orange-400">{opponentScore}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <StatButtons
              selectedPlayerName={playerStats.selectedPlayerName}
              onStatUpdate={handleStatUpdate}
            />
          </div>
        </div>
        
        {/* Player Management */}
        <div className="mt-6 bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-yellow-400">
              {teamName} Players & Management
            </h2>
            <div className="text-sm text-slate-300">
              Team Fouls: <span className="text-amber-400">{teamFouls}</span> | 
              Timeouts: <span className="text-yellow-400">{teamTimeouts}</span>
            </div>
          </div>
          
          <PlayerList
            players={playerStats.players}
            selectedPlayerId={playerStats.selectedPlayerId}
            onPlayerSelect={playerStats.setSelectedPlayerId}
            onPlayerNameEdit={playerStats.updatePlayerName}
            onSubstitutionRequest={handleSubstitutionRequest}
          />
        </div>
        
        {/* Box Score */}
        <BoxScore players={playerStats.players} teamName={teamName} />
      </div>
    </div>
  );
};

export default BasketballReviewApp; 