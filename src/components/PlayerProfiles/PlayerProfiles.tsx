import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, User, Trophy, TrendingUp, Camera, Upload } from 'lucide-react';
import type { Schema } from '../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { uploadData } from 'aws-amplify/storage';
import { PlayerImage } from './PlayerImage';
import { StorageDiagnostic } from '../StorageDiagnostic';

interface PlayerProfilesProps {
  client: ReturnType<typeof generateClient<Schema>>;
}

export const PlayerProfiles: React.FC<PlayerProfilesProps> = ({ client }) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    height: '',
    weight: '',
    jerseyNumber: '',
    profileImage: null as File | null
  });
  const [editForm, setEditForm] = useState({
    name: '',
    position: '',
    height: '',
    weight: '',
    jerseyNumber: '',
    profileImage: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const positions = ['PG', 'SG', 'SF', 'PF', 'C'];

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (editingPlayer) {
        // For edit mode
        setEditForm({ ...editForm, profileImage: file });
      } else {
        // For add mode
        setFormData({ ...formData, profileImage: file });
      }
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async (file: File, playerId: string): Promise<string | null> => {
    try {
      setUploading(true);
      console.log('Starting upload for player:', playerId, 'file:', file.name);
      
      // Clean the filename and create a proper path
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `player-images/${playerId}-${Date.now()}-${cleanFileName}`;
      
      console.log('Upload path:', fileName);
      
      const result = await uploadData({
        path: fileName,
        data: file,
        options: {
          contentType: file.type || 'image/jpeg'
        }
      }).result;

      console.log('Upload successful:', result);
      return fileName;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const { data } = await client.models.Player.list();
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlayer = async () => {
    if (!formData.name.trim()) return;

    try {
      // First create the player
      const newPlayer = await client.models.Player.create({
        name: formData.name,
        position: formData.position || undefined,
        height: formData.height || undefined,
        weight: formData.weight || undefined,
        jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : undefined,
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
      });

      // Upload profile image if provided
      if (formData.profileImage && newPlayer.data) {
        const imageUrl = await uploadProfileImage(formData.profileImage, newPlayer.data.id);
        if (imageUrl) {
          await client.models.Player.update({
            id: newPlayer.data.id,
            profileImageUrl: imageUrl
          });
        }
      }

      setFormData({ name: '', position: '', height: '', weight: '', jerseyNumber: '', profileImage: null });
      setPreviewUrl(null);
      setShowAddForm(false);
      fetchPlayers();
    } catch (error) {
      console.error('Error creating player:', error);
    }
  };

  const handleUpdatePlayer = async (playerId: string, updatedData: any, profileImage?: File | null) => {
    try {
      console.log('Updating player:', playerId, 'with data:', updatedData);
      
      // If there's a new profile image, upload it first
      if (profileImage) {
        console.log('Uploading new profile image...');
        const imageUrl = await uploadProfileImage(profileImage, playerId);
        if (imageUrl) {
          updatedData.profileImageUrl = imageUrl;
          console.log('Image uploaded successfully, URL:', imageUrl);
        } else {
          console.error('Failed to upload image');
          return;
        }
      }
      
      console.log('Updating player in database with:', updatedData);
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

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Are you sure you want to delete this player?')) return;

    try {
      await client.models.Player.delete({ id: playerId });
      fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  const calculatePlayerAverages = (player: any) => {
    const games = player.totalGamesPlayed || 0;
    if (games === 0) return { ppg: 0, apg: 0, rpg: 0, fgPct: 0 };

    return {
      ppg: (player.careerPoints / games).toFixed(1),
      apg: (player.careerAssists / games).toFixed(1),
      rpg: (player.careerRebounds / games).toFixed(1),
      fgPct: player.careerFgAttempts > 0 ? ((player.careerFgMade / player.careerFgAttempts) * 100).toFixed(1) : 0
    };
  };

  const resetForm = () => {
    setFormData({ name: '', position: '', height: '', weight: '', jerseyNumber: '', profileImage: null });
    setEditForm({ name: '', position: '', height: '', weight: '', jerseyNumber: '', profileImage: null });
    setPreviewUrl(null);
    setShowAddForm(false);
    setEditingPlayer(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage Diagnostic */}
      <StorageDiagnostic />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
            <User className="w-6 h-6" />
            Player Profiles
          </h2>
          <p className="text-slate-400 mt-1">Manage your team's player roster and track career statistics</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg font-medium text-black transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Player
        </button>
      </div>

      {/* Add Player Form */}
      {showAddForm && (
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Player</h3>
          
          {/* Profile Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-500" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
                  <Camera className="w-3 h-3 text-black" />
                </div>
              </div>
              <div className="text-sm text-slate-400">
                <p>Click to upload a profile picture</p>
                <p className="text-xs">JPG, PNG up to 10MB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Player Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-yellow-500 focus:outline-none"
            />
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
            >
              <option value="">Select Position</option>
              {positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Height (e.g., 6'2&quot;)"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-yellow-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Weight (e.g., 185 lbs)"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-yellow-500 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Jersey #"
              value={formData.jerseyNumber}
              onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-yellow-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreatePlayer}
              disabled={!formData.name.trim() || uploading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center gap-2"
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
              className="bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg p-6 max-w-2xl w-full border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
              <span>Edit Player</span>
              <button 
                onClick={() => {
                  setEditingPlayer(null);
                  setPreviewUrl(null);
                }}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </h3>
            
            {players.filter(p => p.id === editingPlayer).map(player => {
              return (
                <div key={player.id} className="space-y-4">
                  {/* Profile Image Upload */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Profile Picture</label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center overflow-hidden">
                          {previewUrl ? (
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <PlayerImage 
                              profileImageUrl={player.profileImageUrl}
                              className="w-full h-full object-cover"
                              alt={player.name}
                            />
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
                          <Camera className="w-3 h-3 text-black" />
                        </div>
                      </div>
                      <div className="text-sm text-slate-400">
                        <p>Click to change profile picture</p>
                        <p className="text-xs">JPG, PNG up to 10MB</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-yellow-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Position</label>
                      <select
                        value={editForm.position}
                        onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                      >
                        <option value="">Select Position</option>
                        {positions.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Height</label>
                      <input
                        type="text"
                        placeholder="e.g., 6'2&quot;"
                        value={editForm.height}
                        onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-yellow-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Weight</label>
                      <input
                        type="text"
                        placeholder="e.g., 185 lbs"
                        value={editForm.weight}
                        onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-yellow-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Jersey #</label>
                      <input
                        type="number"
                        value={editForm.jerseyNumber}
                        onChange={(e) => setEditForm({ ...editForm, jerseyNumber: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-yellow-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6 justify-end">
                    <button
                      onClick={() => {
                        setEditingPlayer(null);
                        setPreviewUrl(null);
                        setEditForm({ name: '', position: '', height: '', weight: '', jerseyNumber: '', profileImage: null });
                      }}
                      className="bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center gap-2"
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
                        };
                        
                        handleUpdatePlayer(player.id, updatedData, editForm.profileImage);
                      }}
                      disabled={!editForm.name.trim() || uploading}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center gap-2"
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
              );
            })}
          </div>
        </div>
      )}
      
      {/* Players Grid */}
      {players.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No players found</h3>
          <p className="text-slate-500 mb-4">Start by adding your first player to the roster</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-lg font-medium text-black transition-colors"
          >
            Add Your First Player
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => {
            const averages = calculatePlayerAverages(player);
            return (
              <div key={player.id} className="bg-slate-900 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors">
                {/* Player Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{player.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                      {player.position && <span className="bg-slate-800 px-2 py-0.5 rounded">{player.position}</span>}
                      {player.jerseyNumber && <span>#{player.jerseyNumber}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingPlayer(player.id);
                        setEditForm({
                          name: player.name,
                          position: player.position || '',
                          height: player.height || '',
                          weight: player.weight || '',
                          jerseyNumber: player.jerseyNumber?.toString() || '',
                          profileImage: null
                        });
                      }}
                      className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Player Image */}
                <div className="mb-4">
                  <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-slate-700">
                    <PlayerImage 
                      profileImageUrl={player.profileImageUrl}
                      className="w-full h-full object-cover"
                      alt={player.name}
                    />
                  </div>
                </div>

                {/* Physical Stats */}
                {(player.height || player.weight) && (
                  <div className="flex gap-4 text-sm text-slate-400 mb-4">
                    {player.height && <span>Height: {player.height}</span>}
                    {player.weight && <span>Weight: {player.weight}</span>}
                  </div>
                )}
                {/* Career Stats */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span>Games Played: {player.totalGamesPlayed || 0}</span>
                  </div>
                  
                  {player.totalGamesPlayed > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-400">PPG:</span>
                        <span className="font-medium text-white">{averages.ppg}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-400">RPG:</span>
                        <span className="font-medium text-white">{averages.rpg}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-400">APG:</span>
                        <span className="font-medium text-white">{averages.apg}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-400">FG%:</span>
                        <span className="font-medium text-white">{averages.fgPct}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};