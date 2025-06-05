import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import type { GameFormat, PeriodScore, StatType } from '../../types/game.types';

// Components (keeping the original game components)
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { GameClock } from '../GameClock';
import { ScoreBoard } from '../ScoreBoard';
import { StatButtons, BoxScore } from '../StatTracker';
import { GameSetupForm } from './GameSetupForm';

// Hooks
import { useGameClock } from '../../hooks/useGameClock';
import { useGameStats } from '../../hooks/useGameStats';

// Utils
import { calculateTeamFouls } from '../../utils/statCalculations';
import { createPeriodScore, getMaxPeriods } from '../../utils/gameHelpers';

interface GameReviewProps {
  client: ReturnType<typeof generateClient<Schema>>;
}

interface GamePlayer {
  id: string;
  name: string;
  position?: string;
  profileImageUrl?: string;
  onCourt: boolean;
  stats: {
    points: number;
    fouls: number;
    turnovers: number;
    offRebounds: number;
    defRebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    fgMade: number;
    fgAttempts: number;
    ftMade: number;
    ftAttempts: number;
    plusMinus: number;
    timeOnCourt: number;
  };
  startTime: number | null;
}

export const GameReview: React.FC<GameReviewProps> = ({ client }) => {
  // Setup state
  const [isSetup, setIsSetup] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [gameFormat, setGameFormat] = useState<GameFormat>('quarters');
  const [initialPlayers, setInitialPlayers] = useState<GamePlayer[]>([]);
  
  // Game state
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [teamScore, setTeamScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [teamTimeouts, setTeamTimeouts] = useState(0);
  const [opponentTimeouts, setOpponentTimeouts] = useState(0);
  const [periodScores, setPeriodScores] = useState<PeriodScore[]>([]);
  const [periodStartScore, setPeriodStartScore] = useState({ team: 0, opponent: 0 });
  const [gameNotes, setGameNotes] = useState('');
  
  // Player states
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  
  // Initialize game stats hook - this manages the actual player state
  const gameStats = useGameStats(initialPlayers);
  const gameClock = useGameClock(gameStats.setPlayers);

  // Update time on court every second when clock is running
  useEffect(() => {
    let interval: number;
    
    if (!isSetup && gameClock.isClockRunning) {
      interval = setInterval(() => {
        gameStats.updateTimeOnCourt(gameClock.gameClock);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSetup, gameClock.isClockRunning, gameClock.gameClock, gameStats]);

  const handleSetupComplete = async (team: string, opponent: string, format: GameFormat, players: GamePlayer[]) => {
    setTeamName(team);
    setOpponentName(opponent);
    setGameFormat(format);
    setInitialPlayers(players);
    
    // Create game record in database
    try {
      // Create a temporary team for this game
      const tempTeam = await client.models.Team.create({
        name: team,
        isActive: true
      });

      const newGame = await client.models.Game.create({
        homeTeamId: tempTeam.data?.id || 'temp-id',
        homeTeamName: team,
        awayTeamName: opponent,
        gameFormat: format,
        gameDate: new Date().toISOString(),
        homeTeamScore: 0,
        awayTeamScore: 0,
        isCompleted: false,
        periodScores: JSON.stringify([])
      });
      
      setCurrentGame(newGame.data);
      setIsSetup(false);
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const handleStatUpdate = (statType: StatType, value?: number) => {
    if (!gameStats.selectedPlayerId) return;
    
    gameStats.updatePlayerStat(gameStats.selectedPlayerId, statType, value);
    
    // Handle point scoring
    if (statType === 'points' && value) {
      setTeamScore(prev => prev + value);
      gameStats.updatePlusMinus(value, true);
    }
  };

  const handleOpponentScore = (points: number) => {
    setOpponentScore(prev => prev + points);
    gameStats.updatePlusMinus(points, false);
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
    
    const newPeriodScores = [...periodScores, periodScore];
    setPeriodScores(newPeriodScores);
    setPeriodStartScore({ team: teamScore, opponent: opponentScore });
    
    if (currentPeriod < getMaxPeriods(gameFormat)) {
      setCurrentPeriod(currentPeriod + 1);
    }
    
    gameClock.resetClock();
  };

  const handleFinishGame = async () => {
    if (!currentGame) return;

    try {
      // Update game with final scores and completion status
      await client.models.Game.update({
        id: currentGame.id,
        homeTeamScore: teamScore,
        awayTeamScore: opponentScore,
        isCompleted: true,
        totalDuration: gameClock.gameClock,
        notes: gameNotes,
        periodScores: JSON.stringify(periodScores)
      });

      // Save individual player stats
      for (const player of gameStats.players) {
        await client.models.GameStat.create({
          gameId: currentGame.id,
          playerId: player.id,
          points: player.stats.points,
          assists: player.stats.assists,
          offRebounds: player.stats.offRebounds,
          defRebounds: player.stats.defRebounds,
          steals: player.stats.steals,
          blocks: player.stats.blocks,
          fouls: player.stats.fouls,
          turnovers: player.stats.turnovers,
          fgMade: player.stats.fgMade,
          fgAttempts: player.stats.fgAttempts,
          ftMade: player.stats.ftMade,
          ftAttempts: player.stats.ftAttempts,
          minutesPlayed: Math.floor(player.stats.timeOnCourt / 60),
          plusMinus: player.stats.plusMinus,
          startedOnCourt: player.onCourt
        });

        // Update player career stats
        try {
          const existingPlayer = await client.models.Player.get({ id: player.id });
          if (existingPlayer.data) {
            const data = existingPlayer.data;
            const totalRebounds = player.stats.offRebounds + player.stats.defRebounds;
            
            await client.models.Player.update({
              id: player.id,
              totalGamesPlayed: (data.totalGamesPlayed || 0) + 1,
              careerPoints: (data.careerPoints || 0) + player.stats.points,
              careerAssists: (data.careerAssists || 0) + player.stats.assists,
              careerRebounds: (data.careerRebounds || 0) + totalRebounds,
              careerSteals: (data.careerSteals || 0) + player.stats.steals,
              careerBlocks: (data.careerBlocks || 0) + player.stats.blocks,
              careerFouls: (data.careerFouls || 0) + player.stats.fouls,
              careerTurnovers: (data.careerTurnovers || 0) + player.stats.turnovers,
              careerFgMade: (data.careerFgMade || 0) + player.stats.fgMade,
              careerFgAttempts: (data.careerFgAttempts || 0) + player.stats.fgAttempts,
              careerFtMade: (data.careerFtMade || 0) + player.stats.ftMade,
              careerFtAttempts: (data.careerFtAttempts || 0) + player.stats.ftAttempts,
              careerMinutesPlayed: (data.careerMinutesPlayed || 0) + Math.floor(player.stats.timeOnCourt / 60)
            });
          }
        } catch (error) {
          console.error('Error updating player career stats:', error);
        }
      }

      alert('Game completed and saved successfully!');
      // Reset for new game
      setIsSetup(true);
      setCurrentGame(null);
      setTeamScore(0);
      setOpponentScore(0);
      setCurrentPeriod(1);
      setPeriodScores([]);
      setPeriodStartScore({ team: 0, opponent: 0 });
      setGameNotes('');
      gameClock.resetClock();
      
    } catch (error) {
      console.error('Error finishing game:', error);
      alert('Error saving game. Please try again.');
    }
  };

  // Convert GamePlayer to Player format for legacy components
  const convertToLegacyPlayers = (gamePlayers: GamePlayer[]) => {
    return gamePlayers.map((player: GamePlayer, index: number) => ({
      ...player,
      id: parseInt(player.id.replace(/\D/g, '')) || index, // Convert string ID to number
    }));
  };

  const teamFouls = calculateTeamFouls(convertToLegacyPlayers(gameStats.players));

  if (isSetup) {
    return <GameSetupForm onSetupComplete={handleSetupComplete} client={client} />;
  }

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">Live Game Review</h2>
        <p className="text-xl text-slate-400">{teamName} vs {opponentName}</p>
        <div className="mt-2 flex items-center justify-center gap-4 text-sm text-slate-500">
          <span>Game Format: {gameFormat === 'quarters' ? '4 Quarters' : '2 Halves'}</span>
          <span>•</span>
          <span>Players: {gameStats.players.length}</span>
        </div>
      </div>

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
            onPeriodChange={setCurrentPeriod}
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
          
          <StatButtons
            selectedPlayerName={gameStats.selectedPlayerName}
            onStatUpdate={handleStatUpdate}
          />
        </div>
      </div>

      {/* Player Selection */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
        <h3 className="text-lg font-semibold text-yellow-400 mb-3">Select Player for Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {gameStats.players.map((player) => (
            <button
              key={player.id}
              onClick={() => gameStats.setSelectedPlayerId(player.id)}
              className={`p-2 rounded-lg text-sm font-medium transition-all ${
                gameStats.selectedPlayerId === player.id
                  ? 'bg-yellow-500 text-black'
                  : player.onCourt
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <div>{player.name}</div>
              <div className="text-xs opacity-75">
                {player.onCourt ? 'On Court' : 'Bench'} • {player.stats.points}pts
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Game Notes */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
        <h3 className="text-lg font-semibold text-yellow-400 mb-3">Game Notes</h3>
        <textarea
          value={gameNotes}
          onChange={(e) => setGameNotes(e.target.value)}
          placeholder="Add any notes about the game..."
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-yellow-500 focus:outline-none resize-vertical"
          rows={3}
        />
      </div>

      {/* Box Score and Finish Game */}
      <div className="space-y-4">
        <BoxScore players={convertToLegacyPlayers(gameStats.players)} teamName={teamName} />
        
        <div className="text-center">
          <button
            onClick={handleFinishGame}
            className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 rounded-lg font-bold text-white transition-colors text-lg"
          >
            Finish & Save Game
          </button>
        </div>
      </div>
    </div>
  );
}; 