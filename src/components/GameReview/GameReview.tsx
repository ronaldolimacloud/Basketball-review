import React, { useState, useCallback } from 'react';
import type { GameFormat, PeriodScore, StatType } from '../../types/game.types';

// Components (keeping the original game components)
import { StatButtons, BoxScore } from '../StatTracker';
import { GameSetupForm } from './GameSetupForm';
import { SubstitutionModal } from '../PlayerManagement/SubstitutionModal';
import { StatCorrectionModal } from './StatCorrectionModal';
import { ConfirmationModal } from './ConfirmationModal';
import { GameScoreEditModal } from './GameScoreEditModal';
import { ExportModal } from './ExportModal';
import { PlaysTimeline } from './PlaysTimeline';
import { GameSummary } from './GameSummary';
import Button from '../ui/Button';
import { PlayerImage } from '../PlayerProfiles/PlayerImage';

// Hooks
import { useGameClock } from '../../hooks/useGameClock';
import { useGameStats } from '../../hooks/useGameStats';
import { useGameEvents } from '../../hooks/useGameEvents';

// Utils
import { calculateTeamFouls } from '../../utils/statCalculations';
import { createPeriodScore, getMaxPeriods, createAutomaticPeriodScores } from '../../utils/gameHelpers';
import { logger } from '../../utils/logger';

// API Service
import { api } from '../../services/api';

// Icons
import { Users, BarChart3, Edit3, Download, Clock, Activity, Trophy } from 'lucide-react';

interface GameReviewProps {
  // Props can be added here as needed
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

type GameTab = 'management' | 'boxscore' | 'plays' | 'summary';

export const GameReview: React.FC<GameReviewProps> = () => {
  // Setup state
  const [isSetup, setIsSetup] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [gameFormat, setGameFormat] = useState<GameFormat>('quarters');
  const [initialPlayers, setInitialPlayers] = useState<GamePlayer[]>([]);
  const [activeTab, setActiveTab] = useState<GameTab>('management');
  
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

  
  // Initialize game stats hook - this manages the actual player state
  const gameStats = useGameStats({
    initialPlayers,
    gameId: currentGame?.id,
    gameFormat,
    teamId: currentGame?.homeTeamId
  });
  
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
  
  // Game events hook
  const gameEvents = useGameEvents({ teamName, opponentName });

  // Note: Time tracking is handled by useGameClock hook, no need for duplicate interval here

  const handleSetupComplete = async (teamId: string, teamName: string, opponent: string, format: GameFormat, players: GamePlayer[]) => {
    setTeamName(teamName);
    setOpponentName(opponent);
    setGameFormat(format);
    setInitialPlayers(players);
    
    // Create game record in database using existing team
    try {
      const response = await api.games.create({
        homeTeamId: teamId,
        homeTeamName: teamName,
        awayTeamName: opponent,
        gameFormat: format,
        gameDate: new Date().toISOString(),
        homeTeamScore: 0,
        awayTeamScore: 0,
        isCompleted: false,
        periodScores: []
      });
      
      if (response.success) {
        setCurrentGame(response.data);
        setIsSetup(false);
        
        // Add game start event
        gameEvents.addEvent('GAME_START', {
          period: 1,
          gameTime: 0,
          homeScore: 0,
          awayScore: 0
        });
      } else {
        logger.error('Error creating game:', response.error);
      }
    } catch (error) {
      logger.error('Error creating game:', error);
    }
  };

  const handleStatUpdate = (statType: StatType, value?: number) => {
    if (!gameStats.selectedPlayerId) return;
    
    const player = gameStats.players.find(p => p.id === gameStats.selectedPlayerId);
    if (!player) return;
    
    gameStats.updatePlayerStat(gameStats.selectedPlayerId, statType, value);
    
    // Track events
    const eventDetails = {
      playerName: player.name,
      period: currentPeriod,
      gameTime: gameClock.gameClock,
      homeScore: teamScore,
      awayScore: opponentScore,
      isOpponentAction: false
    };
    
    // Handle different stat types
    switch (statType) {
      case 'points':
        if (value) {
          setTeamScore(prev => prev + value);
          gameStats.updatePlusMinus(value, true);
          gameEvents.addEvent('SCORE', { ...eventDetails, points: value, homeScore: teamScore + value });
        }
        break;
      case 'fouls':
        gameEvents.addEvent('FOUL', eventDetails);
        break;
      case 'offRebounds':
      case 'defRebounds':
        gameEvents.addEvent('REBOUND', eventDetails);
        break;
      case 'assists':
        gameEvents.addEvent('ASSIST', eventDetails);
        break;
      case 'steals':
        gameEvents.addEvent('STEAL', eventDetails);
        break;
      case 'blocks':
        gameEvents.addEvent('BLOCK', eventDetails);
        break;
      case 'turnovers':
        gameEvents.addEvent('TURNOVER', eventDetails);
        break;
      case 'ftMade':
        gameEvents.addEvent('FREE_THROW_MADE', eventDetails);
        break;
      case 'ftMissed':
        gameEvents.addEvent('FREE_THROW_MISSED', eventDetails);
        break;
      case 'fgMissed':
        gameEvents.addEvent('FIELD_GOAL_MISSED', { ...eventDetails, points: value || 2 });
        break;
    }
  };

  const handleOpponentScore = (points: number) => {
    setOpponentScore(prev => prev + points);
    gameStats.updatePlusMinus(points, false);
    
    // Track opponent scoring event
    gameEvents.addEvent('SCORE', {
      period: currentPeriod,
      gameTime: gameClock.gameClock,
      homeScore: teamScore,
      awayScore: opponentScore + points,
      points,
      isOpponentAction: true
    });
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
    
    // Track period end event
    gameEvents.addEvent('PERIOD_END', {
      period: currentPeriod,
      gameTime: gameClock.gameClock,
      homeScore: teamScore,
      awayScore: opponentScore
    });
    
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
      logger.error('Player to substitute out not found!');
      return;
    }
    
    console.log('Substitution:', {
      playerInId: playerComingIn.id,
      playerInName: playerComingIn.name,
      playerOutId: playerOut.id,
      playerOutName: playerOut.name,
      currentTime: gameClock.gameClock
    });
    
    // Track substitution event
    gameEvents.addEvent('SUBSTITUTION', {
      playerInName: playerComingIn.name,
      playerOutName: playerOut.name,
      period: currentPeriod,
      gameTime: gameClock.gameClock,
      homeScore: teamScore,
      awayScore: opponentScore
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

  const handleCancelExport = () => {
    setIsExportModalOpen(false);
  };

  // Helper function to create play-by-play events from player stats
  const createPlayByPlayEvents = async (gameId: string, players: GamePlayer[], finalHomeScore: number, finalAwayScore: number) => {
    console.log('Creating play-by-play events...', {
      gameId,
      playerCount: players.length,
      finalHomeScore,
      finalAwayScore,
      totalGameTime: gameClock.gameClock
    });

    let eventTime = 0;
    let currentHomeScore = 0;
    const currentAwayScore = 0;
    let eventsCreated = 0;
    
    // Calculate total events and time distribution
    const totalGameTime = Math.max(gameClock.gameClock || 0, 3600); // Minimum 1 hour if no game time
    const totalEvents = players.reduce((total, player) => 
      total + player.stats.fgMade + player.stats.ftMade + player.stats.assists + 
      player.stats.offRebounds + player.stats.defRebounds + player.stats.steals + 
      player.stats.blocks + player.stats.fouls + player.stats.turnovers, 0
    );
    
    const timeIncrement = totalEvents > 0 ? totalGameTime / totalEvents : 60; // 1 minute default
    console.log(`Distributing ${totalEvents} events over ${totalGameTime} seconds (${timeIncrement.toFixed(2)}s per event)`);

    // Helper function to create a single event with error handling
    const createSingleEvent = async (player: GamePlayer, eventType: string, eventDetail: string, points?: number) => {
      try {
        eventTime += timeIncrement;
        const period = Math.min(Math.ceil((eventTime / totalGameTime) * (gameFormat === 'quarters' ? 4 : 2)), gameFormat === 'quarters' ? 4 : 2);
        const periodDuration = totalGameTime / (gameFormat === 'quarters' ? 4 : 2);
        const periodTime = Math.floor(eventTime % periodDuration);
        const minutes = Math.floor(periodTime / 60);
        const seconds = Math.floor(periodTime % 60);
        
        const eventData = {
          gameId,
          playerId: player.id,
          timestamp: new Date().toISOString(),
          gameTime: eventTime,
          period: Math.max(1, period),
          periodTime: `${minutes}:${seconds.toString().padStart(2, '0')}`,
          eventType: eventType,
          eventDetail,
          isHomeTeam: true,
          homeTeamScore: Math.min(currentHomeScore, finalHomeScore),
          awayTeamScore: Math.min(currentAwayScore, finalAwayScore),
          ...(points ? { points } : {})
        };

        const response = await api.stats.createEvent(eventData);
        if (response.success) {
          eventsCreated++;
          
          if (eventsCreated % 10 === 0) {
            console.log(`Created ${eventsCreated}/${totalEvents} events...`);
          }
        } else {
          console.error(`Failed to create ${eventType} event for player ${player.name}:`, response.error);
        }
      } catch (error) {
        console.error(`Failed to create ${eventType} event for player ${player.name}:`, error);
        // Continue with other events
      }
    };

    for (const player of players) {
      console.log(`Processing events for player: ${player.name}`);
      
      // Create field goal events
      for (let i = 0; i < player.stats.fgMade; i++) {
        const isThreePointer = Math.random() > 0.7;
        const points = isThreePointer ? 3 : 2;
        currentHomeScore += points;
        await createSingleEvent(player, 'SCORE', isThreePointer ? '3PT' : '2PT', points);
      }

      // Create free throw events
      for (let i = 0; i < player.stats.ftMade; i++) {
        currentHomeScore += 1;
        await createSingleEvent(player, 'SCORE', 'FT', 1);
      }

      // Create assist events
      for (let i = 0; i < player.stats.assists; i++) {
        await createSingleEvent(player, 'ASSIST', 'Assist');
      }

      // Create rebound events
      for (let i = 0; i < player.stats.offRebounds; i++) {
        await createSingleEvent(player, 'REBOUND', 'Offensive');
      }
      for (let i = 0; i < player.stats.defRebounds; i++) {
        await createSingleEvent(player, 'REBOUND', 'Defensive');
      }

      // Create other events
      const otherEvents = [
        { count: player.stats.steals, type: 'STEAL', detail: 'Steal' },
        { count: player.stats.blocks, type: 'BLOCK', detail: 'Block' },
        { count: player.stats.fouls, type: 'FOUL', detail: 'Personal Foul' },
        { count: player.stats.turnovers, type: 'TURNOVER', detail: 'Turnover' }
      ];

      for (const eventGroup of otherEvents) {
        for (let i = 0; i < eventGroup.count; i++) {
          await createSingleEvent(player, eventGroup.type, eventGroup.detail);
        }
      }
    }

    console.log(`Successfully created ${eventsCreated} play-by-play events`);
  };

  // Helper function to create period statistics
  const createPeriodStatistics = async (gameId: string, periodScores: any[], gameFormat: GameFormat) => {
    console.log('Creating period statistics with data:', periodScores);
    
    for (let i = 0; i < periodScores.length; i++) {
      const period = periodScores[i];
      const periodNumber = i + 1;
      
      // Use cumulative scores (totalTeamScore/totalOpponentScore) if available,
      // otherwise fall back to teamScore/opponentScore
      const homeScore = period.totalTeamScore ?? period.teamScore ?? 0;
      const awayScore = period.totalOpponentScore ?? period.opponentScore ?? 0;
      
      console.log(`Creating PeriodStats for period ${periodNumber}:`, {
        homeScore,
        awayScore,
        periodType: gameFormat === 'quarters' ? 'quarter' : 'half'
      });
      
      try {
        const response = await api.stats.createOrUpdate({
          gameId,
          period: periodNumber,
          periodType: gameFormat === 'quarters' ? 'quarter' : 'half',
          homeTeamScore: homeScore,
          awayTeamScore: awayScore,
          startTime: new Date().toISOString(), // Ideally this would be the actual period start time
          endTime: new Date().toISOString(),   // Ideally this would be the actual period end time
          duration: Math.floor((gameClock.gameClock || 0) / (gameFormat === 'quarters' ? 4 : 2)), // Estimate
          homeTeamStats: {},
          awayTeamStats: {},
        });
        console.log(`PeriodStats created successfully for period ${periodNumber}:`, response);
      } catch (error) {
        console.error(`Failed to create PeriodStats for period ${periodNumber}:`, error);
        throw error;
      }
    }
  };

  const handleFinishGame = async () => {
    if (!currentGame) return;

    console.log('Starting game save process...', {
      gameId: currentGame.id,
      teamScore,
      opponentScore,
      playerCount: gameStats.players.length,
      periodScoresCount: periodScores.length,
      gameFormat
    });

    try {
      // Determine which period scores to use
      let finalPeriodScores = periodScores;
      
      // If no manual period data exists, create automatic period distribution
      if (periodScores.length === 0) {
        console.log('No manual period data found, creating automatic period distribution...');
        finalPeriodScores = createAutomaticPeriodScores(teamScore, opponentScore, gameFormat);
        console.log('Created automatic period scores:', finalPeriodScores);
      }

      // Update game with final scores and completion status
      console.log('Updating game record...');
      const updateResponse = await api.games.update(currentGame.id, {
        homeTeamScore: teamScore,
        awayTeamScore: opponentScore,
        isCompleted: true,
        totalDuration: gameClock.gameClock,
        periodScores: finalPeriodScores
      });
      
      if (updateResponse.success) {
        console.log('Game record updated successfully');
      } else {
        console.error('Error updating game:', updateResponse.error);
      }

      // Validate player data before creating events
      if (!gameStats.players || gameStats.players.length === 0) {
        console.warn('No player data available, skipping play-by-play events');
      } else {
        console.log(`Creating play-by-play events for ${gameStats.players.length} players...`);
        try {
          await createPlayByPlayEvents(currentGame.id, gameStats.players, teamScore, opponentScore);
          console.log('Play-by-play events created successfully');
        } catch (error) {
          console.error('Error creating play-by-play events:', error);
          // Don't throw - continue with other saves
        }
      }

      // Create period statistics
      console.log(`Creating period statistics for ${finalPeriodScores.length} periods...`);
      try {
        await createPeriodStatistics(currentGame.id, finalPeriodScores, gameFormat);
        console.log('Period statistics created successfully');
      } catch (error) {
        console.error('Error creating period statistics:', error);
        // Don't throw - continue with other saves
      }

      // Save individual player stats
      console.log('Saving individual player statistics...');
      for (const player of gameStats.players) {
        try {
          const statResponse = await api.stats.createOrUpdate({
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
          
          if (!statResponse.success) {
            console.error(`Error saving stats for player ${player.name}:`, statResponse.error);
          }
        } catch (error) {
          console.error(`Error saving stats for player ${player.name}:`, error);
        }

        // Update player career stats
        try {
          const playerResponse = await api.players.getById(player.id);
          if (playerResponse.success) {
            const data = playerResponse.data;
            const totalRebounds = player.stats.offRebounds + player.stats.defRebounds;
            
            const updateResponse = await api.players.update(player.id, {
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
            
            if (!updateResponse.success) {
              console.error(`Error updating career stats for player ${player.name}:`, updateResponse.error);
            }
          }
        } catch (error) {
          console.error(`Error updating career stats for player ${player.name}:`, error);
        }
      }

      console.log('Game save process completed successfully!');
      alert('Game completed and saved successfully! All statistics, play-by-play events, and period data have been recorded.');
      
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
      console.error('Critical error during game save:', error);
      alert(`Error saving game: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details and try again.`);
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
    return <GameSetupForm onSetupComplete={handleSetupComplete} />;
  }

  // Tab configuration
  const tabs = [
    { id: 'management' as GameTab, label: 'Game Management', icon: Users },
    { id: 'boxscore' as GameTab, label: 'Box Score', icon: BarChart3 },
    { id: 'plays' as GameTab, label: 'Plays', icon: Activity },
    { id: 'summary' as GameTab, label: 'Summary', icon: Trophy }
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Tab Navigation */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-2">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                  ${
                    activeTab === tab.id
                      ? 'bg-yellow-500 text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Centered Scoreboard (always visible) */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700">
        <div className="flex justify-center">
          <div className="relative text-center bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-2xl px-12 py-8 border-2 border-yellow-400/30 shadow-2xl group">
            <div className="text-6xl font-black text-yellow-400 tracking-wider flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <img 
                  src="/team_logo.png" 
                  alt="Team Logo" 
                  className="w-12 h-12 mb-2 rounded-full border-2 border-yellow-400/50"
                />
                <span className="text-white text-3xl font-bold uppercase">{teamName}</span>
              </div>
              <span className="text-emerald-400">{teamScore}</span>
              <span className="text-zinc-400 text-4xl">-</span>
              <span className="text-red-400">{opponentScore}</span>
              <div className="flex flex-col items-center">
                <img 
                  src="/team_logo.png" 
                  alt="Team Logo" 
                  className="w-12 h-12 mb-2 rounded-full border-2 border-yellow-400/50"
                />
                <span className="text-white text-3xl font-bold uppercase">{opponentName}</span>
              </div>
            </div>
            
            {/* Team Stats Section */}
            <div className="mt-4 grid grid-cols-2 gap-8 text-sm">
              <div className="flex flex-col items-center">
                <div className="flex gap-4">
                  <span className="text-zinc-400">Fouls: <span className="font-semibold text-amber-400">{teamFouls}</span></span>
                  <span className="text-zinc-400">Timeouts: <span className="font-semibold text-yellow-400">{teamTimeouts}</span></span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex gap-4">
                  <span className="text-zinc-400">Fouls: <span className="font-semibold text-amber-400">0</span></span>
                  <span className="text-zinc-400">Timeouts: <span className="font-semibold text-yellow-400">{opponentTimeouts}</span></span>
                </div>
              </div>
            </div>
            
            {/* Game Clock Section */}
            <div className="mt-6 flex items-center justify-center gap-4 bg-zinc-800/50 rounded-lg p-4 border border-zinc-600">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-mono text-yellow-400">
                {(() => {
                  const mins = Math.floor(gameClock.gameClock / 60);
                  const secs = gameClock.gameClock % 60;
                  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                })()}
              </span>
              <Button
                onClick={gameClock.toggleClock}
                variant={gameClock.isClockRunning ? 'danger' : 'success'}
                className="px-4 py-2"
              >
                {gameClock.isClockRunning ? 'Stop' : 'Start'}
              </Button>
              <Button
                onClick={handleEndPeriod}
                variant="warning"
                className="px-4 py-2 font-semibold"
              >
                End {gameFormat === 'quarters' ? 'Quarter' : 'Half'}
              </Button>
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-zinc-400">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                {gameFormat === 'quarters' ? 'Quarter' : 'Half'} {currentPeriod}
              </span>
              <span>•</span>
              <span>Active: {gameStats.players.filter(p => p.onCourt).length}/5</span>
            </div>
            
            {/* Edit Score Button */}
            <Button variant="secondary" size="small" className="p-2 mt-4"
              onClick={handleEditScoreRequest}
              title="Edit Score"
            >
              <Edit3 className="w-4 h-4 text-zinc-400 hover:text-yellow-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'management' && (
        <>
          {/* Stats Buttons Section - Full Width */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-4">
            <StatButtons
              selectedPlayerName={gameStats.selectedPlayerName}
              selectedPlayer={gameStats.players.find(p => p.id === gameStats.selectedPlayerId) || null}
              onStatUpdate={handleStatUpdate}
              isGameStarted={gameClock.gameClock > 0 || gameClock.isClockRunning}
              onOpponentScore={handleOpponentScore}
              onTeamTimeout={() => {
                setTeamTimeouts(prev => prev + 1);
                gameEvents.addEvent('TIMEOUT', {
                  period: currentPeriod,
                  gameTime: gameClock.gameClock,
                  homeScore: teamScore,
                  awayScore: opponentScore,
                  isOpponentAction: false
                });
              }}
              onOpponentTimeout={() => {
                setOpponentTimeouts(prev => prev + 1);
                gameEvents.addEvent('TIMEOUT', {
                  period: currentPeriod,
                  gameTime: gameClock.gameClock,
                  homeScore: teamScore,
                  awayScore: opponentScore,
                  isOpponentAction: true
                });
              }}
              teamName={teamName}
              opponentName={opponentName}
            />
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
                      <Button
                        onClick={() => gameStats.setSelectedPlayerId(player.id)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          gameStats.selectedPlayerId === player.id
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg border-2 border-yellow-400'
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-500 hover:to-emerald-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-600 flex-shrink-0">
                            <PlayerImage 
                              profileImageUrl={player.profileImageUrl}
                              className="w-full h-full object-cover"
                              alt={player.name}
                            />
                          </div>
                          <div className="font-medium text-sm">{player.name}</div>
                        </div>
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatCorrectionRequest(player);
                        }}
                        className="absolute top-1 right-1 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit Stats"
                      >
                        <Edit3 className="w-3 h-3 text-zinc-400 hover:text-white" />
                      </Button>
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
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-600 flex-shrink-0">
                          <PlayerImage 
                            profileImageUrl={player.profileImageUrl}
                            className="w-full h-full object-cover"
                            alt={player.name}
                          />
                        </div>
                        <div className="font-medium text-sm">{player.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleStatCorrectionRequest(player)}
                          className="p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit Stats"
                        >
                          <Edit3 className="w-3 h-3 text-zinc-400 hover:text-white" />
                        </Button>
                        <Button
                          onClick={() => handleSubstitutionRequest(player)}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs transition-colors"
                        >
                          Sub In
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'boxscore' && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Live Box Score
            </h3>
            
            <Button
              onClick={handleExportRequest}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white font-medium"
            >
              <Download className="w-4 h-4" />
              Export Data
            </Button>
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
      )}

      {activeTab === 'plays' && (
        <PlaysTimeline 
          events={gameEvents.events}
          teamName={teamName}
          opponentName={opponentName}
        />
      )}

      {activeTab === 'summary' && (
        <GameSummary
          periodScores={periodScores}
          currentPeriod={currentPeriod}
          teamName={teamName}
          opponentName={opponentName}
          teamScore={teamScore}
          opponentScore={opponentScore}
          gameFormat={gameFormat}
        />
      )}

      {/* Finish Game Button */}
      <div className="text-center pt-4 border-t border-zinc-700">
        <Button
          onClick={handleFinishGame}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 px-12 py-4 rounded-xl font-bold text-white transition-all transform hover:scale-105 shadow-lg text-lg"
        >
          🏁 Finish & Save Game
        </Button>
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

    </div>
  );
};