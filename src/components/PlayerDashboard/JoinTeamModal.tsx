import React, { useState } from 'react';
import { X, Users, Check, AlertCircle } from 'lucide-react';

interface JoinTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess: () => void;
  client: any;
  userId: string;
}

export const JoinTeamModal: React.FC<JoinTeamModalProps> = ({
  isOpen,
  onClose,
  onJoinSuccess,
  client,
  userId
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamFound, setTeamFound] = useState<any>(null);
  const [step, setStep] = useState<'enter-code' | 'confirm-join' | 'success'>('enter-code');

  if (!isOpen) return null;

  const handleCodeSubmit = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invitation code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Find invitation by code
      const invitationResponse = await client.models.TeamInvitation.list({
        filter: { 
          inviteCode: { eq: inviteCode.toUpperCase() },
          status: { eq: 'pending' }
        }
      });

      if (invitationResponse.data.length === 0) {
        setError('Invalid or expired invitation code');
        return;
      }

      const invitation = invitationResponse.data[0];
      
      // Check if invitation is expired
      if (new Date(invitation.expiresAt) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      // Get team details
      const teamResponse = await client.models.Team.get({ id: invitation.teamId });
      if (!teamResponse.data) {
        setError('Team not found');
        return;
      }

      setTeamFound({
        ...teamResponse.data,
        invitation
      });
      setStep('confirm-join');
    } catch (error) {
      console.error('Error finding team:', error);
      setError('Failed to find team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    setLoading(true);
    setError('');

    try {
      // First, create or find player profile
      let playerProfile;
      const existingPlayerResponse = await client.models.Player.list({
        filter: { userId: { eq: userId } }
      });

      if (existingPlayerResponse.data.length > 0) {
        playerProfile = existingPlayerResponse.data[0];
      } else {
        // Create new player profile
        const newPlayerResponse = await client.models.Player.create({
          name: teamFound.invitation.playerName || 'New Player',
          userId: userId,
          isActive: true
        });
        playerProfile = newPlayerResponse.data;
      }

      // Check if already a member
      const existingMemberResponse = await client.models.TeamPlayer.list({
        filter: {
          teamId: { eq: teamFound.id },
          playerId: { eq: playerProfile.id }
        }
      });

      if (existingMemberResponse.data.length > 0) {
        setError('You are already a member of this team');
        return;
      }

      // Add player to team
      await client.models.TeamPlayer.create({
        teamId: teamFound.id,
        playerId: playerProfile.id,
        isActive: true,
        dateJoined: new Date().toISOString(),
        role: 'player'
      });

      // Update invitation status
      await client.models.TeamInvitation.update({
        id: teamFound.invitation.id,
        status: 'accepted'
      });

      setStep('success');
      
      // Auto-close after success
      setTimeout(() => {
        onJoinSuccess();
        onClose();
        resetModal();
      }, 2000);
    } catch (error) {
      console.error('Error joining team:', error);
      setError('Failed to join team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setInviteCode('');
    setError('');
    setTeamFound(null);
    setStep('enter-code');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <h2 className="text-xl font-semibold text-white">
            {step === 'enter-code' && 'Join a Team'}
            {step === 'confirm-join' && 'Confirm Team Join'}
            {step === 'success' && 'Welcome to the Team!'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6">
          {step === 'enter-code' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Users className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <p className="text-zinc-400">
                  Enter the invitation code provided by your coach
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Invitation Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-center text-2xl font-mono tracking-wider"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCodeSubmit}
                  disabled={loading || !inviteCode.trim()}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {loading ? 'Searching...' : 'Find Team'}
                </button>
              </div>
            </div>
          )}

          {step === 'confirm-join' && teamFound && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {teamFound.name}
                </h3>
                {teamFound.description && (
                  <p className="text-sm text-zinc-400">{teamFound.description}</p>
                )}
              </div>

              <div className="bg-zinc-700 rounded-lg p-4">
                <div className="text-sm text-zinc-300 mb-2">Invitation Details:</div>
                <div className="space-y-1 text-xs text-zinc-400">
                  <div>Code: {teamFound.invitation.inviteCode}</div>
                  {teamFound.invitation.playerName && (
                    <div>For: {teamFound.invitation.playerName}</div>
                  )}
                  <div>
                    Expires: {new Date(teamFound.invitation.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('enter-code')}
                  className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleJoinTeam}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {loading ? 'Joining...' : 'Join Team'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Successfully Joined!
                </h3>
                <p className="text-sm text-zinc-400">
                  Welcome to {teamFound?.name}. Redirecting to your dashboard...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};