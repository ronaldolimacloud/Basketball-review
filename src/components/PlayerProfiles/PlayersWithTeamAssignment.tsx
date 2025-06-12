import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, User, TrendingUp, Settings, Users, Save, X, Camera, Upload } from 'lucide-react';
import type { Schema } from '../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { uploadData } from 'aws-amplify/storage';
import { PlayerImage } from './PlayerImage';
import { PlayerDetail } from './PlayerDetail';
import { PlayerTeamAssignmentModal } from '../TeamManagement/PlayerTeamAssignmentModal';
import { useTeamManagement, type PlayerWithTeam } from '../../hooks/useTeamManagement';
import { resizeProfileImage, validateImageFile, formatFileSize, getImageDimensions } from '../../utils/imageUtils';

interface PlayersWithTeamAssignmentProps {
  client: ReturnType<typeof generateClient<Schema>>;
}

export const PlayersWithTeamAssignment: React.FC<PlayersWithTeamAssignmentProps> = ({ client }) => {
  const teamManagement = useTeamManagement(client);
  
  // Local player state
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  // Team assignment state
  const [showPlayerAssignmentModal, setShowPlayerAssignmentModal] = useState(false);
  const [selectedPlayerForAssignment, setSelectedPlayerForAssignment] = useState<PlayerWithTeam | null>(null);

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
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching players...');
      const result = await client.models.Player.list();
      console.log('📦 Raw result from API:', result);
      console.log('👥 Players data:', result.data);
      console.log('📊 Number of players:', result.data?.length || 0);
      
      // Log any GraphQL errors
      if (result.errors && result.errors.length > 0) {
        console.error('🚨 GraphQL Errors when fetching players:', result.errors);
        console.error('🚨 Errors as JSON:', JSON.stringify(result.errors, null, 2));
      }
      
      setPlayers(result.data || []);
      
      // Debug player image URLs
      if (result.data && result.data.length > 0) {
        console.log('🖼️ Player profile image URLs:');
        result.data.forEach(player => {
          console.log(`  ${player.name}: ${player.profileImageUrl || 'NO IMAGE'}`);
        });
      }
    } catch (error) {
      console.error('❌ Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  // Upload optimized image to S3
  const uploadOptimizedImage = async (file: File) => {
    try {
      setUploading(true);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `player_${timestamp}_${randomString}.${extension}`;
      
      // For protected storage, upload to the player-images folder
      // AWS will automatically add the user's identityId to the path
      const fullPath = `protected/player-images/${filename}`;
      
      console.log('🚀 Uploading optimized image:', fullPath);
      
      const result = await uploadData({
        path: fullPath,
        data: file,
        options: {
          contentType: file.type,
        }
      }).result;
      
      console.log('✅ Upload successful:', result.path);
      console.log('✅ Full result object:', result);
      
      // Store the FULL path returned by uploadData (includes identityId)
      // This complete path should be used directly by StorageImage component
      setFormData(prev => ({ ...prev, profileImageUrl: result.path }));
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      console.error('❌ Error details:', error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // Upload optimized image for edit mode
  const uploadOptimizedImageEdit = async (file: File) => {
    try {
      setUploading(true);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `player_${timestamp}_${randomString}.${extension}`;
      
      // For protected storage, upload to the player-images folder
      // AWS will automatically add the user's identityId to the path
      const fullPath = `protected/player-images/${filename}`;
      
      console.log('🚀 Uploading optimized image (edit mode):', fullPath);
      
      const result = await uploadData({
        path: fullPath,
        data: file,
        options: {
          contentType: file.type,
        }
      }).result;
      
      console.log('✅ Upload successful (edit mode):', result.path);
      console.log('✅ Full result object (edit mode):', result);
      
      // Store the FULL path returned by uploadData (includes identityId)
      // This complete path should be used directly by StorageImage component
      setEditForm(prev => ({ ...prev, profileImageUrl: result.path }));
      
    } catch (error) {
      console.error('❌ Upload failed (edit mode):', error);
      console.error('❌ Error details (edit mode):', error);
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
      
      // First create the player
      const playerData = {
        name: formData.name,
        position: formData.position || undefined,
        height: formData.height || undefined,
        weight: formData.weight || undefined,
        jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : undefined,
        profileImageUrl: formData.profileImageUrl || undefined,
        isActive: true,
        totalGamesPlayed: 0,
        careerPoints: 0,
        careerAssists: 0,
        careerRebounds: 0,
        careerSteals: 0,
        careerBlocks: 0,
        careerFouls: 0,
        careerTurnovers: 0,
        careerFgMade: 0,
        careerFgAttempts: 0,
        careerFtMade: 0,
        careerFtAttempts: 0,
        careerMinutesPlayed: 0
      };
      
      console.log('🚀 Creating player with data:', playerData);
      console.log('🖼️ Profile image URL being saved to database:', formData.profileImageUrl || 'NO URL PROVIDED');
      
      const newPlayer = await client.models.Player.create(playerData);

      console.log('✅ Player created successfully:', newPlayer);
      console.log('🔍 Check if the returned player has profileImageUrl:', newPlayer.data?.profileImageUrl);
      
      // Refresh the players list
      await fetchPlayers();
      await teamManagement.fetchPlayersWithTeams();
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('❌ Error creating player:', error);
      alert(`Failed to create player: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdatePlayer = async (playerId: string, updatedData: any) => {
    try {
      console.log('Updating player:', playerId, 'with data:', updatedData);
      
      await client.models.Player.update({
        id: playerId,
        ...updatedData
      });
      
      setEditingPlayer(null);
      setPreviewUrl(null);
      fetchPlayers();
      
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

  // Get team information for a player
  const getPlayerTeams = (playerId: string) => {
    const teamPlayer = teamManagement.players.find(p => p.id === playerId);
    return teamPlayer?.teams || [];
  };

  const handlePlayerAssignment = (player: any) => {
    const teamPlayer = teamManagement.players.find(p => p.id === player.id);
    if (teamPlayer) {
      setSelectedPlayerForAssignment(teamPlayer);
      setShowPlayerAssignmentModal(true);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await client.models.Player.delete({ id: playerId });
        await fetchPlayers();
        await teamManagement.fetchPlayersWithTeams();
      } catch (error) {
        console.error('Error deleting player:', error);
      }
    }
  };

  if (loading || teamManagement.loading) {
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
        client={client}
      />
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
                Active Players: {players.filter(p => p.isActive).length}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Teams: {teamManagement.teams.length}
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

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {players.map(player => {
          const playerTeams = getPlayerTeams(player.id);
          
          return (
            <div key={player.id} className="bg-zinc-900 rounded-xl border border-zinc-700 hover:border-zinc-600 transition-colors shadow-lg">
              {/* Player Image */}
              <div className="relative">
                <div className="w-full aspect-square bg-zinc-800 rounded-t-xl overflow-hidden">
                  <PlayerImage 
                    profileImageUrl={player.profileImageUrl}
                    className="w-full h-full object-cover"
                    alt={player.name}
                  />
                </div>
              </div>

              {/* Player Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{player.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      {player.position && <span>{player.position}</span>}
                    </div>
                  </div>
                </div>

                {/* Team Assignments */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-300">Teams</span>
                    <button
                      onClick={() => handlePlayerAssignment(player)}
                      className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      Manage
                    </button>
                  </div>
                  {playerTeams.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {playerTeams.map(team => (
                        <span 
                          key={team.id}
                          className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-full"
                        >
                          {team.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500">No team assignments</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPlayerId(player.id)}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    View Profile
                  </button>
                  <button
                    onClick={() => {
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
                    className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors"
                    title="Edit Player"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePlayer(player.id)}
                    className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
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

      {/* Player Team Assignment Modal */}
      <PlayerTeamAssignmentModal
        isOpen={showPlayerAssignmentModal}
        onClose={() => setShowPlayerAssignmentModal(false)}
        player={selectedPlayerForAssignment}
        teams={teamManagement.teams}
        onAssignPlayerToTeam={teamManagement.assignPlayerToTeam}
        onRemovePlayerFromTeam={teamManagement.removePlayerFromTeam}
      />
    </div>
  );
}; 