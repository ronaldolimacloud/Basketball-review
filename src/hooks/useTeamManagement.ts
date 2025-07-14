import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface Team {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  playerCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlayerWithTeam {
  id: string;
  name: string;
  position?: string;
  profileImageUrl?: string;
  isActive: boolean;
  teams: Team[];
  currentTeamId?: string;
}

interface UseTeamManagementResult {
  teams: Team[];
  players: PlayerWithTeam[];
  selectedTeamId: string | null;
  loading: boolean;
  
  // Team operations
  createTeam: (name: string, description?: string, logoUrl?: string) => Promise<Team | null>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<boolean>;
  deleteTeam: (teamId: string) => Promise<boolean>;
  setSelectedTeamId: (teamId: string | null) => void;
  
  // Player-team operations
  assignPlayerToTeam: (playerId: string, teamId: string) => Promise<boolean>;
  removePlayerFromTeam: (playerId: string, teamId: string) => Promise<boolean>;
  transferPlayer: (playerId: string, fromTeamId: string, toTeamId: string) => Promise<boolean>;
  
  // Data fetching
  fetchTeams: () => Promise<void>;
  fetchPlayersWithTeams: () => Promise<void>;
  getTeamPlayers: (teamId: string) => PlayerWithTeam[];
  getUnassignedPlayers: () => PlayerWithTeam[];
}

export const useTeamManagement = (): UseTeamManagementResult => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all teams
  const fetchTeams = useCallback(async () => {
    try {
      const response = await api.teams.list();
      if (response.success) {
        const teamsData = (response.data || []).map((team: any) => ({
          id: team.id,
          name: team.name,
          description: team.description || undefined,
          logoUrl: team.logoUrl || undefined,
          isActive: team.isActive || true,
          playerCount: team.players?.length || 0,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt
        }));
        setTeams(teamsData);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, []);

  // Fetch all players with their team associations
  const fetchPlayersWithTeams = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get both players and teams
      const [playersResponse, teamsResponse] = await Promise.all([
        api.players.list(),
        api.teams.list()
      ]);
      
      if (playersResponse.success && teamsResponse.success) {
        const allTeams = teamsResponse.data || [];
        const allPlayers = playersResponse.data || [];
        
        // Create a map of player ID to teams they belong to
        const playerTeamsMap = new Map<string, Team[]>();
        
        allTeams.forEach((team: any) => {
          if (team.players && Array.isArray(team.players)) {
            team.players.forEach((playerId: string) => {
              if (!playerTeamsMap.has(playerId)) {
                playerTeamsMap.set(playerId, []);
              }
              playerTeamsMap.get(playerId)!.push({
                id: team.id,
                name: team.name,
                description: team.description || undefined,
                logoUrl: team.logoUrl || undefined,
                isActive: team.isActive || true,
                playerCount: team.players?.length || 0
              });
            });
          }
        });
        
        // Map players with their teams
        const playersWithTeams: PlayerWithTeam[] = allPlayers.map((player: any) => ({
          id: player.id,
          name: player.name,
          position: player.position || undefined,
          profileImageUrl: player.profileImageUrl || undefined,
          isActive: player.isActive || true,
          teams: playerTeamsMap.get(player.id) || [],
          currentTeamId: playerTeamsMap.get(player.id)?.[0]?.id
        }));
        
        setPlayers(playersWithTeams);
      }
    } catch (error) {
      console.error('Error fetching players with teams:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new team
  const createTeam = useCallback(async (name: string, description?: string, logoUrl?: string): Promise<Team | null> => {
    try {
      const response = await api.teams.create({
        name: name.trim(),
        description: description?.trim(),
        logoUrl: logoUrl?.trim(),
        isActive: true
      });

      if (response.success && response.data) {
        const newTeam: Team = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description || undefined,
          logoUrl: response.data.logoUrl || undefined,
          isActive: response.data.isActive || true,
          playerCount: 0
        };
        
        setTeams(prev => [...prev, newTeam]);
        return newTeam;
      }
      return null;
    } catch (error) {
      console.error('Error creating team:', error);
      return null;
    }
  }, []);

  // Update team
  const updateTeam = useCallback(async (teamId: string, updates: Partial<Team>): Promise<boolean> => {
    try {
      const response = await api.teams.update(teamId, updates);

      if (response.success) {
        setTeams(prev => prev.map(team => 
          team.id === teamId ? { ...team, ...updates } : team
        ));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating team:', error);
      return false;
    }
  }, []);

  // Delete team
  const deleteTeam = useCallback(async (teamId: string): Promise<boolean> => {
    try {
      const response = await api.teams.delete(teamId);
      
      if (response.success) {
        setTeams(prev => prev.filter(team => team.id !== teamId));
        
        if (selectedTeamId === teamId) {
          setSelectedTeamId(null);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting team:', error);
      return false;
    }
  }, [selectedTeamId]);

  // Assign player to team
  const assignPlayerToTeam = useCallback(async (playerId: string, teamId: string): Promise<boolean> => {
    try {
      console.log(`Assigning player ${playerId} to team ${teamId}`);
      const response = await api.teams.addPlayer(teamId, playerId);
      if (response.success) {
        // Refresh both teams and players to ensure UI is in sync
        await Promise.all([fetchTeams(), fetchPlayersWithTeams()]);
        return true;
      } else {
        console.error('Failed to assign player to team:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Error assigning player to team:', error);
      return false;
    }
  }, [fetchTeams, fetchPlayersWithTeams]);

  // Remove player from team
  const removePlayerFromTeam = useCallback(async (playerId: string, teamId: string): Promise<boolean> => {
    try {
      console.log(`Removing player ${playerId} from team ${teamId}`);
      const response = await api.teams.removePlayer(teamId, playerId);
      if (response.success) {
        // Refresh both teams and players to ensure UI is in sync
        await Promise.all([fetchTeams(), fetchPlayersWithTeams()]);
        return true;
      } else {
        console.error('Failed to remove player from team:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Error removing player from team:', error);
      return false;
    }
  }, [fetchTeams, fetchPlayersWithTeams]);

  // Transfer player between teams
  const transferPlayer = useCallback(async (playerId: string, fromTeamId: string, toTeamId: string): Promise<boolean> => {
    try {
      const removeSuccess = await removePlayerFromTeam(playerId, fromTeamId);
      if (removeSuccess) {
        return await assignPlayerToTeam(playerId, toTeamId);
      }
      return false;
    } catch (error) {
      console.error('Error transferring player:', error);
      return false;
    }
  }, [removePlayerFromTeam, assignPlayerToTeam]);

  // Get players for a specific team
  const getTeamPlayers = useCallback((teamId: string): PlayerWithTeam[] => {
    return players.filter(player => 
      player.teams.some(team => team.id === teamId)
    );
  }, [players]);

  // Get unassigned players
  const getUnassignedPlayers = useCallback((): PlayerWithTeam[] => {
    return players.filter(player => player.teams.length === 0);
  }, [players]);

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([fetchTeams(), fetchPlayersWithTeams()]);
    };
    initializeData();
  }, [fetchTeams, fetchPlayersWithTeams]);

  return {
    teams,
    players,
    selectedTeamId,
    loading,
    createTeam,
    updateTeam,
    deleteTeam,
    setSelectedTeamId,
    assignPlayerToTeam,
    removePlayerFromTeam,
    transferPlayer,
    fetchTeams,
    fetchPlayersWithTeams,
    getTeamPlayers,
    getUnassignedPlayers
  };
}; 