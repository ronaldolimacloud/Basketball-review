import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  BarChart3, 
  Users,
  Trophy,
  Target,
  RefreshCw,
  Copy,
  ThumbsUp
} from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { BedrockService, type ChatMessage, type TeamStatsContext } from '../../services/bedrockService';

interface TeamAnalyticsChatProps {
  client: ReturnType<typeof generateClient<Schema>>;
}

export const TeamAnalyticsChat: React.FC<TeamAnalyticsChatProps> = ({ client }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 **Welcome to your Basketball Analytics Assistant!**

I'm here to help you analyze your team's performance, get insights about individual players, and provide coaching recommendations based on your data.

**What I can help you with:**
• Team performance analysis and trends
• Individual player statistics and development
• Game-by-game breakdowns and insights
• Coaching recommendations and strategies
• Areas for improvement and strengths

**Try asking me:**
• "How is my team performing this season?"
• "Who are my top performers?"
• "What areas need improvement?"
• "Give me insights about [player name]"
• "Analyze our latest game"

Just type your question below and I'll analyze your basketball data to provide insights!`,
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [teamContext, setTeamContext] = useState<TeamStatsContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bedrockService = BedrockService.getInstance();

  useEffect(() => {
    loadTeamContext();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTeamContext = async () => {
    try {
      // Load team data for context
      const [playersResponse, gamesResponse, gameStatsResponse] = await Promise.all([
        client.models.Player.list(),
        client.models.Game.list(),
        client.models.GameStat.list()
      ]);

      const players = playersResponse.data || [];
      const games = gamesResponse.data || [];
      const gameStats = gameStatsResponse.data || [];

      const totalGames = games.length;
      const averageTeamScore = games.length > 0 
        ? games.reduce((sum, game) => sum + (game.homeTeamScore || 0), 0) / games.length 
        : 0;

      const context: TeamStatsContext = {
        players,
        games,
        gameStats,
        teamName: 'Your Team', // You could get this from the first game or team settings
        totalGames,
        averageTeamScore
      };

      setTeamContext(context);
    } catch (error) {
      console.error('Error loading team context:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      let response: string;

      // Check if it's a player-specific question
      const playerNameMatch = currentMessage.match(/about\s+([a-zA-Z\s]+)(?:\s+|$)/i);
      if (playerNameMatch && teamContext) {
        const playerName = playerNameMatch[1].trim();
        const player = teamContext.players.find(p => 
          p.name.toLowerCase().includes(playerName.toLowerCase())
        );
        
        if (player) {
          response = await bedrockService.analyzePlayerPerformance(player.id, currentMessage);
        } else {
          response = `I couldn't find a player named "${playerName}". Available players: ${teamContext.players.map(p => p.name).join(', ')}`;
        }
      } else if (teamContext) {
        response = await bedrockService.analyzeTeamPerformance(teamContext, currentMessage);
      } else {
        response = "I'm still loading your team data. Please try again in a moment.";
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const suggestedQuestions = [
    "How is my team performing this season?",
    "Who are my top performers?",
    "What areas need improvement?",
    "Give me defensive analysis",
    "What strategy recommendations do you have?"
  ];

  const MessageBubble = ({ message }: { message: ChatMessage }) => (
    <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.role === 'assistant' && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-black" />
        </div>
      )}
      
      <div className={`max-w-[80%] rounded-lg p-4 ${
        message.role === 'user'
          ? 'bg-yellow-500 text-black'
          : 'bg-zinc-800 text-white border border-zinc-700'
      }`}>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-600/30">
          <span className="text-xs opacity-60">
            {message.timestamp.toLocaleTimeString()}
          </span>
          
          {message.role === 'assistant' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => copyMessage(message.content)}
                className="p-1 hover:bg-zinc-700 rounded transition-colors"
                title="Copy message"
              >
                <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
              </button>
              <button
                className="p-1 hover:bg-zinc-700 rounded transition-colors"
                title="Helpful"
              >
                <ThumbsUp className="w-3 h-3 opacity-60 hover:opacity-100" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {message.role === 'user' && (
        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-zinc-900 rounded-lg border border-zinc-700">
      {/* Header */}
      <div className="p-4 border-b border-zinc-700 bg-gradient-to-r from-zinc-800 to-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Analytics Assistant</h2>
              <p className="text-sm text-zinc-400">AI-powered basketball insights</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadTeamContext}
              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Refresh team data"
            >
              <RefreshCw className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        {teamContext && (
          <div className="grid grid-cols-4 gap-4 mt-4 text-center">
            <div className="bg-zinc-800 rounded-lg p-2">
              <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{teamContext.players.length}</div>
              <div className="text-xs text-zinc-400">Players</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-2">
              <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{teamContext.totalGames}</div>
              <div className="text-xs text-zinc-400">Games</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-2">
              <BarChart3 className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{teamContext.averageTeamScore.toFixed(1)}</div>
              <div className="text-xs text-zinc-400">Avg Score</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-2">
              <Target className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{teamContext.gameStats.length}</div>
              <div className="text-xs text-zinc-400">Records</div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-black" />
            </div>
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-zinc-400 text-sm">Analyzing your data...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-4">
          <p className="text-sm text-zinc-400 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setCurrentMessage(question)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-xs text-zinc-300 hover:text-white transition-colors border border-zinc-600"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-zinc-700">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me about your team's performance, player stats, or coaching strategies..."
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none resize-none"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isLoading}
            className="p-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-zinc-700 disabled:text-zinc-400 text-black rounded-lg transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            Powered by AI Analytics
          </span>
        </div>
      </div>
    </div>
  );
};