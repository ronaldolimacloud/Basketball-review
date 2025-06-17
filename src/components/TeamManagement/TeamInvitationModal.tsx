import React, { useState } from 'react';
import { X, Copy, Mail, QrCode, Share, Check } from 'lucide-react';
// import type { Schema } from '../../../amplify/data/resource';

interface TeamInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: any;
  onInviteCreated: (invitation: any) => void;
  client: any;
}

export const TeamInvitationModal: React.FC<TeamInvitationModalProps> = ({
  isOpen,
  onClose,
  team,
  onInviteCreated,
  client
}) => {
  const [inviteMethod, setInviteMethod] = useState<'link' | 'email'>('link');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateInviteCode = () => {
    // Generate a 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleCreateInvitation = async () => {
    setLoading(true);
    try {
      const inviteCode = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const invitation = await client.models.TeamInvitation.create({
        teamId: team.id,
        inviteCode,
        playerEmail: inviteMethod === 'email' ? playerEmail : undefined,
        playerName: playerName || undefined,
        status: 'pending',
        expiresAt: expiresAt.toISOString(),
        invitedById: 'current-user-id', // This should be the current user's Cognito ID
      });

      setGeneratedCode(inviteCode);
      onInviteCreated(invitation);
      
      // Reset form
      setPlayerEmail('');
      setPlayerName('');
    } catch (error) {
      console.error('Error creating invitation:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedCode) {
      const inviteUrl = `${window.location.origin}/join/${generatedCode}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareInvite = async () => {
    if (generatedCode && navigator.share) {
      const inviteUrl = `${window.location.origin}/join/${generatedCode}`;
      await navigator.share({
        title: `Join ${team.name}`,
        text: `You've been invited to join the ${team.name} basketball team!`,
        url: inviteUrl,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <h2 className="text-xl font-semibold text-white">
            Invite Player to {team.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!generatedCode ? (
            <>
              {/* Invite Method Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">
                  Invitation Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setInviteMethod('link')}
                    className={`p-3 rounded-lg border transition-colors ${
                      inviteMethod === 'link'
                        ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                        : 'border-zinc-600 bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    <QrCode className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs">Share Link</div>
                  </button>
                  <button
                    onClick={() => setInviteMethod('email')}
                    className={`p-3 rounded-lg border transition-colors ${
                      inviteMethod === 'email'
                        ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                        : 'border-zinc-600 bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    <Mail className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs">Email Invite</div>
                  </button>
                </div>
              </div>

              {/* Player Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Player Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter player's name"
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                {inviteMethod === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Player Email *
                    </label>
                    <input
                      type="email"
                      value={playerEmail}
                      onChange={(e) => setPlayerEmail(e.target.value)}
                      placeholder="player@example.com"
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvitation}
                  disabled={loading || (inviteMethod === 'email' && !playerEmail)}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Invitation'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Generated Invitation */}
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-green-400 mb-1">
                    Invitation Created!
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Share this code with the player to join your team
                  </p>
                </div>

                <div className="p-4 bg-zinc-700 rounded-lg">
                  <div className="text-sm text-zinc-400 mb-2">Invitation Code</div>
                  <div className="text-2xl font-mono font-bold text-yellow-400 tracking-wider">
                    {generatedCode}
                  </div>
                  <div className="text-xs text-zinc-500 mt-2">
                    Expires in 7 days
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  {typeof navigator !== 'undefined' && 'share' in navigator ? (
                    <button
                      onClick={shareInvite}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                    >
                      <Share className="w-4 h-4" />
                      Share
                    </button>
                  ) : null}
                </div>

                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};