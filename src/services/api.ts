// API Service Layer - REST API client for Basketball Review SAAS App

import { logger } from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Add mock mode flag - set to true for development without backend
const IS_MOCK_MODE = import.meta.env.VITE_MOCK_API === 'true';

// Organization management - for SAAS multi-tenancy
// In a real app, this would come from authentication/user context
let currentOrgId = localStorage.getItem('basketball-org-id') || 'default';

export const setOrganizationId = (orgId: string) => {
  currentOrgId = orgId;
  localStorage.setItem('basketball-org-id', orgId);
};

export const getOrganizationId = () => currentOrgId;

// Mock data storage system using localStorage
class MockDataStore {
  private prefix = 'basketball-mock-';

  private getKey(type: string) {
    return `${this.prefix}${currentOrgId}-${type}`;
  }

  get(type: string): any[] {
    const data = localStorage.getItem(this.getKey(type));
    return data ? JSON.parse(data) : [];
  }

  set(type: string, data: any[]): void {
    localStorage.setItem(this.getKey(type), JSON.stringify(data));
  }

  add(type: string, item: any): any {
    const items = this.get(type);
    const newItem = {
      ...item,
      id: item.id || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orgId: currentOrgId
    };
    items.push(newItem);
    this.set(type, items);
    return newItem;
  }

  update(type: string, id: string, updates: any): any {
    const items = this.get(type);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) throw new Error(`${type} not found`);
    
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.set(type, items);
    return items[index];
  }

  delete(type: string, id: string): void {
    const items = this.get(type);
    const filtered = items.filter(item => item.id !== id);
    this.set(type, filtered);
  }

  find(type: string, id: string): any {
    const items = this.get(type);
    return items.find(item => item.id === id);
  }

  // Initialize with sample data if empty
  initializeIfEmpty() {
    if (this.get('players').length === 0) {
      // Sample players
      this.add('players', {
        id: 'player-1',
        name: 'John Smith',
        position: 'PG',
        jerseyNumber: 23,
        height: "6'2\"",
        weight: '185 lbs',
        profileImageUrl: null,
        isActive: true
      });
      this.add('players', {
        id: 'player-2',
        name: 'Mike Johnson',
        position: 'SG',
        jerseyNumber: 3,
        height: "6'4\"",
        weight: '200 lbs',
        profileImageUrl: null,
        isActive: true
      });
    }

    if (this.get('teams').length === 0) {
      // Sample teams - initialize with empty players array
      this.add('teams', {
        id: 'team-1',
        name: 'Warriors',
        description: 'Sample team',
        logoUrl: null,
        players: [],
        isActive: true
      });
    }
  }
}

const mockStore = new MockDataStore();

// Only initialize mock data if explicitly enabled
if (import.meta.env.VITE_INIT_MOCK_DATA === 'true') {
  mockStore.initializeIfEmpty();
}

// Mock API request handler
const mockApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  logger.api(options.method || 'GET', `[MOCK] ${endpoint}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Parse endpoint to extract resource type and id
  const match = endpoint.match(/^\/api\/(\w+)(?:\/([^/]+))?(?:\/(\w+))?$/);
  if (!match) throw new Error(`Invalid endpoint: ${endpoint}`);

  const [, resource, id] = match;

  try {
    // Handle different resources
    switch (resource) {
      case 'players':
        if (method === 'GET' && !id) {
          return { success: true, data: mockStore.get('players') };
        }
        if (method === 'GET' && id) {
          const player = mockStore.find('players', id);
          if (!player) throw new Error('Player not found');
          return { success: true, data: player };
        }
        if (method === 'POST') {
          const newPlayer = mockStore.add('players', body);
          return { success: true, data: newPlayer };
        }
        if (method === 'PUT' && id) {
          const updated = mockStore.update('players', id, body);
          return { success: true, data: updated };
        }
        if (method === 'DELETE' && id) {
          mockStore.delete('players', id);
          return { success: true };
        }
        break;

      case 'teams':
        if (method === 'GET' && !id) {
          return { success: true, data: mockStore.get('teams') };
        }
        if (method === 'GET' && id) {
          const team = mockStore.find('teams', id);
          if (!team) throw new Error('Team not found');
          return { success: true, data: team };
        }
        if (method === 'POST') {
          const newTeam = mockStore.add('teams', body);
          return { success: true, data: newTeam };
        }
        if (method === 'PUT' && id) {
          const updated = mockStore.update('teams', id, body);
          return { success: true, data: updated };
        }
        if (method === 'DELETE' && id) {
          mockStore.delete('teams', id);
          return { success: true };
        }
        break;

      case 'games':
        if (method === 'GET' && !id) {
          return { success: true, data: mockStore.get('games') };
        }
        if (method === 'GET' && id) {
          const game = mockStore.find('games', id);
          if (!game) throw new Error('Game not found');
          return { success: true, data: game };
        }
        if (method === 'POST') {
          const newGame = mockStore.add('games', body);
          return { success: true, data: newGame };
        }
        if (method === 'PUT' && id) {
          const updated = mockStore.update('games', id, body);
          return { success: true, data: updated };
        }
        if (method === 'DELETE' && id) {
          mockStore.delete('games', id);
          return { success: true };
        }
        break;

      case 'uploads':
        if (method === 'POST') {
          // Mock file upload - return fake presigned URL
          const fileId = `file-${Date.now()}`;
          const s3Key = `${body.uploadType}/${fileId}-${body.fileName}`;
          return {
            success: true,
            data: {
              uploadUrl: `data:mock-upload-url/${s3Key}`,
              fileId,
              s3Key
            }
          };
        }
        if (method === 'PUT' && id) {
          // Mock upload completion
          return { success: true };
        }
        break;

      default:
        throw new Error(`Unknown resource: ${resource}`);
    }

    throw new Error(`Unhandled request: ${method} ${endpoint}`);
  } catch (error) {
    logger.error('[MOCK] Error:', error);
    throw error;
  }
};

// Generic API request function with multi-tenant support
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  if (IS_MOCK_MODE) {
    return mockApiRequest(endpoint, options);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'X-Org-Id': currentOrgId,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    logger.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};

// Player API
export const playerApi = {
  list: async () => {
    return apiRequest('/api/players');
  },

  getById: async (id: string) => {
    return apiRequest(`/api/players/${id}`);
  },

  create: async (playerData: any) => {
    return apiRequest('/api/players', {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  },

  update: async (id: string, playerData: any) => {
    return apiRequest(`/api/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/api/players/${id}`, {
      method: 'DELETE',
    });
  },
};

// Team API
export const teamApi = {
  list: async () => {
    return apiRequest('/api/teams');
  },

  getById: async (id: string) => {
    return apiRequest(`/api/teams/${id}`);
  },

  create: async (teamData: any) => {
    return apiRequest('/api/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  },

  update: async (id: string, teamData: any) => {
    return apiRequest(`/api/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teamData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/api/teams/${id}`, {
      method: 'DELETE',
    });
  },

  addPlayer: async (teamId: string, playerId: string) => {
    try {
      const teamResponse = await teamApi.getById(teamId);
      if (!teamResponse.success) {
        return { success: false, error: { message: 'Team not found' } };
      }
      
      const team = teamResponse.data;
      const currentPlayers = team.players || [];
      
      // Check if player is already in team
      if (currentPlayers.includes(playerId)) {
        return { success: true, data: team }; // Already in team, return success
      }
      
      const updatedPlayers = [...currentPlayers, playerId];
      return teamApi.update(teamId, { players: updatedPlayers });
    } catch (error) {
      return { 
        success: false, 
        error: { message: error instanceof Error ? error.message : 'Failed to add player to team' } 
      };
    }
  },

  removePlayer: async (teamId: string, playerId: string) => {
    try {
      const teamResponse = await teamApi.getById(teamId);
      if (!teamResponse.success) {
        return { success: false, error: { message: 'Team not found' } };
      }
      
      const team = teamResponse.data;
      const updatedPlayers = (team.players || []).filter((id: string) => id !== playerId);
      return teamApi.update(teamId, { players: updatedPlayers });
    } catch (error) {
      return { 
        success: false, 
        error: { message: error instanceof Error ? error.message : 'Failed to remove player from team' } 
      };
    }
  },
};

// Game API
export const gameApi = {
  list: async () => {
    return apiRequest('/api/games');
  },

  getById: async (id: string) => {
    return apiRequest(`/api/games/${id}`);
  },

  create: async (gameData: any) => {
    return apiRequest('/api/games', {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  },

  update: async (id: string, gameData: any) => {
    return apiRequest(`/api/games/${id}`, {
      method: 'PUT',
      body: JSON.stringify(gameData),
    });
  },

  complete: async (id: string) => {
    return apiRequest(`/api/games/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isCompleted: true }),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/api/games/${id}`, {
      method: 'DELETE',
    });
  },
};

// Upload API - now uses S3 presigned URLs
export const uploadApi = {
  getUploadUrl: async (fileName: string, fileType: string, uploadType: string = 'general') => {
    return apiRequest('/api/uploads', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileType, uploadType }),
    });
  },

  uploadFile: async (file: File, uploadUrl: string) => {
    if (IS_MOCK_MODE) {
      // In mock mode, convert file to data URL and store in localStorage
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          // Store the file data URL with a key derived from the upload URL
          const key = uploadUrl.replace('data:mock-upload-url/', 'mock-file-');
          localStorage.setItem(key, dataUrl);
          resolve(new Response('OK', { status: 200 }));
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to upload file to S3');
    }

    return response;
  },

  uploadFileComplete: async (file: File, uploadType: string = 'general') => {
    const uploadResponse = await uploadApi.getUploadUrl(file.name, file.type, uploadType);
    const { uploadUrl, fileId, s3Key } = uploadResponse.data;

    await uploadApi.uploadFile(file, uploadUrl);

    await apiRequest(`/api/uploads/${fileId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'completed' }),
    });

    if (IS_MOCK_MODE) {
      // In mock mode, return the localStorage key as URL
      const mockUrl = `mock-file-${s3Key}`;
      return { fileId, s3Key, url: mockUrl };
    }
    
    return { fileId, s3Key, url: `https://your-bucket-name.s3.amazonaws.com/${s3Key}` };
  },

  playerImage: async (file: File, playerId: string) => {
    try {
      const uploadResult = await uploadApi.uploadFileComplete(file, 'player-images');
      await playerApi.update(playerId, { profileImageUrl: uploadResult.url });
      return { 
        success: true, 
        data: { 
          imageUrl: uploadResult.url,
          fileId: uploadResult.fileId,
          s3Key: uploadResult.s3Key
        } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Upload failed' 
        } 
      };
    }
  },

  teamLogo: async (file: File, teamId: string) => {
    try {
      const uploadResult = await uploadApi.uploadFileComplete(file, 'team-logos');
      await teamApi.update(teamId, { logoUrl: uploadResult.url });
      return { 
        success: true, 
        data: { 
          logoUrl: uploadResult.url,
          fileId: uploadResult.fileId,
          s3Key: uploadResult.s3Key
        } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Upload failed' 
        } 
      };
    }
  },
};

// Stats API (simplified - now part of games)
export const statsApi = {
  getByGame: async (gameId: string) => {
    const game = await gameApi.getById(gameId);
    return { success: true, data: game.data.playerStats || {} };
  },

  getByPlayer: async (playerId: string, gameId?: string) => {
    if (gameId) {
      const game = await gameApi.getById(gameId);
      return { success: true, data: game.data.playerStats?.[playerId] || {} };
    }
    // For career stats, we'd need to aggregate across games
    return { success: true, data: {} };
  },

  createOrUpdate: async (statData: any) => {
    const { gameId, playerId, ...stats } = statData;
    const game = await gameApi.getById(gameId);
    const updatedStats = {
      ...game.data.playerStats,
      [playerId]: { ...game.data.playerStats?.[playerId], ...stats }
    };
    return gameApi.update(gameId, { playerStats: updatedStats });
  },

  createEvent: async (eventData: any) => {
    const { gameId, ...event } = eventData;
    const game = await gameApi.getById(gameId);
    const updatedEvents = [...(game.data.gameEvents || []), event];
    return gameApi.update(gameId, { gameEvents: updatedEvents });
  },
};

// Helper function to get mock image URLs
export const getMockImageUrl = (url: string | null | undefined): string | null => {
  if (!url || !IS_MOCK_MODE) return url || null;
  
  // If it's a mock URL, retrieve from localStorage
  if (url.startsWith('mock-file-')) {
    const dataUrl = localStorage.getItem(url);
    return dataUrl || null;
  }
  
  return url;
};

// Combined API object for easy importing
export const api = {
  players: playerApi,
  teams: teamApi,
  games: gameApi,
  stats: statsApi,
  upload: uploadApi,
  setOrganizationId,
  getOrganizationId,
  getMockImageUrl,
};