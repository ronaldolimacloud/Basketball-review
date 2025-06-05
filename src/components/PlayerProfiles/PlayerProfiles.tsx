import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, User, Trophy, TrendingUp, Camera, Upload, Users } from 'lucide-react';
import type { Schema } from '../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl } from 'aws-amplify/storage';

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const positions = ['PG', 'SG', 'SF', 'PF', 'C'];

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData({ ...formData, profileImage: file });
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getImageUrl = async (imagePath: string): Promise<string> => {
    try {
      const urlResult = await getUrl({
        path: imagePath
      });
      return urlResult.url.toString();
    } catch (error) {
      console.error('Error getting image URL:', error);
      return '/default-player.png';
    }
  };

  // Component to handle async image loading
  const PlayerImage: React.FC<{ player: any; className: string; alt: string }> = ({ player, className, alt }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadImage = async () => {
        if (player.profileImageUrl) {
          try {
            const url = await getImageUrl(player.profileImageUrl);
            setImageUrl(url);
          } catch (error) {
            console.error('Error loading image:', error);
            setImageUrl('/default-player.png');
          }
        } else {
          setImageUrl('/default-player.png');
        }
        setLoading(false);
      };

      loadImage();
    }, [player.profileImageUrl]);

    if (loading) {
      return (
        <div className={className}>
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        </div>
      );
    }

    return (
      <img 
        src={imageUrl || '/default-player.png'} 
        alt={alt}
        className={className}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/default-player.png';
        }}
      />
    );
  };

  const uploadProfileImage = async (file: File, playerId: string): Promise<string | null> => {
    try {
      setUploading(true);
      const fileName = `player-images/${playerId}-${Date.now()}-${file.name}`;
      
      console.log('Uploading file:', fileName);
      
      const result = await uploadData({
        path: fileName,
        data: file,
        options: {
          contentType: file.type
        }
      }).result;

      console.log('Upload result:', result);

      // Return the path instead of generating URL immediately
      // We'll generate URLs when displaying images
      return fileName;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
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
        console.log('Uploading profile image for player:', newPlayer.data.id);
        const imageUrl = await uploadProfileImage(formData.profileImage, newPlayer.data.id);
        if (imageUrl) {
          console.log('Updating player with image URL:', imageUrl);
          const updateResult = await client.models.Player.update({
            id: newPlayer.data.id,
            profileImageUrl: imageUrl
          });
          console.log('Player update result:', updateResult);
        } else {
          console.error('Failed to get image URL after upload');
        }
      }

      setFormData({ name: '', position: '', height: '', weight: '', jerseyNumber: '', profileImage: null });
      setPreviewUrl(null);
      setShowAddForm(false);
      
      // Wait a moment for the image to be processed, then refresh
      setTimeout(() => {
        fetchPlayers();
      }, 1000);
    } catch (error) {
      console.error('Error creating player:', error);
    }
  };

  const handleUpdatePlayer = async (playerId: string, updatedData: any) => {
    try {
      await client.models.Player.update({
        id: playerId,
        ...updatedData
      });
      setEditingPlayer(null);
      fetchPlayers();
    } catch (error) {
      console.error('Error updating player:', error);
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
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="bg-yellow-500 p-2 rounded-lg">
                <Users className="w-6 h-6 text-black" />
              </div>
              Team Roster
            </h2>
            <p className="text-slate-400 mt-2 text-lg">Manage your player profiles and track career statistics</p>
            <div className="flex items-center gap-6 mt-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                {players.filter(p => p.isActive).length} Active Players
              </span>
              <span className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                {players.reduce((sum, p) => sum + (p.totalGamesPlayed || 0), 0)} Total Games
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-6 py-3 rounded-xl font-bold text-black transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Add New Player
          </button>
        </div>
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

      {/* Players Grid */}
      {players.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl border border-slate-700">
          <div className="bg-slate-800 w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center border-2 border-slate-600">
            <Users className="w-12 h-12 text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Build Your Team Roster</h3>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">Start creating your basketball team by adding player profiles. Track stats, manage positions, and build your championship squad.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 px-8 py-4 rounded-xl font-bold text-black transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Add Your First Player
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {players.map((player) => {
            const averages = calculatePlayerAverages(player);
            return (
              <div key={player.id} className="group relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-700 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10">
                {/* Action Buttons - Top Right */}
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingPlayer(player.id)}
                      className="p-1.5 rounded-full bg-slate-900/80 text-slate-400 hover:text-yellow-400 hover:bg-slate-800 transition-colors backdrop-blur-sm"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      className="p-1.5 rounded-full bg-slate-900/80 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors backdrop-blur-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                                 {/* Player Photo */}
                 <div className="relative bg-gradient-to-b from-slate-700 to-slate-800 p-4">
                   <div className="w-32 h-32 mx-auto rounded-lg bg-slate-800 border-2 border-slate-600 overflow-hidden shadow-lg">
                     <PlayerImage 
                       player={player}
                       className="w-full h-full object-cover"
                       alt={player.name}
                     />
                   </div>
                 </div>

                {/* Player Info */}
                <div className="p-4 space-y-3">
                  {/* Name and Jersey */}
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-1">{player.name}</h3>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      {player.jerseyNumber && (
                        <span className="bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold text-xs">
                          #{player.jerseyNumber}
                        </span>
                      )}
                      {player.position && (
                        <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-medium text-xs">
                          {player.position}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Physical Stats */}
                  {(player.height || player.weight) && (
                    <div className="flex justify-center gap-4 text-xs text-slate-400">
                      {player.height && <span>{player.height}</span>}
                      {player.weight && <span>{player.weight}</span>}
                    </div>
                  )}

                  {/* Career Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      <span>{player.totalGamesPlayed || 0} GP</span>
                    </div>
                    
                    {player.totalGamesPlayed > 0 && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center p-2 bg-slate-800/50 rounded border border-slate-700">
                          <div className="font-bold text-yellow-400">{averages.ppg}</div>
                          <div className="text-slate-500">PPG</div>
                        </div>
                        <div className="text-center p-2 bg-slate-800/50 rounded border border-slate-700">
                          <div className="font-bold text-emerald-400">{averages.rpg}</div>
                          <div className="text-slate-500">RPG</div>
                        </div>
                        <div className="text-center p-2 bg-slate-800/50 rounded border border-slate-700">
                          <div className="font-bold text-purple-400">{averages.apg}</div>
                          <div className="text-slate-500">APG</div>
                        </div>
                        <div className="text-center p-2 bg-slate-800/50 rounded border border-slate-700">
                          <div className="font-bold text-cyan-400">{averages.fgPct}%</div>
                          <div className="text-slate-500">FG%</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      player.isActive ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${player.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`}></div>
                      {player.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}; 