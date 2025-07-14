import React, { useState } from 'react';
import { X, Users, Check, Camera, Upload } from 'lucide-react';
import { api } from '../../services/api';
import { resizeProfileImage, validateImageFile, formatFileSize, getImageDimensions } from '../../utils/imageUtils';

interface TeamCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: (name: string, description?: string, logoUrl?: string) => Promise<boolean>;
  loading?: boolean;
}

export const TeamCreationModal: React.FC<TeamCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateTeam,
  loading: _loading = false
}) => {
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [originalImageSize, setOriginalImageSize] = useState<string>('');
  const [resizedImageSize, setResizedImageSize] = useState<string>('');

  // Upload optimized logo to S3
  const uploadOptimizedLogo = async (file: File) => {
    try {
      setUploading(true);
      
      console.log('🚀 Uploading optimized team logo');
      
      const result = await api.upload.teamLogo(file, 'temp-team-id');
      
      if (result.success && result.data?.logoUrl) {
        console.log('✅ Upload successful:', result.data.logoUrl);
        setLogoUrl(result.data.logoUrl);
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      alert(`Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // Custom file handler that resizes images before upload
  const handleImageFileSelect = async (file: File) => {
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
      
      console.log(`📊 Original logo: ${originalDimensions.width}x${originalDimensions.height}, Size: ${originalSize}`);

      // Resize the image
      const resizedFile = await resizeProfileImage(file);
      const resizedDimensions = await getImageDimensions(resizedFile);
      const resizedSize = formatFileSize(resizedFile.size);
      setResizedImageSize(resizedSize);

      console.log(`📊 Resized logo: ${resizedDimensions.width}x${resizedDimensions.height}, Size: ${resizedSize}`);

      // Create a preview URL for the resized image
      const previewUrl = URL.createObjectURL(resizedFile);
      setPreviewUrl(previewUrl);

      // Store the resized file
      setLogoFile(resizedFile);
      
    } catch (error) {
      console.error('❌ Error processing logo:', error);
      alert(`Failed to process logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImageProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) return;

    // Check if user has a logo but hasn't uploaded it yet
    if (logoFile && !logoUrl) {
      alert('⚠️ Please click "Upload Logo to Cloud" before creating the team!');
      console.warn('⚠️ User has selected a logo but hasn\'t uploaded it to S3 yet');
      return;
    }

    setCreating(true);
    try {
      const success = await onCreateTeam(teamName.trim(), description.trim() || undefined, logoUrl || undefined);
      if (success) {
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setTeamName('');
    setDescription('');
    setLogoFile(null);
    setLogoUrl('');
    setPreviewUrl(null);
    setOriginalImageSize('');
    setResizedImageSize('');
  };

  const handleClose = () => {
    if (!creating) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Users className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Create New Team</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={creating}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Comets White, Lakers JV, Warriors U16"
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
              disabled={creating}
              maxLength={50}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description about this team..."
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 resize-none"
              disabled={creating}
              rows={3}
              maxLength={200}
            />
          </div>

          {/* Team Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Team Logo (optional)</label>
            
            {/* Image Preview */}
            {previewUrl && (
              <div className="mb-4 flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-zinc-600">
                  <img 
                    src={previewUrl} 
                    alt="Logo preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm">
                  <div className="text-zinc-300">✅ Logo optimized and ready to upload</div>
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
                  {imageProcessing ? 'Processing logo...' : 'Select a team logo'}
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
                        Choose Logo
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
                    disabled={imageProcessing || creating}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Upload status and button */}
            {logoFile && (
              <div className="mt-4 space-y-3">
                {/* Upload Status */}
                {logoUrl ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-sm font-medium">✅ Logo uploaded to cloud successfully!</span>
                    </div>
                    <div className="text-xs text-emerald-300/70 mt-1">
                      Ready to create team
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">⚠️ Logo processed but not uploaded yet</span>
                    </div>
                    <div className="text-xs text-yellow-300/70 mt-1">
                      Click "Upload to Cloud" below before creating team
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                {!logoUrl && (
                  <button
                    type="button"
                    onClick={() => uploadOptimizedLogo(logoFile!)}
                    disabled={uploading || creating}
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
                        Upload Logo to Cloud
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={creating || uploading}
              className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!teamName.trim() || creating || uploading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-zinc-600 disabled:to-zinc-700 text-black font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {creating || uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  {creating ? 'Creating...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Team
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 