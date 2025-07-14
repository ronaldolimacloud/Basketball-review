import React from 'react';
import { Play, Trophy, Users, BarChart3, ArrowRight, Star, Shield, Zap } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white">
      {/* Header */}
      <header className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl">
              <Trophy className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Basketball Pro</h1>
              <p className="text-sm text-zinc-400">Game Management Platform</p>
            </div>
          </div>
          <button
            onClick={onEnterApp}
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all duration-200 shadow-lg hover:shadow-yellow-500/25"
          >
            Enter App
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-yellow-200 to-yellow-400 bg-clip-text text-transparent">
              Elevate Your Game
            </h2>
            <p className="text-xl md:text-2xl text-zinc-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Professional basketball team management platform. Track players, manage teams, analyze games, and review performance like never before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onEnterApp}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all duration-200 shadow-lg hover:shadow-yellow-500/25 text-lg"
              >
                <Play className="w-6 h-6" />
                Start Managing Your Team
              </button>
              <div className="flex items-center gap-2 text-zinc-400">
                <Star className="w-5 h-5 text-yellow-400" />
                <span>No setup required • Free to start</span>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="group p-8 bg-zinc-800/50 rounded-2xl border border-zinc-700 hover:border-yellow-500/50 transition-all duration-300 hover:bg-zinc-800/80">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl w-fit mb-6 group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Player Management</h3>
              <p className="text-zinc-300 leading-relaxed">
                Create comprehensive player profiles with photos, stats, and career tracking. Monitor performance and development over time.
              </p>
            </div>

            <div className="group p-8 bg-zinc-800/50 rounded-2xl border border-zinc-700 hover:border-yellow-500/50 transition-all duration-300 hover:bg-zinc-800/80">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl w-fit mb-6 group-hover:from-green-500/30 group-hover:to-green-600/30 transition-all duration-300">
                <Trophy className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Team Organization</h3>
              <p className="text-zinc-300 leading-relaxed">
                Build and manage multiple teams with custom rosters, team logos, and organizational structure for leagues and tournaments.
              </p>
            </div>

            <div className="group p-8 bg-zinc-800/50 rounded-2xl border border-zinc-700 hover:border-yellow-500/50 transition-all duration-300 hover:bg-zinc-800/80">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl w-fit mb-6 group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-300">
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Game Analytics</h3>
              <p className="text-zinc-300 leading-relaxed">
                Real-time game tracking with live scoring, player statistics, and detailed performance analytics to improve your team's game.
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 rounded-2xl p-12 border border-zinc-600">
            <h3 className="text-3xl font-bold text-center mb-12 text-white">Why Choose Basketball Pro?</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg">
                  <Shield className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2 text-white">Secure & Reliable</h4>
                  <p className="text-zinc-300">Enterprise-grade security with AWS infrastructure ensuring your data is always safe and accessible.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2 text-white">Lightning Fast</h4>
                  <p className="text-zinc-300">Built on modern technology stack for instant response times and seamless user experience.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2 text-white">Team Focused</h4>
                  <p className="text-zinc-300">Designed specifically for basketball teams with features that matter most to coaches and players.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <h3 className="text-3xl font-bold mb-4 text-white">Ready to Transform Your Team?</h3>
            <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
              Join basketball teams worldwide who are already using Basketball Pro to elevate their game management and performance.
            </p>
            <button
              onClick={onEnterApp}
              className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all duration-200 shadow-lg hover:shadow-yellow-500/25 text-lg mx-auto"
            >
              <Play className="w-6 h-6" />
              Get Started Now
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </main>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-yellow-500/3 to-blue-500/3 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default LandingPage; 