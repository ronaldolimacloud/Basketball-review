import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, User, Save, X, Users, Camera, Upload } from 'lucide-react';
import { api } from '../../services/api';
import type { Player } from '../../types/api.types';
import { useTeamManagement } from '../../hooks/useTeamManagement';
import { PlayerTeamAssignmentModal } from '../TeamManagement/PlayerTeamAssignmentModal';
import { validateImageFile, resizeProfileImage, formatFileSize } from '../../utils/imageUtils';

export const PlayersSimplified: React.FC = () => {
  const teamManagement = useTeamManagement();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  
  // Team assignment modal state
  const [showTeamAssignmentModal, setShowTeamAssignmentModal] = useState(false);
  const [selectedPlayerForTeams, setSelectedPlayerForTeams] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    height: '',
    weight: '',
    jerseyNumber: '',
    teamId: ''
  });

  // Photo upload state
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const positions = ['PG', 'SG', 'SF', 'PF', 'C'];

  useEffect(() => {
    fetchPlayers();
    teamManagement.fetchTeams();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.players.list();
      
      if (response.success) {
        setPlayers(response.data || []);
      } else {
        setError(response.error?.message || 'Failed to fetch players');
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      setError(`Failed to fetch players: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid image file');
      return;
    }

    try {
      // Resize image
      const resizedFile = await resizeProfileImage(file);
      setProfileImage(resizedFile);
      
      // Create preview
      const url = URL.createObjectURL(resizedFile);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      
      // Upload image if one was selected
      let uploadedImageUrl = profileImageUrl || '/default-player.png';
      if (profileImage) {
        const uploadResult = await api.upload.playerImage(profileImage, 'temp-player-id');
        if (uploadResult.success && uploadResult.data?.imageUrl) {
          uploadedImageUrl = uploadResult.data.imageUrl;
        }
      }

      const playerData = {
        ...formData,
        jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : undefined,
        profileImageUrl: uploadedImageUrl
      };

      if (editingPlayer) {
        const response = await api.players.update(editingPlayer, playerData);
        if (response.success) {
          setPlayers(prev => prev.map(p => 
            p.id === editingPlayer ? response.data : p
          ));
          setEditingPlayer(null);
        } else {
          setError(response.error?.message || 'Failed to update player');
        }
      } else {
        const response = await api.players.create(playerData);
        if (response.success) {
          // Assign to team if selected
          if (formData.teamId) {
            await teamManagement.assignPlayerToTeam(response.data.id, formData.teamId);
          }
          
          setPlayers(prev => [...prev, response.data]);
          setShowAddForm(false);
        } else {
          setError(response.error?.message || 'Failed to create player');
        }
      }
      
      // Reset form
      setFormData({ name: '', position: '', height: '', weight: '', jerseyNumber: '', teamId: '' });
      setProfileImage(null);
      setPreviewUrl(null);
      setProfileImageUrl('');
    } catch (error) {
      console.error('Error saving player:', error);
      setError(`Failed to save player: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player.id);
    setFormData({
      name: player.name,
      position: player.position || '',
      height: player.height || '',
      weight: player.weight || '',
      jerseyNumber: player.jerseyNumber?.toString() || '',
      teamId: ''
    });
    setProfileImageUrl(player.profileImageUrl || '');
    setShowAddForm(false);
  };

  const handleDelete = async (playerId: string) => {
    if (!confirm('Are you sure you want to delete this player?')) return;
    
    try {
      const response = await api.players.delete(playerId);
      if (response.success) {
        setPlayers(prev => prev.filter(p => p.id !== playerId));
      } else {
        setError(response.error?.message || 'Failed to delete player');
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      setError(`Failed to delete player: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingPlayer(null);
    setFormData({ name: '', position: '', height: '', weight: '', jerseyNumber: '', teamId: '' });
    setProfileImage(null);
    setPreviewUrl(null);
    setProfileImageUrl('');
    setError(null);
  };

  const handleManageTeams = (player: Player) => {
    // Convert Player to PlayerWithTeam format
    const playerWithTeams = {
      id: player.id,
      name: player.name,
      position: player.position,
      profileImageUrl: player.profileImageUrl,
      isActive: player.isActive || true,
      teams: teamManagement.players.find(p => p.id === player.id)?.teams || []
    };
    setSelectedPlayerForTeams(playerWithTeams);
    setShowTeamAssignmentModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Players</h2>
          <p className="text-zinc-400">Manage your team roster</p>
        </div>
        {!showAddForm && !editingPlayer && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Player
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingPlayer) && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingPlayer ? 'Edit Player' : 'Add New Player'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Player Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                  placeholder="Enter player name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Position
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select position</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Height
                </label>
                <input
                  type="text"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g., 6'2&quot;"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Weight
                </label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g., 185 lbs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Jersey Number
                </label>
                <input
                  type="number"
                  name="jerseyNumber"
                  value={formData.jerseyNumber}
                  onChange={handleInputChange}
                  min="0"
                  max="99"
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g., 23"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Assign to Team
                </label>
                <select
                  name="teamId"
                  value={formData.teamId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                  disabled={editingPlayer !== null}
                >
                  <option value="">No team (assign later)</option>
                  {teamManagement.teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Profile Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Profile Photo
              </label>
              <div className="flex items-center gap-4">
                {/* Preview */}
                <div className="relative w-24 h-24 bg-zinc-700 rounded-lg overflow-hidden">
                  {previewUrl || profileImageUrl ? (
                    <img 
                      src={previewUrl || profileImageUrl} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-zinc-500" />
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-zinc-600 hover:bg-zinc-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Choose Photo'}
                  </button>
                  <p className="text-xs text-zinc-400 mt-1">
                    Default image will be used if none selected
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingPlayer ? 'Update Player' : 'Add Player'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 bg-zinc-600 hover:bg-zinc-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Players List */}
      <div className="grid gap-4">
        {players.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-400 mb-2">No players yet</h3>
            <p className="text-zinc-500">Add your first player to get started</p>
          </div>
        ) : (
          players.map((player) => (
            <div
              key={player.id}
              className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center overflow-hidden">
                    {player.profileImageUrl ? (
                      <img 
                        src={player.profileImageUrl} 
                        alt={player.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/default-player.png';
                        }}
                      />
                    ) : (
                      <img 
                        src="/default-player.png" 
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h3 
                      className="font-semibold text-white hover:text-yellow-400 cursor-pointer transition-colors"
                      onClick={() => navigate(`/players/${player.id}`)}
                    >
                      {player.name}
                    </h3>
                    <div className="text-sm text-zinc-400 flex gap-2">
                      {player.position && <span key="position">{player.position}</span>}
                      {player.jerseyNumber && <span key="jersey">#{player.jerseyNumber}</span>}
                      {player.height && <span key="height">{player.height}</span>}
                      {player.weight && <span key="weight">{player.weight}</span>}
                    </div>
                    {/* Team assignments */}
                    <div className="text-xs text-zinc-500 mt-1">
                      {(() => {
                        const playerTeams = teamManagement.players.find(p => p.id === player.id)?.teams || [];
                        if (playerTeams.length === 0) {
                          return <span>No team assignments</span>;
                        }
                        return (
                          <span className="text-blue-400">
                            Teams: {playerTeams.map(t => t.name).join(', ')}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleManageTeams(player)}
                    className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-zinc-700 rounded-lg transition-colors"
                    title="Manage Teams"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(player)}
                    className="p-2 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(player.id)}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Player Team Assignment Modal */}
      <PlayerTeamAssignmentModal
        isOpen={showTeamAssignmentModal}
        onClose={() => {
          setShowTeamAssignmentModal(false);
          setSelectedPlayerForTeams(null);
        }}
        player={selectedPlayerForTeams}
        teams={teamManagement.teams}
        onAssignPlayerToTeam={teamManagement.assignPlayerToTeam}
        onRemovePlayerFromTeam={teamManagement.removePlayerFromTeam}
      />
    </div>
  );
};