import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

export interface Team {
  id: string;
  name: string;
  description?: string;
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
  createTeam: (name: string, description?: string) => Promise<Team | null>;
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

export const useTeamManagement = (client: ReturnType<typeof generateClient<Schema>>, userId?: string): UseTeamManagementResult => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all teams
  const fetchTeams = useCallback(async () => {
    try {
      const result = await client.models.Team.list();
      const teamsData = result.data || [];
      
      // Get player counts for each team
      const teamsWithCounts = await Promise.all(
        teamsData.map(async (team) => {
          const teamPlayersResult = await client.models.TeamPlayer.list({
            filter: { teamId: { eq: team.id }, isActive: { eq: true } }
          });
          
          return {
            id: team.id,
            name: team.name,
            description: team.description || undefined,
            isActive: team.isActive || true,
            playerCount: teamPlayersResult.data?.length || 0,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt
          };
        })
      );
      
      setTeams(teamsWithCounts);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, [client]);

  // Fetch all players with their team associations
  const fetchPlayersWithTeams = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all players
      const playersResult = await client.models.Player.list();
      const playersData = playersResult.data || [];

      // Get all team-player associations
      const teamPlayersResult = await client.models.TeamPlayer.list({
        filter: { isActive: { eq: true } }
      });
      const teamPlayersData = teamPlayersResult.data || [];

      // Get all teams for reference
      const teamsResult = await client.models.Team.list();
      const teamsData = teamsResult.data || [];

      // Build players with team information
      const playersWithTeams: PlayerWithTeam[] = playersData.map(player => {
        // Find all teams this player belongs to
        const playerTeamAssociations = teamPlayersData.filter(tp => tp.playerId === player.id);
        const playerTeams = playerTeamAssociations.map(tp => {
          const team = teamsData.find(t => t.id === tp.teamId);
          return team ? {
            id: team.id,
            name: team.name,
            description: team.description,
            isActive: team.isActive || true
          } : null;
        }).filter(Boolean) as Team[];

        return {
          id: player.id,
          name: player.name,
          position: player.position || undefined,
          profileImageUrl: player.profileImageUrl || undefined,
          isActive: player.isActive || true,
          teams: playerTeams,
          currentTeamId: playerTeams.length > 0 ? playerTeams[0].id : undefined
        };
      });

      setPlayers(playersWithTeams);
    } catch (error) {
      console.error('Error fetching players with teams:', error);
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Create a new team
  const createTeam = useCallback(async (name: string, description?: string): Promise<Team | null> => {
    try {
      const result = await client.models.Team.create({
        name: name.trim(),
        description: description?.trim(),
        isActive: true,
        coachId: userId || 'anonymous-user'
      });

      if (result.data) {
        const newTeam: Team = {
          id: result.data.id,
          name: result.data.name,
          description: result.data.description || undefined,
          isActive: result.data.isActive || true,
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
  }, [client]);

  // Update team
  const updateTeam = useCallback(async (teamId: string, updates: Partial<Team>): Promise<boolean> => {
    try {
      const result = await client.models.Team.update({
        id: teamId,
        ...updates
      });

      if (result.data) {
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
  }, [client]);

  // Delete team
  const deleteTeam = useCallback(async (teamId: string): Promise<boolean> => {
    try {
      // First remove all player associations
      const teamPlayersResult = await client.models.TeamPlayer.list({
        filter: { teamId: { eq: teamId } }
      });
      
      for (const tp of teamPlayersResult.data || []) {
        await client.models.TeamPlayer.delete({ id: tp.id });
      }

      // Then delete the team
      await client.models.Team.delete({ id: teamId });
      
      setTeams(prev => prev.filter(team => team.id !== teamId));
      
      if (selectedTeamId === teamId) {
        setSelectedTeamId(null);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting team:', error);
      return false;
    }
  }, [client, selectedTeamId]);

  // Assign player to team
  const assignPlayerToTeam = useCallback(async (playerId: string, teamId: string): Promise<boolean> => {
    try {
      // Check if association already exists
      const existingResult = await client.models.TeamPlayer.list({
        filter: { 
          and: [
            { playerId: { eq: playerId } },
            { teamId: { eq: teamId } },
            { isActive: { eq: true } }
          ]
        }
      });

      if (existingResult.data && existingResult.data.length > 0) {
        console.log('Player already assigned to this team');
        return true;
      }

      // Create new association
      const result = await client.models.TeamPlayer.create({
        playerId,
        teamId,
        isActive: true,
        dateJoined: new Date().toISOString()
      });

      if (result.data) {
        // Refresh data
        await Promise.all([fetchTeams(), fetchPlayersWithTeams()]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error assigning player to team:', error);
      return false;
    }
  }, [client, fetchTeams, fetchPlayersWithTeams]);

  // Remove player from team
  const removePlayerFromTeam = useCallback(async (playerId: string, teamId: string): Promise<boolean> => {
    try {
      const result = await client.models.TeamPlayer.list({
        filter: { 
          and: [
            { playerId: { eq: playerId } },
            { teamId: { eq: teamId } },
            { isActive: { eq: true } }
          ]
        }
      });

      for (const tp of result.data || []) {
        await client.models.TeamPlayer.update({
          id: tp.id,
          isActive: false
        });
      }

      // Refresh data
      await Promise.all([fetchTeams(), fetchPlayersWithTeams()]);
      return true;
    } catch (error) {
      console.error('Error removing player from team:', error);
      return false;
    }
  }, [client, fetchTeams, fetchPlayersWithTeams]);

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