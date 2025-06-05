import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Play, Users, History, Trophy } from 'lucide-react';
import type { Schema } from '../amplify/data/resource';

// Components
import { GameReview } from './components/GameReview/GameReview';
import { PlayerProfiles } from './components/PlayerProfiles/PlayerProfiles';
import { GameHistory } from './components/GameHistory/GameHistory';

// Generate the Amplify Data client
const client = generateClient<Schema>();

type TabType = 'game' | 'players' | 'history';

const BasketballReviewApp = () => {
  const [activeTab, setActiveTab] = useState<TabType>('players');

  const tabs = [
    {
      id: 'players' as TabType,
      label: 'Player Profiles',
      icon: Users,
      component: PlayerProfiles
    },
    {
      id: 'game' as TabType,
      label: 'Game Review',
      icon: Play,
      component: GameReview
    },
    {
      id: 'history' as TabType,
      label: 'Game History',
      icon: History,
      component: GameHistory
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PlayerProfiles;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h1 className="text-2xl font-bold text-yellow-400">Basketball Manager Pro</h1>
            </div>
            <div className="text-sm text-slate-400">
              Powered by AWS Amplify Gen 2
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'text-yellow-400 border-b-2 border-yellow-400 bg-slate-800'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <ActiveComponent client={client} />
      </div>
    </div>
  );
};

export default BasketballReviewApp; 