import { useState, useEffect } from 'react';
import { Play, Users, Trophy, Menu, X, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

// Components  
import { GameReview } from './components/GameReview/GameReview';
import { PlayersSimplified } from './components/PlayerProfiles/PlayersSimplified';
import { MyTeams } from './components/MyTeams/MyTeams';

type TabType = 'game' | 'players' | 'teams';

const BasketballReviewApp = () => {
  const [activeTab, setActiveTab] = useState<TabType>('players');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const tabs = [
    {
      id: 'players' as TabType,
      label: 'Players',
      icon: Users,
      component: PlayersSimplified,
      description: 'Manage player profiles and basic information'
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
      description: 'Track live game statistics and manage gameplay'
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PlayersSimplified;
  const activeTabInfo = tabs.find(tab => tab.id === activeTab);

  // Save collapsed state when it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => !prev);
  };

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
        fixed lg:static inset-y-0 left-0 z-50 bg-gradient-to-b from-zinc-900 to-zinc-800 
        border-r border-zinc-700 transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'w-20' : 'w-72'}
      `}>
        {/* Sidebar Header */}
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} p-6 border-b border-zinc-700`}>
          <div className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3'}`}>
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg">
              <Trophy className="w-6 h-6 text-black" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-white">Basketball Pro</h1>
                <p className="text-xs text-zinc-400">Game Management</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Collapse Toggle Button - Desktop Only */}
        <div className="hidden lg:flex justify-end p-2 border-b border-zinc-700">
          <button
            onClick={toggleSidebarCollapse}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
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
                  w-full flex ${sidebarCollapsed ? 'justify-center' : 'items-start gap-4'} p-4 rounded-xl text-left transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 text-yellow-400'
                    : 'hover:bg-zinc-700/50 text-zinc-300 hover:text-white'
                  }
                `}
                title={sidebarCollapsed ? tab.label : undefined}
              >
                <Icon className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mt-0.5'} ${isActive ? 'text-yellow-400' : ''}`} />
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${isActive ? 'text-yellow-400' : ''}`}>
                      {tab.label}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {tab.description}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-700">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} text-sm text-zinc-400`}>
            <BarChart3 className="w-4 h-4" />
            {!sidebarCollapsed && <span>React + Express App</span>}
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
                Basketball Review App
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="h-full">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BasketballReviewApp; 