import React, { useState } from 'react';
import { X, Users, Check } from 'lucide-react';

interface TeamCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTeam: (name: string, description?: string) => Promise<boolean>;
  loading?: boolean;
}

export const TeamCreationModal: React.FC<TeamCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateTeam,
  loading: _ = false
}) => {
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) return;

    setCreating(true);
    try {
      const success = await onCreateTeam(teamName.trim(), description.trim() || undefined);
      if (success) {
        setTeamName('');
        setDescription('');
        onClose();
      }
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setTeamName('');
      setDescription('');
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={creating}
              className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!teamName.trim() || creating}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-zinc-600 disabled:to-zinc-700 text-black font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Creating...
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