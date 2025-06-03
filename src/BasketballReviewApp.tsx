import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Upload, Users, Clock, Award, Edit2, Check, X, Timer, AlertCircle } from 'lucide-react';

interface PlayerStats {
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
}

interface Player {
  id: number;
  name: string;
  onCourt: boolean;
  stats: PlayerStats;
  startTime: number | null;
}

interface PeriodScore {
  period: number;
  periodLabel: string;
  teamScore: number;
  opponentScore: number;
  totalTeamScore: number;
  totalOpponentScore: number;
}

const BasketballReviewApp = () => {
  // Initial setup state
  const [isSetup, setIsSetup] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [gameFormat, setGameFormat] = useState<'quarters' | 'halves'>('quarters');
  
  // Video state
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Game state
  const [gameClock, setGameClock] = useState(0);
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [teamTimeouts, setTeamTimeouts] = useState(0);
  const [opponentTimeouts, setOpponentTimeouts] = useState(0);
  const [periodScores, setPeriodScores] = useState<PeriodScore[]>([]);
  const [periodStartScore, setPeriodStartScore] = useState({ team: 0, opponent: 0 });
  
  // Players state
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Player 1', onCourt: true, stats: { points: 0, fouls: 0, turnovers: 0, offRebounds: 0, defRebounds: 0, assists: 0, steals: 0, blocks: 0, fgMade: 0, fgAttempts: 0, ftMade: 0, ftAttempts: 0, plusMinus: 0, timeOnCourt: 0 }, startTime: 0 },
    { id: 2, name: 'Player 2', onCourt: true, stats: { points: 0, fouls: 0, turnovers: 0, offRebounds: 0, defRebounds: 0, assists: 0, steals: 0, blocks: 0, fgMade: 0, fgAttempts: 0, ftMade: 0, ftAttempts: 0, plusMinus: 0, timeOnCourt: 0 }, startTime: 0 },
    { id: 3, name: 'Player 3', onCourt: true, stats: { points: 0, fouls: 0, turnovers: 0, offRebounds: 0, defRebounds: 0, assists: 0, steals: 0, blocks: 0, fgMade: 0, fgAttempts: 0, ftMade: 0, ftAttempts: 0, plusMinus: 0, timeOnCourt: 0 }, startTime: 0 },
    { id: 4, name: 'Player 4', onCourt: true, stats: { points: 0, fouls: 0, turnovers: 0, offRebounds: 0, defRebounds: 0, assists: 0, steals: 0, blocks: 0, fgMade: 0, fgAttempts: 0, ftMade: 0, ftAttempts: 0, plusMinus: 0, timeOnCourt: 0 }, startTime: 0 },
    { id: 5, name: 'Player 5', onCourt: true, stats: { points: 0, fouls: 0, turnovers: 0, offRebounds: 0, defRebounds: 0, assists: 0, steals: 0, blocks: 0, fgMade: 0, fgAttempts: 0, ftMade: 0, ftAttempts: 0, plusMinus: 0, timeOnCourt: 0 }, startTime: 0 },
    { id: 6, name: 'Player 6', onCourt: false, stats: { points: 0, fouls: 0, turnovers: 0, offRebounds: 0, defRebounds: 0, assists: 0, steals: 0, blocks: 0, fgMade: 0, fgAttempts: 0, ftMade: 0, ftAttempts: 0, plusMinus: 0, timeOnCourt: 0 }, startTime: null },
    { id: 7, name: 'Player 7', onCourt: false, stats: { points: 0, fouls: 0, turnovers: 0, offRebounds: 0, defRebounds: 0, assists: 0, steals: 0, blocks: 0, fgMade: 0, fgAttempts: 0, ftMade: 0, ftAttempts: 0, plusMinus: 0, timeOnCourt: 0 }, startTime: null },
    { id: 8, name: 'Player 8', onCourt: false, stats: { points: 0, fouls: 0, turnovers: 0, offRebounds: 0, defRebounds: 0, assists: 0, steals: 0, blocks: 0, fgMade: 0, fgAttempts: 0, ftMade: 0, ftAttempts: 0, plusMinus: 0, timeOnCourt: 0 }, startTime: null },
  ]);
  
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<number | null>(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [teamScore, setTeamScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [showSubModal, setShowSubModal] = useState(false);
  const [playerSubbingIn, setPlayerSubbingIn] = useState<number | null>(null);
  
  // Calculate team fouls
  const teamFouls = players.reduce((total, player) => total + player.stats.fouls, 0);
  
  // Get period label
  const getPeriodLabel = () => {
    if (gameFormat === 'quarters') {
      return `Q${currentPeriod}`;
    } else {
      return `Half ${currentPeriod}`;
    }
  };
  
  const getMaxPeriods = () => {
    return gameFormat === 'quarters' ? 4 : 2;
  };
  
  // End period function
  const endPeriod = () => {
    const periodScore: PeriodScore = {
      period: currentPeriod,
      periodLabel: getPeriodLabel(),
      teamScore: teamScore - periodStartScore.team,
      opponentScore: opponentScore - periodStartScore.opponent,
      totalTeamScore: teamScore,
      totalOpponentScore: opponentScore
    };
    
    setPeriodScores([...periodScores, periodScore]);
    setPeriodStartScore({ team: teamScore, opponent: opponentScore });
    
    if (currentPeriod < getMaxPeriods()) {
      setCurrentPeriod(currentPeriod + 1);
    }
    
    // Stop the clock and reset it for the new period
    setIsClockRunning(false);
    setGameClock(0);
  };
  
  // Setup handler
  const handleSetupComplete = () => {
    if (teamName.trim() && opponentName.trim()) {
      setIsSetup(false);
    }
  };
  
  // Player name editing
  const startEditingPlayer = (playerId: number, currentName: string) => {
    setEditingPlayer(playerId);
    setEditPlayerName(currentName);
  };
  
  const savePlayerName = () => {
    if (editPlayerName.trim()) {
      setPlayers(prevPlayers =>
        prevPlayers.map(player =>
          player.id === editingPlayer
            ? { ...player, name: editPlayerName.trim() }
            : player
        )
      );
    }
    setEditingPlayer(null);
    setEditPlayerName('');
  };
  
  const cancelEditingPlayer = () => {
    setEditingPlayer(null);
    setEditPlayerName('');
  };
  
  // Video controls
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };
  
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };
  
  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };
  
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (Number(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  // Game clock
  useEffect(() => {
    let interval;
    if (isClockRunning) {
      interval = setInterval(() => {
        setGameClock(prev => prev + 1);
        // Update time for players on court
        setPlayers(prevPlayers => 
          prevPlayers.map(player => {
            if (player.onCourt) {
              return {
                ...player,
                stats: {
                  ...player.stats,
                  timeOnCourt: player.stats.timeOnCourt + 1
                }
              };
            }
            return player;
          })
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockRunning]);
  
  // Player stats functions
  const addStat = (statType: string, value = 1) => {
    if (!selectedPlayer) return;
    
    setPlayers(prevPlayers => 
      prevPlayers.map(player => {
        if (player.id === selectedPlayer) {
          const newStats = { ...player.stats };
          
          switch (statType) {
            case 'points':
              newStats.points += value;
              setTeamScore(prev => prev + value);
              // Update plus/minus for all players on court
              updatePlusMinus(value, true);
              break;
            case 'fgMade':
              newStats.fgMade += 1;
              newStats.fgAttempts += 1;
              break;
            case 'fgMissed':
              newStats.fgAttempts += 1;
              break;
            case 'ftMade':
              newStats.ftMade += 1;
              newStats.ftAttempts += 1;
              break;
            case 'ftMissed':
              newStats.ftAttempts += 1;
              break;
            default:
              newStats[statType] = (newStats[statType] || 0) + 1;
          }
          
          return { ...player, stats: newStats };
        }
        return player;
      })
    );
  };
  
  const updatePlusMinus = (points: number, isTeamScore: boolean) => {
    const plusMinusChange = isTeamScore ? points : -points;
    setPlayers(prevPlayers => 
      prevPlayers.map(player => {
        if (player.onCourt) {
          return {
            ...player,
            stats: {
              ...player.stats,
              plusMinus: player.stats.plusMinus + plusMinusChange
            }
          };
        }
        return player;
      })
    );
  };
  
  const addOpponentScore = (points: number) => {
    setOpponentScore(prev => prev + points);
    updatePlusMinus(points, false);
  };
  
  // Substitution
  const initiateSubstitution = (playerInId: number) => {
    setPlayerSubbingIn(playerInId);
    setShowSubModal(true);
  };
  
  const completeSubstitution = (playerOutId: number) => {
    if (playerSubbingIn) {
      substitutePlayer(playerSubbingIn, playerOutId);
      setShowSubModal(false);
      setPlayerSubbingIn(null);
      setSelectedPlayer(null);
    }
  };
  
  const substitutePlayer = (playerInId: number, playerOutId: number) => {
    setPlayers(prevPlayers => 
      prevPlayers.map(player => {
        if (player.id === playerOutId) {
          return {
            ...player,
            onCourt: false,
            startTime: null
          };
        } else if (player.id === playerInId) {
          return {
            ...player,
            onCourt: true,
            startTime: gameClock
          };
        }
        return player;
      })
    );
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const calculatePercentage = (made: number, attempts: number) => {
    if (attempts === 0) return '0.0';
    return ((made / attempts) * 100).toFixed(1);
  };
  
  // Setup screen
  if (isSetup) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-lg p-8 max-w-2xl w-full border border-slate-700">
          <h1 className="text-3xl font-bold mb-8 text-center text-yellow-400">Basketball Game Setup</h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Your Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter your team name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Opponent Team Name</label>
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter opponent team name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Game Format</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setGameFormat('quarters')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gameFormat === 'quarters'
                      ? 'border-yellow-500 bg-yellow-500 bg-opacity-20'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-800'
                  }`}
                >
                  <div className="font-semibold text-white">4 Quarters</div>
                  <div className="text-sm text-slate-400">NBA, High School</div>
                </button>
                <button
                  onClick={() => setGameFormat('halves')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gameFormat === 'halves'
                      ? 'border-yellow-500 bg-yellow-500 bg-opacity-20'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-800'
                  }`}
                >
                  <div className="font-semibold text-white">2 Halves</div>
                  <div className="text-sm text-slate-400">College Basketball</div>
                </button>
              </div>
            </div>
            
            <div className="mt-8">
              <button
                onClick={handleSetupComplete}
                className="w-full bg-yellow-500 hover:bg-yellow-600 py-3 rounded-lg font-semibold text-lg text-black transition-colors"
                disabled={!teamName.trim() || !opponentName.trim()}
              >
                Start Game Review
              </button>
            </div>
            
            <p className="text-sm text-slate-400 text-center mt-4">
              You can edit player names during the game by clicking the edit icon next to their name
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400">Basketball Game Review</h1>
          <p className="text-xl text-slate-400 mt-2">{teamName} vs {opponentName}</p>
        </div>
        
        {/* Substitution Modal */}
        {showSubModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
              <h3 className="text-xl font-semibold mb-4 text-yellow-400">
                Who is {players.find(p => p.id === playerSubbingIn)?.name} replacing?
              </h3>
              <div className="space-y-2">
                {players.filter(p => p.onCourt).map(player => (
                  <button
                    key={player.id}
                    onClick={() => completeSubstitution(player.id)}
                    className="w-full bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-left flex justify-between items-center transition-colors"
                  >
                    <span>{player.name}</span>
                    <span className="text-sm text-slate-400">
                      {formatTime(player.stats.timeOnCourt)}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowSubModal(false);
                  setPlayerSubbingIn(null);
                }}
                className="mt-4 w-full bg-slate-700 hover:bg-slate-600 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Section */}
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-yellow-400">
              <Play className="w-5 h-5" />
              Video Player
            </h2>
            
            {!videoSrc ? (
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center bg-slate-800">
                <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <label className="cursor-pointer">
                  <span className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg inline-block text-black font-semibold transition-colors">
                    Upload Video
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div>
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="w-full rounded-lg mb-4"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                />
                
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={duration ? (currentTime / duration) * 100 : 0}
                    onChange={handleSeek}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-slate-400 mt-1">
                    <span>{formatTime(Math.floor(currentTime))}</span>
                    <span>{formatTime(Math.floor(duration))}</span>
                  </div>
                </div>
                
                <div className="flex justify-center gap-4">
                  <button
                    onClick={skipBackward}
                    className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-colors"
                  >
                    <SkipBack className="w-6 h-6" />
                  </button>
                  <button
                    onClick={togglePlayPause}
                    className="bg-yellow-500 hover:bg-yellow-600 p-2 rounded-lg text-black transition-colors"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={skipForward}
                    className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-colors"
                  >
                    <SkipForward className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Game Controls */}
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-yellow-400">
                <Clock className="w-5 h-5" />
                Game Clock - {getPeriodLabel()}
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPeriod(Math.max(1, currentPeriod - 1))}
                    className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-sm transition-colors"
                    disabled={currentPeriod === 1}
                  >
                    -
                  </button>
                  <span className="text-lg font-semibold text-yellow-400">{getPeriodLabel()}</span>
                  <button
                    onClick={() => setCurrentPeriod(Math.min(getMaxPeriods(), currentPeriod + 1))}
                    className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-sm transition-colors"
                    disabled={currentPeriod === getMaxPeriods()}
                  >
                    +
                  </button>
                </div>
                <span className="text-2xl font-mono text-yellow-400">{formatTime(gameClock)}</span>
                <button
                  onClick={() => setIsClockRunning(!isClockRunning)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isClockRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isClockRunning ? 'Stop' : 'Start'}
                </button>
              </div>
            </div>
            
            <div className="flex justify-center mb-2">
              <button
                onClick={endPeriod}
                className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                End {gameFormat === 'quarters' ? 'Quarter' : 'Half'}
              </button>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-600">
              <div className="text-center text-3xl font-bold mb-2">
                <span className="text-yellow-400">{teamName}: {teamScore}</span>
                <span className="mx-3 text-slate-400">-</span>
                <span className="text-orange-400">{opponentName}: {opponentScore}</span>
              </div>
              
              <div className="flex justify-center items-center gap-4 mb-2">
                <div className="text-sm">
                  <span className="text-slate-400">Team Fouls:</span>
                  <span className="ml-2 font-semibold text-amber-400">{teamFouls}</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">Timeouts:</span>
                  <span className="ml-2 font-semibold text-yellow-400">{teamTimeouts}</span>
                </div>
              </div>
              
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => addOpponentScore(1)}
                  className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm transition-colors"
                >
                  {opponentName} +1
                </button>
                <button
                  onClick={() => addOpponentScore(2)}
                  className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm transition-colors"
                >
                  {opponentName} +2
                </button>
                <button
                  onClick={() => addOpponentScore(3)}
                  className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm transition-colors"
                >
                  {opponentName} +3
                </button>
              </div>
            </div>
            
            {/* Period Scores */}
            {periodScores.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-3 mb-4 border border-slate-600">
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
            
            {/* Timeout buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setTeamTimeouts(prev => prev + 1)}
                className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Timer className="w-4 h-4" />
                {teamName} Timeout
              </button>
              <button
                onClick={() => setOpponentTimeouts(prev => prev + 1)}
                className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Timer className="w-4 h-4" />
                {opponentName} Timeout
              </button>
            </div>
            
            {/* Stat Buttons */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
              <h3 className="text-lg font-semibold mb-3 text-yellow-400">
                {selectedPlayer ? `Recording for: ${players.find(p => p.id === selectedPlayer)?.name}` : 'Select a player first'}
              </h3>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => { addStat('points', 1); addStat('ftMade'); }}
                  className="bg-emerald-600 hover:bg-emerald-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  disabled={!selectedPlayer}
                >
                  1 PT (FT Made)
                </button>
                <button
                  onClick={() => { addStat('points', 2); addStat('fgMade'); }}
                  className="bg-emerald-600 hover:bg-emerald-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  disabled={!selectedPlayer}
                >
                  2 PTS
                </button>
                <button
                  onClick={() => { addStat('points', 3); addStat('fgMade'); }}
                  className="bg-emerald-600 hover:bg-emerald-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  disabled={!selectedPlayer}
                >
                  3 PTS
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => addStat('fgMissed')}
                  className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  disabled={!selectedPlayer}
                >
                  FG Miss
                </button>
                <button
                  onClick={() => addStat('ftMissed')}
                  className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  disabled={!selectedPlayer}
                >
                  FT Miss
                </button>
                <button
                  onClick={() => addStat('turnovers')}
                  className="bg-red-600 hover:bg-red-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  disabled={!selectedPlayer}
                >
                  Turnover
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => addStat('assists')}
                  className="bg-cyan-600 hover:bg-cyan-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  disabled={!selectedPlayer}
                >
                  Assist
                </button>
                <button
                  onClick={() => addStat('offRebounds')}
                  className="bg-cyan-600 hover:bg-cyan-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  disabled={!selectedPlayer}
                >
                  Off Reb
                </button>
                <button
                  onClick={() => addStat('defRebounds')}
                  className="bg-cyan-600 hover:bg-cyan-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  disabled={!selectedPlayer}
                >
                  Def Reb
                </button>
                <button
                  onClick={() => addStat('steals')}
                  className="bg-indigo-600 hover:bg-indigo-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  disabled={!selectedPlayer}
                >
                  Steal
                </button>
                <button
                  onClick={() => addStat('blocks')}
                  className="bg-indigo-600 hover:bg-indigo-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  disabled={!selectedPlayer}
                >
                  Block
                </button>
                <button
                  onClick={() => addStat('fouls')}
                  className="bg-amber-600 hover:bg-amber-700 p-2 rounded text-sm transition-colors disabled:opacity-50"
                  disabled={!selectedPlayer}
                >
                  Foul
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Period Summary */}
        {periodScores.length > 0 && (
          <div className="mt-6 bg-slate-900 rounded-lg p-4 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-yellow-400">
              <Award className="w-5 h-5" />
              Game Summary by {gameFormat === 'quarters' ? 'Quarter' : 'Half'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2 text-slate-300">Team</th>
                    {periodScores.map((period, index) => (
                      <th key={index} className="text-center px-4 text-slate-300">{period.periodLabel}</th>
                    ))}
                    <th className="text-center px-4 font-bold text-yellow-400">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-700">
                    <td className="py-2 font-semibold text-yellow-400">{teamName}</td>
                    {periodScores.map((period, index) => (
                      <td key={index} className="text-center px-4 text-slate-300">{period.teamScore}</td>
                    ))}
                    <td className="text-center px-4 font-bold text-yellow-400">{teamScore}</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="py-2 font-semibold text-orange-400">{opponentName}</td>
                    {periodScores.map((period, index) => (
                      <td key={index} className="text-center px-4 text-slate-300">{period.opponentScore}</td>
                    ))}
                    <td className="text-center px-4 font-bold text-orange-400">{opponentScore}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Players and Stats */}
        <div className="mt-6 bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-yellow-400">
              <Users className="w-5 h-5" />
              {teamName} Players & Box Score
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-slate-300">Team Fouls: <span className="text-amber-400">{teamFouls}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-slate-300">Timeouts: <span className="text-yellow-400">{teamTimeouts}</span></span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* On Court */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-emerald-400">On Court</h3>
              <div className="space-y-2">
                {players.filter(p => p.onCourt).map(player => (
                  <div
                    key={player.id}
                    onClick={() => setSelectedPlayer(player.id)}
                    className={`bg-slate-800 p-2 rounded cursor-pointer transition-all ${
                      selectedPlayer === player.id ? 'ring-2 ring-yellow-500 bg-slate-700' : 'hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {editingPlayer === player.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editPlayerName}
                              onChange={(e) => setEditPlayerName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && savePlayerName()}
                              className="bg-slate-600 px-2 py-1 rounded text-sm text-white border border-slate-500 focus:border-yellow-500 focus:outline-none"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                savePlayerName();
                              }}
                              className="text-emerald-500 hover:text-emerald-400"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEditingPlayer();
                              }}
                              className="text-red-500 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium text-white">{player.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingPlayer(player.id, player.name);
                              }}
                              className="text-slate-400 hover:text-white"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                      <span className="text-sm text-slate-400">
                        {formatTime(player.stats.timeOnCourt)} | +/- <span className={player.stats.plusMinus >= 0 ? 'text-emerald-400' : 'text-red-400'}>{player.stats.plusMinus > 0 ? '+' : ''}{player.stats.plusMinus}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Bench */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-slate-400">Bench</h3>
              <div className="space-y-2">
                {players.filter(p => !p.onCourt).map(player => (
                  <div
                    key={player.id}
                    className="bg-slate-800 p-2 rounded"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {editingPlayer === player.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editPlayerName}
                              onChange={(e) => setEditPlayerName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && savePlayerName()}
                              className="bg-slate-600 px-2 py-1 rounded text-sm text-white border border-slate-500 focus:border-yellow-500 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => savePlayerName()}
                              className="text-emerald-500 hover:text-emerald-400"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => cancelEditingPlayer()}
                              className="text-red-500 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium text-white">{player.name}</span>
                            <button
                              onClick={() => startEditingPlayer(player.id, player.name)}
                              className="text-slate-400 hover:text-white"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => initiateSubstitution(player.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded text-xs transition-colors"
                      >
                        Sub In
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Box Score Table */}
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
                    <td className="py-2 text-white">{player.name}</td>
                    <td className="text-center text-slate-300">{formatTime(player.stats.timeOnCourt)}</td>
                    <td className="text-center font-semibold text-yellow-400">{player.stats.points}</td>
                    <td className="text-center text-slate-300">{player.stats.fgMade}/{player.stats.fgAttempts}</td>
                    <td className="text-center text-slate-300">{calculatePercentage(player.stats.fgMade, player.stats.fgAttempts)}%</td>
                    <td className="text-center text-slate-300">{player.stats.ftMade}/{player.stats.ftAttempts}</td>
                    <td className="text-center text-slate-300">{calculatePercentage(player.stats.ftMade, player.stats.ftAttempts)}%</td>
                    <td className="text-center text-slate-300">{player.stats.offRebounds + player.stats.defRebounds}</td>
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
        </div>
      </div>
    </div>
  );
};

export default BasketballReviewApp; 