import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Copy, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  User, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Phone,
  X
} from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { generateSimpleAccessCode } from '../../utils/playerAccessUtils';
import { PlayerImage } from '../PlayerProfiles/PlayerImage';
import { 
  sendSMS, 
  createPlayerAccessMessage, 
  isValidPhoneNumber,
  type SMSResult 
} from '../../utils/smsNotifications';

interface PlayerAccessManagerProps {
  client: ReturnType<typeof generateClient<Schema>>;
}

export const PlayerAccessManager: React.FC<PlayerAccessManagerProps> = ({ client }) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({});
  const [copyFeedback, setCopyFeedback] = useState<Record<string, boolean>>({});
  
  // SMS functionality state
  const [smsModal, setSmsModal] = useState<{ isOpen: boolean; player: any | null }>({ 
    isOpen: false, 
    player: null 
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sendingSMS, setSendingSMS] = useState(false);
  const [smsResults, setSmsResults] = useState<Record<string, SMSResult>>({});

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const response = await client.models.Player.list();
      if (response.data) {
        setPlayers(response.data);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAccessCode = async (player: any) => {
    try {
      const newCode = generateSimpleAccessCode(player.name);
      
      await client.models.Player.update({
        id: player.id,
        accessCode: newCode
      });

      // Update local state
      setPlayers(prev => prev.map(p => 
        p.id === player.id ? { ...p, accessCode: newCode } : p
      ));

      alert(`New access code generated for ${player.name}: ${newCode}`);
    } catch (error) {
      console.error('Error generating access code:', error);
      alert('Failed to generate access code. Please try again.');
    }
  };

  const copyToClipboard = (text: string, playerId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(prev => ({ ...prev, [playerId]: true }));
      setTimeout(() => {
        setCopyFeedback(prev => ({ ...prev, [playerId]: false }));
      }, 2000);
    });
  };

  const toggleShowCode = (playerId: string) => {
    setShowCodes(prev => ({ ...prev, [playerId]: !prev[playerId] }));
  };

  // SMS Functions
  const openSmsModal = (player: any) => {
    setSmsModal({ isOpen: true, player });
    setPhoneNumber('');
  };

  const closeSmsModal = () => {
    setSmsModal({ isOpen: false, player: null });
    setPhoneNumber('');
  };

  const sendAccessCodeSMS = async () => {
    if (!smsModal.player || !phoneNumber.trim()) {
      alert('Please enter a phone number.');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      alert('Please enter a valid phone number. Format: (555) 123-4567 or +1-555-123-4567');
      return;
    }

    setSendingSMS(true);
    
    try {
      const message = createPlayerAccessMessage(
        smsModal.player.name,
        smsModal.player.accessCode,
        `${window.location.origin}/player-portal`
      );

      const result = await sendSMS({
        phoneNumber,
        message,
        playerName: smsModal.player.name
      });

      // Store the result for feedback
      setSmsResults(prev => ({ 
        ...prev, 
        [smsModal.player.id]: result 
      }));

      if (result.success) {
        alert(`✅ SMS sent successfully to ${smsModal.player.name}!\nMessage ID: ${result.messageId}`);
        closeSmsModal();
      } else {
        alert(`❌ Failed to send SMS: ${result.error}`);
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      alert(`❌ Failed to send SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingSMS(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        <span className="ml-3 text-zinc-400">Loading players...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Player Access Management</h2>
          <p className="text-zinc-400">Manage player portal access codes and monitor usage</p>
        </div>
        <button
          onClick={loadPlayers}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-blue-200 font-medium mb-1">How Player Access Works</h3>
            <p className="text-blue-300 text-sm leading-relaxed mb-3">
              Each player gets a unique access code to view their personal dashboard. Players can see their stats, 
              assigned video clips, and coach feedback. Players access their portal through a separate, public link 
              that doesn't require your coach credentials.
            </p>
            <div className="bg-blue-800/30 rounded-lg p-3 border border-blue-600/30">
              <p className="text-blue-200 text-sm font-medium mb-1">Player Portal Link:</p>
              <div className="flex items-center gap-2">
                <code className="bg-blue-700/50 px-2 py-1 rounded text-blue-100 text-sm font-mono">
                  {window.location.origin}/player-portal
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/player-portal`)}
                  className="p-1 hover:bg-blue-600/30 rounded transition-colors"
                  title="Copy player portal link"
                >
                  <Copy className="w-4 h-4 text-blue-400" />
                </button>
              </div>
              <p className="text-blue-300 text-xs mt-1">
                Share this link with players along with their access codes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid gap-4">
        {players.length === 0 ? (
          <div className="text-center py-12 bg-zinc-800 rounded-lg border border-zinc-700">
            <User className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Players Found</h3>
            <p className="text-zinc-400">Add players to your team to manage their portal access.</p>
          </div>
        ) : (
          players.map((player) => (
            <div
              key={player.id}
              className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                {/* Player Info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full overflow-hidden flex items-center justify-center">
                    <PlayerImage 
                      profileImageUrl={player.profileImageUrl}
                      className="w-full h-full rounded-full"
                      alt={player.name}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{player.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      <span>#{player.jerseyNumber || 'N/A'}</span>
                      <span>•</span>
                      <span>{player.position || 'Position TBD'}</span>
                      {player.lastAccessDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Last access: {new Date(player.lastAccessDate).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Access Code Section */}
                <div className="flex items-center gap-3">
                  {player.accessCode ? (
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm text-zinc-400">Access Code</div>
                        <div className="flex items-center gap-2">
                          <code className="bg-zinc-700 px-3 py-1 rounded text-yellow-400 font-mono">
                            {showCodes[player.id] ? player.accessCode : '••••••••'}
                          </code>
                          <button
                            onClick={() => toggleShowCode(player.id)}
                            className="p-1 hover:bg-zinc-700 rounded transition-colors"
                            title={showCodes[player.id] ? 'Hide code' : 'Show code'}
                          >
                            {showCodes[player.id] ? (
                              <EyeOff className="w-4 h-4 text-zinc-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-zinc-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => copyToClipboard(player.accessCode, player.id)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                          title="Copy access code"
                        >
                          {copyFeedback[player.id] ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <Copy className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <button
                          onClick={() => generateAccessCode(player)}
                          className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                          title="Generate new code"
                        >
                          <RefreshCw className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => openSmsModal(player)}
                          className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                          title="Send SMS to player"
                        >
                          <MessageSquare className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-zinc-400 text-sm mb-2">No access code</p>
                      <button
                        onClick={() => generateAccessCode(player)}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-white font-medium"
                      >
                        <Key className="w-4 h-4" />
                        Generate Code
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Portal Link */}
              {player.accessCode && (
                <div className="mt-4 pt-4 border-t border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Share with player:</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Send them the player portal link with their access code
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(
                        `Hi ${player.name}! 🏀\n\nAccess your basketball portal here:\n${window.location.origin}/player-portal\n\nYour access code: ${player.accessCode}\n\nView your stats, videos, and coach feedback anytime!`,
                        `${player.id}-message`
                      )}
                      className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-sm transition-colors"
                    >
                      {copyFeedback[`${player.id}-message`] ? (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          Copied Message
                        </span>
                      ) : (
                        'Copy Message'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* SMS Modal */}
      {smsModal.isOpen && smsModal.player && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                Send SMS to {smsModal.player.name}
              </h3>
              <button
                onClick={closeSmsModal}
                className="p-1 hover:bg-zinc-700 rounded transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(555) 123-4567 or +1-555-123-4567"
                    className="w-full pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none"
                    disabled={sendingSMS}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Phone number will receive the access code and portal link
                </p>
              </div>

              <div className="bg-zinc-700/50 rounded-lg p-3 border border-zinc-600">
                <p className="text-sm text-zinc-300 mb-2">Preview Message:</p>
                <div className="text-xs text-zinc-400 font-mono whitespace-pre-wrap">
                  {smsModal.player.accessCode ? 
                    createPlayerAccessMessage(
                      smsModal.player.name,
                      smsModal.player.accessCode,
                      `${window.location.origin}/player-portal`
                    ) : 
                    'Please generate an access code first'
                  }
                </div>
              </div>

              {smsResults[smsModal.player.id] && (
                <div className={`p-3 rounded-lg border ${
                  smsResults[smsModal.player.id].success 
                    ? 'bg-green-900/30 border-green-700/50 text-green-200'
                    : 'bg-red-900/30 border-red-700/50 text-red-200'
                }`}>
                  <p className="text-sm">
                    {smsResults[smsModal.player.id].success 
                      ? `✅ SMS sent successfully! ID: ${smsResults[smsModal.player.id].messageId}`
                      : `❌ Failed: ${smsResults[smsModal.player.id].error}`
                    }
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={closeSmsModal}
                  className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  disabled={sendingSMS}
                >
                  Cancel
                </button>
                <button
                  onClick={sendAccessCodeSMS}
                  disabled={sendingSMS || !phoneNumber.trim() || !smsModal.player.accessCode}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {sendingSMS ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      Send SMS
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};