import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, User, Save, X, Camera, Upload } from 'lucide-react';
import { api } from '../../services/api';
import type { Player } from '../../types/api.types';
import { PlayerImage } from './PlayerImage';
import { PlayerDetail } from './PlayerDetail';
// import { PlayerTeamAssignmentModal } from '../TeamManagement/PlayerTeamAssignmentModal';
// import { useTeamManagement, type PlayerWithTeam } from '../../hooks/useTeamManagement';
import { resizeProfileImage, validateImageFile, formatFileSize, getImageDimensions } from '../../utils/imageUtils';

export const PlayersWithTeamAssignment: React.FC = () => {
  // const teamManagement = useTeamManagement();
  
  // Local player state
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  // Team assignment state (temporarily disabled)
  // const [showPlayerAssignmentModal, setShowPlayerAssignmentModal] = useState(false);
  // const [selectedPlayerForAssignment, setSelectedPlayerForAssignment] = useState<PlayerWithTeam | null>(null);

  // Add player form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    height: '',
    weight: '',
    jerseyNumber: '',
    profileImage: null as File | null,
    profileImageUrl: '' as string
  });
  
  // Edit player state
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    position: '',
    height: '',
    weight: '',
    jerseyNumber: '',
    profileImage: null as File | null,
    profileImageUrl: '' as string
  });
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [originalImageSize, setOriginalImageSize] = useState<string>('');
  const [resizedImageSize, setResizedImageSize] = useState<string>('');

  const positions = ['PG', 'SG', 'SF', 'PF', 'C'];

  useEffect(() => {
    // Initialize player data
    const timer = setTimeout(() => {
      fetchPlayers();
    }, 100);
    
    return () => clearTimeout(timer);
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
        setPlayers([]);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      setError(`Failed to fetch players: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  // Upload optimized image to S3
  const uploadOptimizedImage = async (file: File) => {
    try {
      setUploading(true);
      
      console.log('🚀 Uploading optimized image');
      
      const result = await api.upload.playerImage(file, 'temp-player-id');
      
      if (result.success && result.data?.imageUrl) {
        console.log('✅ Upload successful:', result.data.imageUrl);
        setFormData(prev => ({ ...prev, profileImageUrl: result.data.imageUrl }));
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // Upload optimized image for edit mode
  const uploadOptimizedImageEdit = async (file: File) => {
    try {
      setUploading(true);
      
      console.log('🚀 Uploading optimized image (edit mode)');
      
      const result = await api.upload.playerImage(file, 'temp-player-id');
      
      if (result.success && result.data?.imageUrl) {
        console.log('✅ Upload successful (edit mode):', result.data.imageUrl);
        setEditForm(prev => ({ ...prev, profileImageUrl: result.data.imageUrl }));
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
      
    } catch (error) {
      console.error('❌ Upload failed (edit mode):', error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // Custom file handler that resizes images before upload
  const handleImageFileSelect = async (file: File, isEditMode: boolean = false) => {
    try {
      setImageProcessing(true);
      
      // Validate file
      const validation = validateImageFile(file, 10); // 10MB max
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }

      // Get original dimensions and size
      const originalDimensions = await getImageDimensions(file);
      const originalSize = formatFileSize(file.size);
      setOriginalImageSize(originalSize);
      
      console.log(`📊 Original image: ${originalDimensions.width}x${originalDimensions.height}, Size: ${originalSize}`);

      // Resize the image
      const resizedFile = await resizeProfileImage(file);
      const resizedDimensions = await getImageDimensions(resizedFile);
      const resizedSize = formatFileSize(resizedFile.size);
      setResizedImageSize(resizedSize);

      console.log(`📊 Resized image: ${resizedDimensions.width}x${resizedDimensions.height}, Size: ${resizedSize}`);
      console.log(`🎯 Size reduction: ${((file.size - resizedFile.size) / file.size * 100).toFixed(1)}%`);

      // Create a preview URL for the resized image
      const previewUrl = URL.createObjectURL(resizedFile);
      setPreviewUrl(previewUrl);

      // Store the resized file
      if (isEditMode) {
        setEditForm(prev => ({ ...prev, profileImage: resizedFile }));
      } else {
        setFormData(prev => ({ ...prev, profileImage: resizedFile }));
      }
      
    } catch (error) {
      console.error('❌ Error processing image:', error);
      alert(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImageProcessing(false);
    }
  };

  const handleCreatePlayer = async () => {
    if (!formData.name.trim()) return;

    try {
      console.log('🚀 Starting player creation...');
      console.log('📋 Current form data:', formData);
      console.log('🖼️ Profile image file:', formData.profileImage ? 'Present' : 'None');
      console.log('🔗 Profile image URL:', formData.profileImageUrl || 'EMPTY');
      
      // Check if user has an image but hasn't uploaded it yet
      if (formData.profileImage && !formData.profileImageUrl) {
        alert('⚠️ Please click "Upload Optimized Image to Cloud" before saving the player!');
        console.warn('⚠️ User has selected an image but hasn\'t uploaded it to S3 yet');
        return;
      }
      
      // Create the player using REST API
      const playerData = {
        name: formData.name,
        position: formData.position || undefined,
        height: formData.height || undefined,
        weight: formData.weight || undefined,
        jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : undefined,
        profileImageUrl: formData.profileImageUrl || undefined,
        isActive: true
      };
      
      console.log('🚀 Creating player with data:', playerData);
      
      const response = await api.players.create(playerData);

      if (response.success) {
        console.log('✅ Player created successfully:', response.data);
        // Refresh the players list
        await fetchPlayers();
        // Reset form
        resetForm();
      } else {
        throw new Error(response.error?.message || 'Failed to create player');
      }
      
    } catch (error) {
      console.error('❌ Error creating player:', error);
      alert(`Failed to create player: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdatePlayer = async (playerId: string, updatedData: any) => {
    try {
      console.log('Updating player:', playerId, 'with data:', updatedData);
      
      const response = await api.players.update(playerId, updatedData);
      
      if (response.success) {
        setEditingPlayer(null);
        setPreviewUrl(null);
        await fetchPlayers();
      } else {
        throw new Error(response.error?.message || 'Failed to update player');
      }
      
    } catch (error) {
      console.error('Error updating player:', error);
      alert(`Failed to update player: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      height: '',
      weight: '',
      jerseyNumber: '',
      profileImage: null,
      profileImageUrl: ''
    });
    setEditForm({
      name: '',
      position: '',
      height: '',
      weight: '',
      jerseyNumber: '',
      profileImage: null,
      profileImageUrl: ''
    });
    setPreviewUrl(null);
    setShowAddForm(false);
    setEditingPlayer(null);
    setOriginalImageSize('');
    setResizedImageSize('');
  };

  // Get team information for a player (temporarily disabled)
  const getPlayerTeams = (_playerId: string) => {
    // Temporarily disabled until team management is re-enabled
    return [];
  };



  const handleDeletePlayer = async (playerId: string) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        const response = await api.players.delete(playerId);
        if (response.success) {
          await fetchPlayers();
        } else {
          throw new Error(response.error?.message || 'Failed to delete player');
        }
      } catch (error) {
        console.error('Error deleting player:', error);
        alert(`Failed to delete player: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading players...</p>
        </div>
      </div>
    );
  }

  // If a player is selected, show the player detail view
  if (selectedPlayerId) {
    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    if (!selectedPlayer) {
      setSelectedPlayerId(null);
      return null;
    }
    return (
      <PlayerDetail 
        player={selectedPlayer}
        onBack={() => setSelectedPlayerId(null)}
      />
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading players...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Unable to Load Players</h3>
          <p className="text-zinc-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchPlayers();
            }}
            className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg text-black font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-xl p-6 border border-zinc-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-yellow-400 flex items-center gap-3 mb-2">
              <User className="w-8 h-8" />
              Player Management
            </h2>
            <p className="text-zinc-300">Manage individual player profiles, photos, and team assignments</p>
            <div className="mt-3 flex items-center gap-6 text-sm text-zinc-400">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                Total Players: {players.length}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                With Profile Photos: {players.filter(p => p.profileImageUrl).length}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Teams: {/* teamManagement.teams.length */}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-6 py-3 rounded-xl font-semibold text-black transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Player
          </button>
        </div>
      </div>

      {/* Add Player Form */}
      {showAddForm && (
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-700 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-yellow-400" />
              Add New Player
            </h3>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          
          {/* Profile Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-3">Profile Picture</label>
            
            {/* Image Preview */}
            {previewUrl && (
              <div className="mb-4 flex items-center gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-600">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm">
                  <div className="text-zinc-300">✅ Image optimized and ready to upload</div>
                  {originalImageSize && resizedImageSize && (
                    <div className="text-zinc-400 mt-1">
                      <div>Original: {originalImageSize}</div>
                      <div>Optimized: {resizedImageSize}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* File Input */}
            <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-6 border-dashed hover:border-yellow-500 transition-colors">
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto mb-4 text-zinc-400" />
                <p className="text-zinc-300 mb-4">
                  {imageProcessing ? 'Processing image...' : 'Select a profile image'}
                </p>
                <p className="text-sm text-zinc-500 mb-4">
                  Images will be automatically optimized to 400x400px for faster loading
                </p>
                <label className="cursor-pointer">
                  <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-zinc-600 disabled:to-zinc-700 px-6 py-3 rounded-lg font-semibold text-black transition-all transform hover:scale-105 shadow-lg inline-flex items-center gap-2">
                    {imageProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Choose Image
                      </>
                    )}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageFileSelect(file);
                      }
                    }}
                    disabled={imageProcessing}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Upload status and button */}
            {formData.profileImage && (
              <div className="mt-4 space-y-3">
                {/* Upload Status */}
                {formData.profileImageUrl ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-sm font-medium">✅ Image uploaded to cloud successfully!</span>
                    </div>
                    <div className="text-xs text-emerald-300/70 mt-1">
                      Ready to save player profile
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">⚠️ Image processed but not uploaded yet</span>
                    </div>
                    <div className="text-xs text-yellow-300/70 mt-1">
                      Click "Upload to Cloud" below before saving
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                {!formData.profileImageUrl && (
                  <button
                    onClick={() => uploadOptimizedImage(formData.profileImage!)}
                    disabled={uploading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-zinc-600 disabled:to-zinc-700 px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading to Cloud...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Optimized Image to Cloud
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Player Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
              />
            </div>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
            >
              <option value="">Position</option>
              {positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Height (6'2&quot;)"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              className="bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
            />
            <input
              type="text"
              placeholder="Weight (185 lbs)"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
            />
          </div>
          
          <div className="mb-6">
            <input
              type="number"
              placeholder="Jersey Number"
              value={formData.jerseyNumber}
              onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
              className="w-32 bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreatePlayer}
              disabled={!formData.name.trim() || uploading}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-zinc-600 disabled:to-zinc-700 px-6 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Player
                </>
              )}
            </button>
            <button
              onClick={resetForm}
              className="bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-lg font-semibold text-white transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {players.map(player => {
          const playerTeams = getPlayerTeams(player.id);
          const careerAvgPoints = player.totalGamesPlayed > 0 ? (player.careerPoints / player.totalGamesPlayed).toFixed(1) : '0.0';
          const careerAvgAssists = player.totalGamesPlayed > 0 ? (player.careerAssists / player.totalGamesPlayed).toFixed(1) : '0.0';
          const careerAvgRebounds = player.totalGamesPlayed > 0 ? (player.careerRebounds / player.totalGamesPlayed).toFixed(1) : '0.0';
          
          return (
            <div 
              key={player.id} 
              onClick={() => setSelectedPlayerId(player.id)}
              className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl border border-zinc-700 hover:border-yellow-500/30 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] group cursor-pointer">
              {/* Player Image with Gradient Overlay */}
              <div className="relative">
                <div className="w-full aspect-square bg-zinc-800 rounded-t-xl overflow-hidden">
                  <PlayerImage 
                    profileImageUrl={player.profileImageUrl}
                    className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                    alt={player.name}
                  />
                  {/* Gradient overlay for better text visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Jersey Number Badge */}
                  {player.jerseyNumber && (
                    <div className="absolute top-3 right-3 bg-yellow-500 text-black font-bold text-sm px-2 py-1 rounded-full">
                      #{player.jerseyNumber}
                    </div>
                  )}
                  
                  {/* Position Badge */}
                  {player.position && (
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                      {player.position}
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Player Info */}
              <div className="p-6">
                {/* Header with name and status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                      {player.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      {player.height && (
                        <>
                          <span>{player.height}</span>
                        </>
                      )}
                      {player.weight && (
                        <>
                          {player.height && <span className="text-zinc-600">•</span>}
                          <span>{player.weight}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Stats Display */}
                <div className="mb-4 bg-zinc-800/50 rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-emerald-400">{careerAvgPoints}</div>
                      <div className="text-xs text-zinc-400">PPG</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-400">{careerAvgAssists}</div>
                      <div className="text-xs text-zinc-400">APG</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-400">{careerAvgRebounds}</div>
                      <div className="text-xs text-zinc-400">RPG</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-zinc-700 flex justify-center">
                    <div className="text-center">
                      <div className="text-sm font-medium text-white">{player.totalGamesPlayed || 0}</div>
                      <div className="text-xs text-zinc-400">Games Played</div>
                    </div>
                  </div>
                </div>

                {/* Team Assignments with enhanced styling */}
                <div className="space-y-2">
                  {playerTeams.length > 0 ? (
                    <div className="text-xs text-zinc-400 mb-2">Team Assignments:</div>
                  ) : (
                    <div className="text-xs text-zinc-400 mb-2">No team assignments</div>
                  )}
                  {/* No team assignments to display */}
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlayerId(player.id);
                    }}
                    className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-all"
                  >
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPlayer(player.id);
                      setEditForm({
                        name: player.name,
                        position: player.position || '',
                        height: player.height || '',
                        weight: player.weight || '',
                        jerseyNumber: player.jerseyNumber?.toString() || '',
                        profileImage: null,
                        profileImageUrl: player.profileImageUrl || ''
                      });
                    }}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white p-2 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlayer(player.id);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-2xl w-full border border-zinc-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
              <span>Edit Player</span>
              <button 
                onClick={() => {
                  setEditingPlayer(null);
                  setPreviewUrl(null);
                }}
                className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </h3>
            
            {players.filter(p => p.id === editingPlayer).map(player => (
              <div key={player.id} className="space-y-4">
                {/* Profile Image Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Profile Picture</label>
                  
                  {/* Current Image Display */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-32 h-32 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center overflow-hidden">
                      <PlayerImage
                        profileImageUrl={editForm.profileImageUrl || player.profileImageUrl}
                        className="w-full h-full object-cover"
                        alt={player.name}
                      />
                    </div>
                    <div className="text-sm text-zinc-400">
                      <p>Current profile picture</p>
                      <p className="text-xs">Upload a new image below to change it</p>
                    </div>
                  </div>

                  {/* Image Preview for Edit Mode */}
                  {previewUrl && editingPlayer === player.id && (
                    <div className="mb-4 flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-600">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-sm">
                        <div className="text-zinc-300">✅ New image optimized and ready to upload</div>
                        {originalImageSize && resizedImageSize && (
                          <div className="text-zinc-400 mt-1">
                            <div>Original: {originalImageSize}</div>
                            <div>Optimized: {resizedImageSize}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* File Input for Edit Mode */}
                  <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-4 border-dashed hover:border-yellow-500 transition-colors">
                    <div className="text-center">
                      <Camera className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                      <p className="text-zinc-300 mb-2 text-sm">
                        {imageProcessing ? 'Processing image...' : 'Select a new profile image'}
                      </p>
                      <label className="cursor-pointer">
                        <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-zinc-600 disabled:to-zinc-700 px-3 py-2 rounded-lg font-semibold text-black transition-all inline-flex items-center gap-2 text-sm">
                          {imageProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <Camera className="w-3 h-3" />
                              Choose New Image
                            </>
                          )}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageFileSelect(file, true);
                            }
                          }}
                          disabled={imageProcessing}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Upload to S3 button for edit mode */}
                  {editForm.profileImage && editingPlayer === player.id && (
                    <div className="mt-4">
                      <button
                        onClick={() => uploadOptimizedImageEdit(editForm.profileImage!)}
                        disabled={uploading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-zinc-600 disabled:to-zinc-700 px-4 py-2 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Uploading to Cloud...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3" />
                            Upload Optimized Image
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Position</label>
                    <select
                      value={editForm.position}
                      onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                    >
                      <option value="">Select Position</option>
                      {positions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Height</label>
                    <input
                      type="text"
                      placeholder="e.g., 6'2&quot;"
                      value={editForm.height}
                      onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Weight</label>
                    <input
                      type="text"
                      placeholder="e.g., 185 lbs"
                      value={editForm.weight}
                      onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Jersey #</label>
                    <input
                      type="number"
                      value={editForm.jerseyNumber}
                      onChange={(e) => setEditForm({ ...editForm, jerseyNumber: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6 justify-end">
                  <button
                    onClick={() => {
                      setEditingPlayer(null);
                      setPreviewUrl(null);
                      setEditForm({ name: '', position: '', height: '', weight: '', jerseyNumber: '', profileImage: null, profileImageUrl: '' });
                    }}
                    className="bg-zinc-600 hover:bg-zinc-700 px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!editForm.name.trim()) return;
                      
                      const updatedData = {
                        name: editForm.name,
                        position: editForm.position || undefined,
                        height: editForm.height || undefined,
                        weight: editForm.weight || undefined,
                        jerseyNumber: editForm.jerseyNumber ? parseInt(editForm.jerseyNumber) : undefined,
                        profileImageUrl: editForm.profileImageUrl || undefined,
                      };
                      
                      handleUpdatePlayer(player.id, updatedData);
                    }}
                    disabled={!editForm.name.trim() || uploading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-600 px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player Team Assignment Modal - Temporarily disabled */}
      {/* 
      <PlayerTeamAssignmentModal
        isOpen={showPlayerAssignmentModal}
        onClose={() => setShowPlayerAssignmentModal(false)}
        player={selectedPlayerForAssignment}
        teams={teamManagement.teams}
        onAssignPlayerToTeam={teamManagement.assignPlayerToTeam}
        onRemovePlayerFromTeam={teamManagement.removePlayerFromTeam}
      />
      */}
    </div>
  );
}; 