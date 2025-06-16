import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn, Trophy } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

interface PlayerAccessFormProps {
  onPlayerLogin: (player: any) => void;
}

const client = generateClient<Schema>();

export const PlayerAccessForm: React.FC<PlayerAccessFormProps> = ({ onPlayerLogin }) => {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      setError('Please enter your access code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Find player by access code
      const playersResponse = await client.models.Player.list({
        filter: {
          accessCode: {
            eq: accessCode.trim()
          }
        }
      });

      if (playersResponse.data && playersResponse.data.length > 0) {
        const player = playersResponse.data[0];
        
        // Update last access date
        await client.models.Player.update({
          id: player.id,
          lastAccessDate: new Date().toISOString()
        });

        onPlayerLogin(player);
      } else {
        setError('Invalid access code. Please check with your coach.');
      }
    } catch (err) {
      console.error('Error logging in player:', err);
      setError('Unable to connect. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const generateSampleCode = () => {
    // For demo purposes - generate a sample code
    const codes = ['PLAYER2024', 'BBALL001', 'COURT23', 'TEAM001'];
    const randomCode = codes[Math.floor(Math.random() * codes.length)];
    setAccessCode(randomCode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Player Portal</h1>
          <p className="text-zinc-400">Enter your access code to view your basketball progress</p>
        </div>

        {/* Access Form */}
        <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Access Code Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                <User className="w-4 h-4 inline mr-2" />
                Access Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type={showCode ? 'text' : 'password'}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-12 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none transition-colors"
                  placeholder="Enter your code"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white transition-colors"
                >
                  {showCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Demo Helper */}
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={generateSampleCode}
                  className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors"
                >
                  Generate sample code for demo
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !accessCode.trim()}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-zinc-600 disabled:to-zinc-700 text-black disabled:text-zinc-400 font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  Accessing Portal...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Enter Portal
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-zinc-700">
            <div className="text-center">
              <p className="text-zinc-400 text-sm mb-2">Need help accessing your portal?</p>
              <p className="text-zinc-500 text-xs">
                Contact your coach for your personal access code.
                <br />
                Your code is unique and gives you access to your stats, videos, and feedback.
              </p>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs text-zinc-400">Your Stats</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
            <div className="text-2xl mb-1">🎥</div>
            <p className="text-xs text-zinc-400">Your Videos</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
            <div className="text-2xl mb-1">💬</div>
            <p className="text-xs text-zinc-400">Coach Feedback</p>
          </div>
        </div>
      </div>
    </div>
  );
};