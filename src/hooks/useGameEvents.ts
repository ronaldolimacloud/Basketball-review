import { useState, useCallback } from 'react';

export type EventType = 
  | 'GAME_START'
  | 'SCORE'
  | 'FOUL'
  | 'REBOUND'
  | 'ASSIST'
  | 'STEAL'
  | 'BLOCK'
  | 'TURNOVER'
  | 'TIMEOUT'
  | 'SUBSTITUTION'
  | 'PERIOD_END'
  | 'FREE_THROW_MADE'
  | 'FREE_THROW_MISSED'
  | 'FIELD_GOAL_MISSED';

export interface GameEvent {
  id: string;
  timestamp: number;
  gameTime: number;
  period: number;
  eventType: EventType;
  teamName: string;
  playerName?: string;
  playerInName?: string;
  playerOutName?: string;
  points?: number;
  description: string;
  homeScore: number;
  awayScore: number;
}

interface UseGameEventsProps {
  teamName: string;
  opponentName: string;
}

export const useGameEvents = ({ teamName, opponentName }: UseGameEventsProps) => {
  const [events, setEvents] = useState<GameEvent[]>([]);

  const addEvent = useCallback((
    eventType: EventType,
    details: {
      playerName?: string;
      playerInName?: string;
      playerOutName?: string;
      points?: number;
      period: number;
      gameTime: number;
      homeScore: number;
      awayScore: number;
      isOpponentAction?: boolean;
    }
  ) => {
    const newEvent: GameEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      gameTime: details.gameTime,
      period: details.period,
      eventType,
      teamName: details.isOpponentAction ? opponentName : teamName,
      playerName: details.playerName,
      playerInName: details.playerInName,
      playerOutName: details.playerOutName,
      points: details.points,
      homeScore: details.homeScore,
      awayScore: details.awayScore,
      description: generateDescription(eventType, details, teamName, opponentName)
    };

    setEvents(prev => [...prev, newEvent]);
  }, [teamName, opponentName]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const getEventsByPeriod = useCallback((period: number) => {
    return events.filter(event => event.period === period);
  }, [events]);

  const getRecentEvents = useCallback((count: number = 10) => {
    return events.slice(-count).reverse();
  }, [events]);

  return {
    events,
    addEvent,
    clearEvents,
    getEventsByPeriod,
    getRecentEvents
  };
};

function generateDescription(
  eventType: EventType, 
  details: any,
  teamName: string,
  opponentName: string
): string {
  const team = details.isOpponentAction ? opponentName : teamName;
  
  switch (eventType) {
    case 'GAME_START':
      return 'Game Started';
    
    case 'SCORE':
      return `${details.playerName} scores ${details.points} ${details.points === 1 ? 'point' : 'points'}`;
    
    case 'FREE_THROW_MADE':
      return `${details.playerName} makes free throw`;
    
    case 'FREE_THROW_MISSED':
      return `${details.playerName} misses free throw`;
    
    case 'FIELD_GOAL_MISSED':
      return `${details.playerName} misses ${details.points === 3 ? '3-pointer' : '2-pointer'}`;
    
    case 'FOUL':
      return `${details.playerName} personal foul`;
    
    case 'REBOUND':
      return `${details.playerName} rebound`;
    
    case 'ASSIST':
      return `${details.playerName} assist`;
    
    case 'STEAL':
      return `${details.playerName} steal`;
    
    case 'BLOCK':
      return `${details.playerName} block`;
    
    case 'TURNOVER':
      return `${details.playerName} turnover`;
    
    case 'TIMEOUT':
      return `${team} timeout`;
    
    case 'SUBSTITUTION':
      return `${details.playerInName} in for ${details.playerOutName}`;
    
    case 'PERIOD_END':
      return `End of ${details.period === 1 || details.period === 3 ? 'quarter' : 'period'} ${details.period}`;
    
    default:
      return 'Unknown event';
  }
}