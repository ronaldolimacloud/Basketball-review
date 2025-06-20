import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Play, Users, History, Trophy, Menu, X, BarChart3, LogOut, Radio, Key, Brain } from 'lucide-react';
import type { Schema } from '../amplify/data/resource';

// Components
import { GameReview } from './components/GameReview/GameReview';
import { PlayersWithTeamAssignment } from './components/PlayerProfiles/PlayersWithTeamAssignment';
import { MyTeams } from './components/MyTeams/MyTeams';
import { GameHistory } from './components/GameHistory/GameHistory';
import { LiveGames } from './components/LiveGames/LiveGames';
import { PlayerAccessManager } from './components/PlayerManagement/PlayerAccessManager';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';

// Generate the Amplify Data client
const client = generateClient<Schema>();

type TabType = 'game' | 'players' | 'teams' | 'history' | 'live' | 'access' | 'analytics';

const BasketballReviewApp = () => {
  const { user, signOut } = useAuthenticator();
  const [activeTab, setActiveTab] = useState<TabType>('players');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = [
    {
      id: 'players' as TabType,
      label: 'Players',
      icon: Users,
      component: PlayersWithTeamAssignment,
      description: 'Manage player profiles, photos, and team assignments'
    },
    {
      id: 'teams' as TabType,
      label: 'My Teams',
      icon: Trophy,
      component: MyTeams,
      description: 'Create and manage your basketball teams'
    },
    {
      id: 'game' as TabType,
      label: 'Game Review',
      icon: Play,
      component: GameReview,
      description: 'Live game tracking with video analysis'
    },
    {
      id: 'live' as TabType,
      label: 'Live Games',
      icon: Radio,
      component: LiveGames,
      description: 'Follow live game feeds and play-by-play'
    },
    {
      id: 'history' as TabType,
      label: 'Game History',
      icon: History,
      component: GameHistory,
      description: 'Review past games and statistics'
    },
    {
      id: 'access' as TabType,
      label: 'Access Management',
      icon: Key,
      component: PlayerAccessManager,
      description: 'Manage player portal access codes'
    },
    {
      id: 'analytics' as TabType,
      label: 'AI Analytics',
      icon: Brain,
      component: AnalyticsDashboard,
      description: 'AI-powered performance insights and chat'
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PlayersWithTeamAssignment;
  const activeTabInfo = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-zinc-900 to-zinc-800 
        border-r border-zinc-700 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg">
              <Trophy className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Basketball Pro</h1>
              <p className="text-xs text-zinc-400">Game Management</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 text-yellow-400'
                    : 'hover:bg-zinc-700/50 text-zinc-300 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-yellow-400' : ''}`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${isActive ? 'text-yellow-400' : ''}`}>
                    {tab.label}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-700">
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <BarChart3 className="w-4 h-4" />
            <span>Powered by AWS Amplify Gen 2</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-700 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {activeTabInfo?.label}
                </h2>
                <p className="text-sm text-zinc-400">
                  {activeTabInfo?.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-zinc-400">
                Welcome, {user?.signInDetails?.loginId}
              </div>
              <button 
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="h-full">
            <ActiveComponent client={client} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BasketballReviewApp; 