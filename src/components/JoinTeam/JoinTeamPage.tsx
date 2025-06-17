import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Check, AlertCircle, Users } from 'lucide-react';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

export const JoinTeamPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuthenticator();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (code) {
      findInvitation();
    }
  }, [code]);

  const findInvitation = async () => {
    try {
      setLoading(true);
      
      // Find invitation by code
      const invitationResponse = await client.models.TeamInvitation.list({
        filter: { 
          inviteCode: { eq: code?.toUpperCase() },
          status: { eq: 'pending' }
        }
      });

      if (invitationResponse.data.length === 0) {
        setError('Invalid or expired invitation code');
        return;
      }

      const foundInvitation = invitationResponse.data[0];
      
      // Check if invitation is expired
      if (foundInvitation.expiresAt && new Date(foundInvitation.expiresAt) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      setInvitation(foundInvitation);

      // Get team details
      const teamResponse = await client.models.Team.get({ id: foundInvitation.teamId });
      if (teamResponse.data) {
        setTeam(teamResponse.data);
      }
    } catch (error) {
      console.error('Error finding invitation:', error);
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!user || !invitation || !team) return;

    setJoining(true);
    setError('');

    try {
      // First, create or find player profile
      let playerProfile;
      const existingPlayerResponse = await client.models.Player.list({
        filter: { userId: { eq: user.userId } }
      });

      if (existingPlayerResponse.data.length > 0) {
        playerProfile = existingPlayerResponse.data[0];
      } else {
        // Create new player profile
        const newPlayerResponse = await client.models.Player.create({
          name: invitation.playerName || user.signInDetails?.loginId?.split('@')[0] || 'New Player',
          userId: user.userId,
          isActive: true
        });
        playerProfile = newPlayerResponse.data;
      }

      if (!playerProfile?.id) {
        setError('Failed to create or find player profile');
        return;
      }

      // Check if already a member
      const existingMemberResponse = await client.models.TeamPlayer.list({
        filter: {
          teamId: { eq: team.id },
          playerId: { eq: playerProfile.id }
        }
      });

      if (existingMemberResponse.data.length > 0) {
        setError('You are already a member of this team');
        return;
      }

      // Add player to team
      if (playerProfile?.id) {
        await client.models.TeamPlayer.create({
          teamId: team.id,
          playerId: playerProfile.id,
          isActive: true,
          dateJoined: new Date().toISOString(),
          role: 'player'
        });
      }

      // Update invitation status
      await client.models.TeamInvitation.update({
        id: invitation.id,
        status: 'accepted'
      });

      setSuccess(true);
      
      // Redirect to dashboard after success
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Error joining team:', error);
      setError('Failed to join team. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="p-4 bg-red-900/20 border border-red-700 rounded-xl">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Invalid Invitation</h2>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="p-6 bg-green-900/20 border border-green-700 rounded-xl">
            <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to the Team!</h2>
            <p className="text-green-400 mb-4">
              You've successfully joined {team?.name}. Redirecting to your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join Team</h1>
          <p className="text-zinc-400">You've been invited to join a basketball team</p>
        </div>

        {team && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-1">{team.name}</h3>
              {team.description && (
                <p className="text-sm text-zinc-400">{team.description}</p>
              )}
            </div>

            <div className="bg-zinc-700 rounded-lg p-4 mb-6">
              <div className="text-sm text-zinc-300 mb-2">Invitation Details:</div>
              <div className="space-y-1 text-xs text-zinc-400">
                <div>Code: {invitation.inviteCode}</div>
                {invitation.playerName && (
                  <div>For: {invitation.playerName}</div>
                )}
                <div>
                  Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 mb-4">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinTeam}
                disabled={joining}
                className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {joining ? 'Joining...' : 'Join Team'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};