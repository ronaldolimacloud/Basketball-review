import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== BASKETBALL MANAGEMENT SCHEMA =======================================
This schema defines the basketball management system with persistent players,
games, and statistics tracking.
=======================================================================*/
const schema = a.schema({
  // Player Profile - Persistent player data
  Player: a
    .model({
      name: a.string().required(),
      position: a.string(), // PG, SG, SF, PF, C
      height: a.string(),
      weight: a.string(),
      jerseyNumber: a.integer(),
      profileImageUrl: a.string(), // URL to profile picture
      isActive: a.boolean().default(true),
      totalGamesPlayed: a.integer().default(0),
      
      // Player portal access
      accessCode: a.string(), // Unique code for player to access their portal
      lastAccessDate: a.datetime(),
      
      // Player preferences
      preferredNotifications: a.json(), // Array of notification preferences
      personalNotes: a.string(), // Player's personal notes
      // Career totals
      careerPoints: a.integer().default(0),
      careerAssists: a.integer().default(0),
      careerRebounds: a.integer().default(0),
      careerSteals: a.integer().default(0),
      careerBlocks: a.integer().default(0),
      careerFouls: a.integer().default(0),
      careerTurnovers: a.integer().default(0),
      careerFgMade: a.integer().default(0),
      careerFgAttempts: a.integer().default(0),
      careerFtMade: a.integer().default(0),
      careerFtAttempts: a.integer().default(0),
      careerMinutesPlayed: a.integer().default(0),
      
      // Relationships
      gameStats: a.hasMany('GameStat', 'playerId'),
      teamPlayers: a.hasMany('TeamPlayer', 'playerId'),
    })
    .authorization((allow) => [
      allow.owner(),  // Only the user who created the player can access it
    ]),

  // Team Management
  Team: a
    .model({
      name: a.string().required(),
      description: a.string(),
      isActive: a.boolean().default(true),
      
      // Relationships
      teamPlayers: a.hasMany('TeamPlayer', 'teamId'),
      homeGames: a.hasMany('Game', 'homeTeamId'),
      awayGames: a.hasMany('Game', 'awayTeamId'),
    })
    .authorization((allow) => [
      allow.owner(),  // Only the user who created the team can access it
    ]),

  // Team-Player Association (many-to-many)
  TeamPlayer: a
    .model({
      teamId: a.id().required(),
      playerId: a.id().required(),
      isActive: a.boolean().default(true),
      dateJoined: a.datetime(),
      
      // Relationships
      team: a.belongsTo('Team', 'teamId'),
      player: a.belongsTo('Player', 'playerId'),
    })
    .authorization((allow) => [
      allow.owner(),  // Only the user who created the association can access it
    ]),

  // Game Session
  Game: a
    .model({
      homeTeamId: a.id().required(),
      awayTeamId: a.id(),
      homeTeamName: a.string().required(),
      awayTeamName: a.string().required(),
      gameFormat: a.enum(['quarters', 'halves']),
      gameDate: a.datetime(),
      
      // Final scores
      homeTeamScore: a.integer().default(0),
      awayTeamScore: a.integer().default(0),
      
      // Game metadata
      totalDuration: a.integer().default(0), // in seconds
      isCompleted: a.boolean().default(false),
      notes: a.string(),
      
      // Period scores (JSON array)
      periodScores: a.json(),
      
      // Video information
      videoFileName: a.string(),
      videoUrl: a.string(),
      
      // Relationships
      homeTeam: a.belongsTo('Team', 'homeTeamId'),
      awayTeam: a.belongsTo('Team', 'awayTeamId'),
      gameStats: a.hasMany('GameStat', 'gameId'),
    })
    .authorization((allow) => [
      allow.owner(),  // Only the user who created the game can access it
    ]),

  // Individual player stats for a specific game
  GameStat: a
    .model({
      gameId: a.id().required(),
      playerId: a.id().required(),
      
      // Game-specific stats
      points: a.integer().default(0),
      assists: a.integer().default(0),
      offRebounds: a.integer().default(0),
      defRebounds: a.integer().default(0),
      steals: a.integer().default(0),
      blocks: a.integer().default(0),
      fouls: a.integer().default(0),
      turnovers: a.integer().default(0),
      fgMade: a.integer().default(0),
      fgAttempts: a.integer().default(0),
      ftMade: a.integer().default(0),
      ftAttempts: a.integer().default(0),
      minutesPlayed: a.integer().default(0),
      plusMinus: a.integer().default(0),
      
      // Game context
      startedOnCourt: a.boolean().default(false),
      
      // Relationships
      game: a.belongsTo('Game', 'gameId'),
      player: a.belongsTo('Player', 'playerId'),
    })
    .authorization((allow) => [
      allow.owner(),  // Only the user who created the game stat can access it
    ]),

  // Video Clip Management
  VideoClip: a
    .model({
      gameId: a.id().required(),
      title: a.string().required(),
      description: a.string(),
      
      // Video timing
      startTime: a.float().required(), // Start time in seconds
      endTime: a.float().required(),   // End time in seconds
      
      // File information
      clipUrl: a.string(), // URL to the processed clip file
      thumbnailUrl: a.string(), // URL to thumbnail image
      
      // Organization and visibility
      visibility: a.enum(['team', 'player', 'coach']),
      assignedPlayerIds: a.json(), // Array of player IDs who can see this clip
      
      // Tagging and categorization
      tags: a.json(), // Array of tags like ["defense", "fast-break", "mistake"]
      playType: a.string(), // e.g., "offense", "defense", "transition"
      priority: a.enum(['high', 'medium', 'low']),
      
      // Coach feedback
      coachNotes: a.string(),
      learningObjective: a.string(),
      
      // Status
      isProcessed: a.boolean().default(false),
      
      // Relationships
      game: a.belongsTo('Game', 'gameId'),
      clipFeedbacks: a.hasMany('ClipFeedback', 'clipId'),
    })
    .authorization((allow) => [
      allow.owner(),  // Only the user who created the clip can access it
    ]),

  // Coach feedback on specific clips
  ClipFeedback: a
    .model({
      clipId: a.id().required(),
      playerId: a.id().required(),
      
      // Feedback content
      feedbackText: a.string().required(),
      feedbackType: a.enum(['praise', 'improvement', 'instruction', 'question']),
      timestamp: a.float(), // Specific timestamp in the clip for targeted feedback
      
      // Status tracking
      isRead: a.boolean().default(false),
      isAcknowledged: a.boolean().default(false),
      
      // Relationships
      clip: a.belongsTo('VideoClip', 'clipId'),
      player: a.belongsTo('Player', 'playerId'),
    })
    .authorization((allow) => [
      allow.owner(),  // Only the user who created the feedback can access it
    ]),

  // Player Goals and Progress Tracking
  PlayerGoal: a
    .model({
      playerId: a.id().required(),
      coachId: a.id(), // ID of the coach who set the goal
      
      // Goal details
      title: a.string().required(),
      description: a.string(),
      targetDate: a.datetime(),
      category: a.enum(['technical', 'physical', 'mental', 'tactical']),
      
      // Progress tracking
      status: a.enum(['active', 'completed', 'paused', 'cancelled']),
      progressNotes: a.json(), // Array of progress updates
      completionDate: a.datetime(),
      
      // Associated content
      relatedClipIds: a.json(), // Array of video clip IDs related to this goal
      
      // Relationships
      player: a.belongsTo('Player', 'playerId'),
    })
    .authorization((allow) => [
      allow.owner(),  // Only the user who created the goal can access it
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    // Keep apiKey for public data if needed, but not as default
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== USAGE EXAMPLES ===================================================
// Create a new player
const newPlayer = await client.models.Player.create({
  name: "John Doe",
  position: "PG",
  height: "6'2\"",
  jerseyNumber: 23
});

// Create a new game
const newGame = await client.models.Game.create({
  homeTeamName: "Lakers",
  awayTeamName: "Celtics",
  gameFormat: "quarters",
  gameDate: new Date().toISOString()
});

// Record player stats for a game
const playerStat = await client.models.GameStat.create({
  gameId: game.id,
  playerId: player.id,
  points: 25,
  assists: 8,
  rebounds: 6
});
====================================================================*/

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
