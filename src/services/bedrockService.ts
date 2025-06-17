import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TeamStatsContext {
  players: any[];
  games: any[];
  gameStats: any[];
  teamName: string;
  totalGames: number;
  averageTeamScore: number;
  winLossRecord?: { wins: number; losses: number };
}

export class BedrockService {
  private static instance: BedrockService;
  
  private constructor() {}
  
  public static getInstance(): BedrockService {
    if (!BedrockService.instance) {
      BedrockService.instance = new BedrockService();
    }
    return BedrockService.instance;
  }

  /**
   * Simulate Bedrock LLM call for basketball analysis
   * In a real implementation, this would call AWS Bedrock API
   */
  async analyzeTeamPerformance(context: TeamStatsContext, question: string): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate contextual response based on team data
    const response = this.generateBasketballResponse(context, question);
    return response;
  }

  /**
   * Get player-specific insights
   */
  async analyzePlayerPerformance(playerId: string, question: string): Promise<string> {
    try {
      // Get player data
      const player = await client.models.Player.get({ id: playerId });
      const playerStats = await client.models.GameStat.list({
        filter: { playerId: { eq: playerId } }
      });

      if (!player.data || !playerStats.data) {
        return "I couldn't find data for that player. Please make sure the player exists and has game statistics.";
      }

      await new Promise(resolve => setTimeout(resolve, 1200));

      const context = {
        player: player.data,
        gameStats: playerStats.data
      };

      return this.generatePlayerResponse(context, question);
    } catch (error) {
      console.error('Error analyzing player performance:', error);
      return "I encountered an error while analyzing the player's performance. Please try again.";
    }
  }

  /**
   * Generate contextual basketball responses
   */
  private generateBasketballResponse(context: TeamStatsContext, question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    // Team performance analysis
    if (lowerQuestion.includes('team') && lowerQuestion.includes('performance')) {
      return this.getTeamPerformanceAnalysis(context);
    }
    
    // Scoring analysis
    if (lowerQuestion.includes('scoring') || lowerQuestion.includes('points')) {
      return this.getScoringAnalysis(context);
    }
    
    // Defense analysis
    if (lowerQuestion.includes('defense') || lowerQuestion.includes('defensive')) {
      return this.getDefenseAnalysis(context);
    }
    
    // Player recommendations
    if (lowerQuestion.includes('improve') || lowerQuestion.includes('recommendation')) {
      return this.getImprovementRecommendations(context);
    }
    
    // Top performers
    if (lowerQuestion.includes('best') || lowerQuestion.includes('top')) {
      return this.getTopPerformers(context);
    }

    // Areas for improvement
    if (lowerQuestion.includes('weak') || lowerQuestion.includes('problem')) {
      return this.getAreasForImprovement(context);
    }

    // Game strategy
    if (lowerQuestion.includes('strategy') || lowerQuestion.includes('tactics')) {
      return this.getStrategyRecommendations(context);
    }
    
    // General team overview
    return this.getGeneralTeamOverview(context);
  }

  private generatePlayerResponse(context: { player: any; gameStats: any[] }, question: string): string {
    const { player, gameStats } = context;
    const lowerQuestion = question.toLowerCase();
    
    if (gameStats.length === 0) {
      return `${player.name} hasn't played any games yet this season. Once they start playing, I'll be able to provide detailed performance analysis.`;
    }

    const totalGames = gameStats.length;
    const avgPoints = gameStats.reduce((sum, stat) => sum + (stat.points || 0), 0) / totalGames;
    const avgAssists = gameStats.reduce((sum, stat) => sum + (stat.assists || 0), 0) / totalGames;
    const avgRebounds = gameStats.reduce((sum, stat) => sum + ((stat.offRebounds || 0) + (stat.defRebounds || 0)), 0) / totalGames;
    
    if (lowerQuestion.includes('strength') || lowerQuestion.includes('best')) {
      return `${player.name}'s greatest strengths this season:\n\n• **Scoring**: Averaging ${avgPoints.toFixed(1)} points per game\n• **Playmaking**: Contributing ${avgAssists.toFixed(1)} assists per game\n• **Rebounding**: Securing ${avgRebounds.toFixed(1)} rebounds per game\n\nBased on their statistics, ${player.name} shows consistency across multiple areas, which is valuable for team chemistry.`;
    }
    
    if (lowerQuestion.includes('improve') || lowerQuestion.includes('work on')) {
      const fgPercentage = gameStats.reduce((sum, stat) => sum + (stat.fgMade || 0), 0) / 
                          Math.max(1, gameStats.reduce((sum, stat) => sum + (stat.fgAttempts || 0), 0));
      
      return `Areas where ${player.name} can improve:\n\n• **Shot Selection**: Current field goal percentage is ${(fgPercentage * 100).toFixed(1)}%\n• **Consistency**: Focus on maintaining performance across all games\n• **Fundamentals**: Continue working on basic skills during practice\n\nRecommendation: Set up individual skill sessions focusing on shooting form and decision-making.`;
    }
    
    return `${player.name} Performance Summary:\n\n📊 **Season Stats (${totalGames} games)**\n• Points: ${avgPoints.toFixed(1)} per game\n• Assists: ${avgAssists.toFixed(1)} per game\n• Rebounds: ${avgRebounds.toFixed(1)} per game\n• Position: ${player.position || 'Not assigned'}\n\n${player.name} is developing well this season. Keep encouraging consistent effort and fundamentals work.`;
  }

  private getTeamPerformanceAnalysis(context: TeamStatsContext): string {
    const { players, totalGames, averageTeamScore, teamName } = context;
    
    return `📊 **${teamName} Team Performance Analysis**

**Overall Assessment:**
Your team has played ${totalGames} games this season, averaging ${averageTeamScore.toFixed(1)} points per game. With ${players.length} active players, you have good depth for rotations.

**Key Observations:**
• **Team Chemistry**: Regular playing time distribution helps build team cohesion
• **Scoring Balance**: Monitor if scoring is coming from multiple players or just a few
• **Development Focus**: Ensure each player is getting opportunities to improve

**Coaching Recommendations:**
• Continue tracking individual player progress
• Use video clips to highlight both successes and areas for improvement
• Maintain balanced playing time to develop all players`;
  }

  private getScoringAnalysis(context: TeamStatsContext): string {
    const topScorers = context.players
      .filter(p => p.careerPoints > 0)
      .sort((a, b) => (b.careerPoints || 0) - (a.careerPoints || 0))
      .slice(0, 3);

    if (topScorers.length === 0) {
      return "🏀 **Scoring Analysis**\n\nNo scoring data available yet. Once games are played, I can provide detailed scoring breakdowns and recommendations for offensive strategies.";
    }

    return `🏀 **Scoring Analysis**

**Top Scorers:**
${topScorers.map((player, index) => 
  `${index + 1}. ${player.name}: ${player.careerPoints} points (${(player.careerPoints / Math.max(1, player.totalGamesPlayed)).toFixed(1)} avg)`
).join('\n')}

**Offensive Recommendations:**
• Work on ball movement to create better shot opportunities
• Practice shooting drills to improve field goal percentage
• Develop multiple scoring options to avoid predictability
• Focus on high-percentage shots near the basket`;
  }

  private getDefenseAnalysis(_context: TeamStatsContext): string {
    return `🛡️ **Defensive Analysis**

**Defensive Metrics to Track:**
• Steals per game (currently tracking individual steals)
• Blocks per game (defensive presence in the paint)
• Rebounds (both offensive and defensive)
• Team fouls (fouling discipline)

**Defensive Recommendations:**
• Emphasize communication on defensive switches
• Practice help defense rotations
• Work on defensive stance and footwork
• Focus on defensive rebounding to limit second-chance points

**Key Focus Areas:**
• Individual defensive fundamentals
• Team defensive concepts
• Transition defense
• Shot contest techniques`;
  }

  private getImprovementRecommendations(_context: TeamStatsContext): string {
    return `📈 **Improvement Recommendations**

**Individual Player Development:**
• Create personalized skill development plans for each player
• Use video clips to show specific technique improvements needed
• Set measurable goals for each player (points, assists, rebounds)

**Team Development:**
• Focus on fundamental skills during practice
• Implement game situation drills
• Work on team chemistry and communication
• Practice both offensive and defensive systems

**Data-Driven Approach:**
• Track progress through game statistics
• Use video analysis to identify patterns
• Set team and individual benchmarks
• Celebrate improvements to maintain motivation`;
  }

  private getTopPerformers(context: TeamStatsContext): string {
    const activeScorers = context.players.filter(p => (p.careerPoints || 0) > 0);
    
    if (activeScorers.length === 0) {
      return "🌟 **Top Performers**\n\nOnce you have game data, I'll be able to identify your top performers in various categories like scoring, assists, rebounds, and overall impact.";
    }

    const topScorer = activeScorers.reduce((top, player) => 
      (player.careerPoints || 0) > (top.careerPoints || 0) ? player : top
    );

    const topAssister = context.players.reduce((top, player) => 
      (player.careerAssists || 0) > (top.careerAssists || 0) ? player : top
    );

    return `🌟 **Top Performers**

**Leading Scorer:** ${topScorer.name} - ${topScorer.careerPoints} points
**Top Playmaker:** ${topAssister.name} - ${topAssister.careerAssists} assists

**Recognition Tips:**
• Acknowledge top performers publicly to boost confidence
• Use their success as examples for other players
• Give them leadership opportunities during practice
• Continue challenging them to improve further`;
  }

  private getAreasForImprovement(_context: TeamStatsContext): string {
    return `⚠️ **Areas for Improvement**

**Common Development Areas:**
• **Shooting Consistency**: Work on shooting form and follow-through
• **Decision Making**: Reduce turnovers through better ball handling
• **Defensive Positioning**: Improve help defense and rotations
• **Free Throw Shooting**: Practice free throws to improve easy scoring

**Team Concepts:**
• **Ball Movement**: Encourage passing to create better shots
• **Rebounding**: Box out fundamentals and second-effort plays
• **Communication**: Verbal and non-verbal communication on court
• **Conditioning**: Maintain energy throughout entire games

**Practice Recommendations:**
• Dedicate time to fundamental drills
• Use small-sided games to improve decision making
• Practice game situations repeatedly
• Film and review practice sessions`;
  }

  private getStrategyRecommendations(_context: TeamStatsContext): string {
    return `🎯 **Strategy Recommendations**

**Offensive Strategy:**
• **Motion Offense**: Teach players to read and react to defensive movements
• **Pick and Roll**: Simple yet effective play for creating scoring opportunities
• **Fast Break**: Capitalize on defensive rebounds with quick transitions
• **Inside-Out Game**: Establish inside presence then kick out for outside shots

**Defensive Strategy:**
• **Man-to-Man Defense**: Focus on individual defensive responsibility
• **Help Defense**: Teach proper help and recover techniques
• **Defensive Rebounding**: Emphasize boxing out and securing rebounds
• **Pressure Defense**: Apply pressure to disrupt opponent's rhythm

**Game Management:**
• Use timeouts strategically to stop opponent momentum
• Make substitutions to keep players fresh and engaged
• Adjust strategies based on opponent's strengths and weaknesses
• Emphasize execution in critical game moments`;
  }

  private getGeneralTeamOverview(context: TeamStatsContext): string {
    const { teamName, players, totalGames } = context;
    
    return `🏀 **${teamName} Team Overview**

**Current Status:**
• **Roster Size**: ${players.length} players
• **Games Played**: ${totalGames}
• **Active Development**: All players gaining valuable experience

**Coaching Focus:**
• Individual skill development for each player
• Team chemistry and communication
• Fundamental basketball concepts
• Positive learning environment

**Next Steps:**
• Continue tracking player progress through statistics
• Use video analysis to identify teaching moments
• Set realistic goals for team and individual improvement
• Maintain focus on player development over wins/losses

Feel free to ask me about specific players, game situations, or areas you'd like to focus on!`;
  }

  /**
   * Generate game insights from recent performance
   */
  async generateGameInsights(gameId: string): Promise<string> {
    try {
      const game = await client.models.Game.get({ id: gameId });
      const gameStats = await client.models.GameStat.list({
        filter: { gameId: { eq: gameId } }
      });

      if (!game.data || !gameStats.data) {
        return "Game data not found. Please check the game ID and try again.";
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const insights = this.analyzeGamePerformance(game.data, gameStats.data);
      return insights;
    } catch (error) {
      console.error('Error generating game insights:', error);
      return "Unable to generate game insights at this time. Please try again later.";
    }
  }

  private analyzeGamePerformance(game: any, gameStats: any[]): string {
    const totalTeamPoints = gameStats.reduce((sum, stat) => sum + (stat.points || 0), 0);
    const totalTeamAssists = gameStats.reduce((sum, stat) => sum + (stat.assists || 0), 0);
    const totalTeamRebounds = gameStats.reduce((sum, stat) => sum + ((stat.offRebounds || 0) + (stat.defRebounds || 0)), 0);
    const totalTeamTurnovers = gameStats.reduce((sum, stat) => sum + (stat.turnovers || 0), 0);

    const gameResult = game.homeTeamScore > game.awayTeamScore ? 'Won' : 'Lost';
    const finalScore = `${game.homeTeamScore}-${game.awayTeamScore}`;

    return `📊 **Game Analysis: ${game.homeTeamName} vs ${game.awayTeamName}**

**Final Score:** ${finalScore} (${gameResult})

**Team Performance:**
• **Total Points**: ${totalTeamPoints} (compared to ${game.homeTeamScore} official score)
• **Assists**: ${totalTeamAssists} (good ball movement indicator)
• **Rebounds**: ${totalTeamRebounds} (effort and positioning)
• **Turnovers**: ${totalTeamTurnovers} (ball security)

**Key Observations:**
${gameResult === 'Won' ? 
  '• Great team effort resulted in a victory!\n• Continue building on what worked well\n• Identify key plays that led to success' :
  '• Learning opportunity from this game\n• Focus on areas that need improvement\n• Use this as motivation for next game'
}

**Coaching Points:**
• Review video clips from this game for teaching moments
• Highlight both positive plays and areas for improvement
• Use individual player stats to provide personalized feedback
• Prepare specific practice drills based on observed needs`;
  }
}