import React, { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import type { GameFormat, PeriodScore, StatType } from '../../types/game.types';

// Components (keeping the original game components)
import { VideoClipEditor } from '../VideoPlayer/VideoClipEditor';
import { ClipLibrary } from '../VideoClips/ClipLibrary';
import { ClipViewer } from '../VideoClips/ClipViewer';
import { GameClock } from '../GameClock';
import { ScoreBoard } from '../ScoreBoard';
import { StatButtons, BoxScore } from '../StatTracker';
import { GameSetupForm } from './GameSetupForm';
import { SubstitutionModal } from '../PlayerManagement/SubstitutionModal';
import { StatCorrectionModal } from './StatCorrectionModal';
import { ConfirmationModal } from './ConfirmationModal';
import { GameScoreEditModal } from './GameScoreEditModal';
import { ExportModal } from './ExportModal';

// Hooks
import { useGameClock } from '../../hooks/useGameClock';
import { useGameStats } from '../../hooks/useGameStats';

// Utils
import { calculateTeamFouls } from '../../utils/statCalculations';
import { createPeriodScore, getMaxPeriods } from '../../utils/gameHelpers';

// Icons
import { Users, BarChart3, Edit3, Download, Video, Clock, Scissors } from 'lucide-react';

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

  // Substitution state
  const [isSubstitutionModalOpen, setIsSubstitutionModalOpen] = useState(false);
  const [playerComingIn, setPlayerComingIn] = useState<GamePlayer | null>(null);

  // Stat correction state
  const [isStatCorrectionModalOpen, setIsStatCorrectionModalOpen] = useState(false);
  const [playerToCorrect, setPlayerToCorrect] = useState<GamePlayer | null>(null);

  // Delete confirmation state
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<GamePlayer | null>(null);

  // Score edit state
  const [isScoreEditModalOpen, setIsScoreEditModalOpen] = useState(false);

  // Export state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Video clips state
  const [activeVideoTab, setActiveVideoTab] = useState<'player' | 'library'>('player');
  const [selectedClip, setSelectedClip] = useState<any>(null);
  const [videoSrc] = useState<string>('');

  
  // Initialize game stats hook - this manages the actual player state
  const gameStats = useGameStats(initialPlayers);
  
  // Stable callback for game clock to prevent interval recreation
  const handlePlayersUpdate = useCallback((updater: (players: any[]) => any[]) => {
    gameStats.setPlayers((prevPlayers) => {
      // Convert GamePlayer[] to Player[] for the updater function
      const convertedPlayers = prevPlayers.map((player, index) => ({
        ...player,
        id: parseInt(player.id.replace(/\D/g, '')) || index,
      }));
      
      // Apply the updater function
      const updatedPlayers = updater(convertedPlayers);
      
      // Convert back to GamePlayer[]
      return updatedPlayers.map((player, index) => ({
        ...player,
        id: prevPlayers[index]?.id || player.id.toString(),
      }));
    });
  }, [gameStats.setPlayers]);
  
  const gameClock = useGameClock(handlePlayersUpdate);

  // Note: Time tracking is handled by useGameClock hook, no need for duplicate interval here

  const handleSetupComplete = async (teamId: string, teamName: string, opponent: string, format: GameFormat, players: GamePlayer[]) => {
    setTeamName(teamName);
    setOpponentName(opponent);
    setGameFormat(format);
    setInitialPlayers(players);
    
    // Create game record in database using existing team
    try {
      const newGame = await client.models.Game.create({
        homeTeamId: teamId,
        homeTeamName: teamName,
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

  const handleSubstitutionRequest = (player: GamePlayer) => {
    setPlayerComingIn(player);
    setIsSubstitutionModalOpen(true);
  };

  const handleSubstitution = (playerOutId: number) => {
    if (!playerComingIn) return;
    
    // Find the actual string ID of the player going out
    const playerOut = gameStats.players.find(p => p.onCourt && 
      (parseInt(p.id.replace(/\D/g, '')) || 0) === playerOutId);
    
    if (!playerOut) {
      console.error('Player to substitute out not found!');
      return;
    }
    
    console.log('Substitution:', {
      playerInId: playerComingIn.id,
      playerInName: playerComingIn.name,
      playerOutId: playerOut.id,
      playerOutName: playerOut.name,
      currentTime: gameClock.gameClock
    });
    
    gameStats.substitutePlayer(playerComingIn.id, playerOut.id, gameClock.gameClock);
    setIsSubstitutionModalOpen(false);
    setPlayerComingIn(null);
  };

  const handleCancelSubstitution = () => {
    setIsSubstitutionModalOpen(false);
    setPlayerComingIn(null);
  };

  const handleStatCorrectionRequest = (player: GamePlayer) => {
    setPlayerToCorrect(player);
    setIsStatCorrectionModalOpen(true);
  };

  const handleStatCorrection = (playerId: string, newStats: GamePlayer['stats']) => {
    const handleTeamScoreChange = (pointsDifference: number) => {
      setTeamScore(prev => prev + pointsDifference);
      console.log(`Team score adjusted by ${pointsDifference} points`);
    };

    gameStats.correctPlayerStats(playerId, newStats, handleTeamScoreChange);
    setIsStatCorrectionModalOpen(false);
    setPlayerToCorrect(null);
  };

  const handleCancelStatCorrection = () => {
    setIsStatCorrectionModalOpen(false);
    setPlayerToCorrect(null);
  };

  const handleDeletePlayerStatsRequest = (player: GamePlayer) => {
    setPlayerToDelete(player);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleDeletePlayerStats = () => {
    if (!playerToDelete) return;

    const handleTeamScoreChange = (pointsDifference: number) => {
      setTeamScore(prev => prev + pointsDifference);
      console.log(`Team score adjusted by ${pointsDifference} points due to stat deletion`);
    };

    gameStats.resetPlayerStats(playerToDelete.id, handleTeamScoreChange);
    setIsDeleteConfirmModalOpen(false);
    setPlayerToDelete(null);
  };

  const handleCancelDeletePlayerStats = () => {
    setIsDeleteConfirmModalOpen(false);
    setPlayerToDelete(null);
  };

  const handleEditScoreRequest = () => {
    setIsScoreEditModalOpen(true);
  };

  const handleScoreEdit = (newTeamScore: number, newOpponentScore: number) => {
    setTeamScore(newTeamScore);
    setOpponentScore(newOpponentScore);
    setIsScoreEditModalOpen(false);
    
    console.log('Score edited:', {
      newTeamScore,
      newOpponentScore,
      previousTeamScore: teamScore,
      previousOpponentScore: opponentScore
    });
  };

  const handleCancelScoreEdit = () => {
    setIsScoreEditModalOpen(false);
  };

  const handleExportRequest = () => {
    setIsExportModalOpen(true);
  };

  // Video clip handlers
  const handleClipCreated = (clipData: any) => {
    console.log('Clip created:', clipData);
    // Optionally switch to library view to see the new clip
    setActiveVideoTab('library');
  };

  const handleClipSelect = (clip: any) => {
    setSelectedClip(clip);
  };

  const handleClipViewerClose = () => {
    setSelectedClip(null);
  };

  const handleCancelExport = () => {
    setIsExportModalOpen(false);
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
    <div className="h-full flex flex-col space-y-6">
      {/* Game Header - More compact for dashboard */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">Live Game Review</h2>
            <p className="text-xl text-zinc-300">{teamName} vs {opponentName}</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-zinc-400">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Game Format: {gameFormat === 'quarters' ? '4 Quarters' : '2 Halves'}
              </span>
              <span>•</span>
              <span>Active Players: {gameStats.players.filter(p => p.onCourt).length}</span>
              <span>•</span>
              <span>Total Players: {gameStats.players.length}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative text-center bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-2xl px-8 py-6 border-2 border-yellow-400/30 shadow-2xl group">
              <div className="text-6xl font-black text-yellow-400 tracking-wider flex items-center justify-center gap-4">
                <span className="text-white text-3xl font-bold uppercase">{teamName}</span>
                <span className="text-emerald-400">{teamScore}</span>
                <span className="text-zinc-400 text-4xl">×</span>
                <span className="text-red-400">{opponentScore}</span>
                <span className="text-white text-3xl font-bold uppercase">{opponentName}</span>
              </div>
              <div className="text-sm text-zinc-400 mt-2 font-medium tracking-wide">LIVE SCORE</div>
              
              {/* Edit Score Button */}
              <button
                onClick={handleEditScoreRequest}
                className="absolute top-3 right-3 p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Edit Score"
              >
                <Edit3 className="w-4 h-4 text-zinc-400 hover:text-yellow-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-0">
        
        {/* Left Column - Video Player */}
        <div className="xl:col-span-2 flex flex-col min-h-0">
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-4 flex-1 flex flex-col">
            {/* Video Tabs */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                <Video className="w-5 h-5" />
                Video Analysis & Clips
              </h3>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveVideoTab('player')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-sm ${
                    activeVideoTab === 'player'
                      ? 'bg-yellow-500 text-black font-medium'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  <Scissors className="w-4 h-4" />
                  Clip Editor
                </button>
                <button
                  onClick={() => setActiveVideoTab('library')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-sm ${
                    activeVideoTab === 'library'
                      ? 'bg-yellow-500 text-black font-medium'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Clip Library
                </button>
              </div>
            </div>
            
            <div className="flex-1 min-h-0">
              {activeVideoTab === 'player' ? (
                <VideoClipEditor 
                  gameId={currentGame?.id}
                  onClipCreated={handleClipCreated}
                />
              ) : (
                <ClipLibrary 
                  gameId={currentGame?.id}
                  onClipSelect={handleClipSelect}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Game Controls */}
        <div className="flex flex-col space-y-4 min-h-0">
          
          {/* Game Clock Card */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-4">
            <GameClock
              gameClock={gameClock.gameClock}
              isClockRunning={gameClock.isClockRunning}
              currentPeriod={currentPeriod}
              gameFormat={gameFormat}
              onClockToggle={gameClock.toggleClock}
              onPeriodChange={setCurrentPeriod}
              onEndPeriod={handleEndPeriod}
            />
          </div>
          
          {/* ScoreBoard Card */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-4">
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
          </div>
          
          {/* Stats Buttons Card */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-4 flex-1">
            <StatButtons
              selectedPlayerName={gameStats.selectedPlayerName}
              onStatUpdate={handleStatUpdate}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section - Player Selection */}
      <div className="max-w-4xl mx-auto">
        
        {/* Player Management */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Player Management
          </h3>
          
          {/* On Court Players */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-emerald-400 mb-3">On Court ({gameStats.players.filter(p => p.onCourt).length}/5)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {gameStats.players.filter(p => p.onCourt).map((player) => (
                <div key={player.id} className="relative group">
                  <button
                    onClick={() => gameStats.setSelectedPlayerId(player.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      gameStats.selectedPlayerId === player.id
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg border-2 border-yellow-400'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-500 hover:to-emerald-600'
                    }`}
                  >
                    <div className="font-medium text-sm">{player.name}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {player.stats.points}pts • {player.stats.assists}ast • {player.stats.fouls}f
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatCorrectionRequest(player);
                    }}
                    className="absolute top-1 right-1 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit Stats"
                  >
                    <Edit3 className="w-3 h-3 text-zinc-400 hover:text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bench Players */}
          <div>
            <h4 className="text-md font-medium text-zinc-400 mb-3">Bench ({gameStats.players.filter(p => !p.onCourt).length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {gameStats.players.filter(p => !p.onCourt).map((player) => (
                <div
                  key={player.id}
                  className="p-3 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-300 flex justify-between items-center group relative"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{player.name}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {player.stats.points}pts • {player.stats.assists}ast • {player.stats.fouls}f
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatCorrectionRequest(player)}
                      className="p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit Stats"
                    >
                      <Edit3 className="w-3 h-3 text-zinc-400 hover:text-white" />
                    </button>
                    <button
                      onClick={() => handleSubstitutionRequest(player)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs transition-colors"
                    >
                      Sub In
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Box Score - Full Width */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Live Box Score
          </h3>
          
          <button
            onClick={handleExportRequest}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-medium"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
        <div className="overflow-x-auto">
          <BoxScore 
            players={convertToLegacyPlayers(gameStats.players)} 
            teamName={teamName}
            onEditPlayerStats={(player) => {
              // Convert legacy player back to GamePlayer format
              const gamePlayer = gameStats.players.find(p => p.id === player.id.toString() || parseInt(p.id.replace(/\D/g, '')) === player.id);
              if (gamePlayer) {
                handleStatCorrectionRequest(gamePlayer);
              }
            }}
            onDeletePlayerStats={(player) => {
              // Convert legacy player back to GamePlayer format
              const gamePlayer = gameStats.players.find(p => p.id === player.id.toString() || parseInt(p.id.replace(/\D/g, '')) === player.id);
              if (gamePlayer) {
                handleDeletePlayerStatsRequest(gamePlayer);
              }
            }}
          />
        </div>
      </div>

      {/* Finish Game Button */}
      <div className="text-center pt-4 border-t border-zinc-700">
        <button
          onClick={handleFinishGame}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 px-12 py-4 rounded-xl font-bold text-white transition-all transform hover:scale-105 shadow-lg text-lg"
        >
          🏁 Finish & Save Game
        </button>
      </div>

      {/* Substitution Modal */}
      <SubstitutionModal
        isOpen={isSubstitutionModalOpen}
        playerComingIn={playerComingIn ? convertToLegacyPlayers([playerComingIn])[0] : null}
        playersOnCourt={convertToLegacyPlayers(gameStats.players.filter(p => p.onCourt))}
        onSubstitute={handleSubstitution}
        onCancel={handleCancelSubstitution}
      />

      {/* Stat Correction Modal */}
      <StatCorrectionModal
        isOpen={isStatCorrectionModalOpen}
        player={playerToCorrect}
        onSave={handleStatCorrection}
        onCancel={handleCancelStatCorrection}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmModalOpen}
        title="Delete Player Stats"
        message={`Are you sure you want to delete all stats for ${playerToDelete?.name}? This action cannot be undone. The player's time on court will be preserved.`}
        confirmText="Delete Stats"
        cancelText="Cancel"
        onConfirm={handleDeletePlayerStats}
        onCancel={handleCancelDeletePlayerStats}
        type="danger"
      />

      {/* Game Score Edit Modal */}
      <GameScoreEditModal
        isOpen={isScoreEditModalOpen}
        teamName={teamName}
        opponentName={opponentName}
        currentTeamScore={teamScore}
        currentOpponentScore={opponentScore}
        onSave={handleScoreEdit}
        onCancel={handleCancelScoreEdit}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        teamName={teamName}
        opponentName={opponentName}
        teamScore={teamScore}
        opponentScore={opponentScore}
        players={convertToLegacyPlayers(gameStats.players)}
        gameDate={currentGame?.gameDate ? new Date(currentGame.gameDate) : new Date()}
        totalDuration={gameClock.gameClock}
        onCancel={handleCancelExport}
      />

      {/* Clip Viewer Modal */}
      {selectedClip && (
        <ClipViewer
          clip={selectedClip}
          videoSrc={videoSrc}
          onClose={handleClipViewerClose}
        />
      )}
    </div>
  );
}; 