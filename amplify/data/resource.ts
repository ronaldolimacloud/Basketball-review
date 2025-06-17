import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== BASKETBALL MANAGEMENT SCHEMA =======================================
This schema defines the basketball management system with persistent players,
games, and statistics tracking.

AUTHORIZATION APPROACH:
- Coaches have full CRUD access to all their data
- Players have read access to data, with application-level filtering
- Team invitations are readable by all authenticated users
- Fine-grained access control is handled in the application layer
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
      userId: a.string(), // Cognito user ID if player has account
      // Protect owner field from reassignment
      owner: a.string().authorization((allow) => [
        allow.owner().to(['read'])
      ]),
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
      allow.owner(),  // Coach who created the player profile
      allow.groups(['Coach']).to(['read', 'create', 'update', 'delete']),
    ]),

  // Team Management
  Team: a
    .model({
      name: a.string().required(),
      description: a.string(),
      isActive: a.boolean().default(true),
      inviteCode: a.string(), // Unique code for players to join
      inviteCodeExpiry: a.datetime(),
      coachId: a.string().required(), // Owner/coach user ID
      // Protect owner field from reassignment
      owner: a.string().authorization((allow) => [
        allow.owner().to(['read'])
      ]),
      
      // Relationships
      teamPlayers: a.hasMany('TeamPlayer', 'teamId'),
      homeGames: a.hasMany('Game', 'homeTeamId'),
      teamInvitations: a.hasMany('TeamInvitation', 'teamId'),
    })
    .authorization((allow) => [
      allow.owner(),  // Coach who created the team
      allow.groups(['Player']).to(['read']),
    ]),

  // Team Invitation System
  TeamInvitation: a
    .model({
      teamId: a.id().required(),
      inviteCode: a.string().required(),
      playerEmail: a.string(),
      playerName: a.string(),
      status: a.enum(['pending', 'accepted', 'declined', 'expired']),
      expiresAt: a.datetime(),
      invitedById: a.string().required(), // Coach who sent the invitation
      
      // Relationships
      team: a.belongsTo('Team', 'teamId'),
    })
    .authorization((allow) => [
      allow.groups(['Coach']).to(['read', 'create', 'update', 'delete']),
      allow.authenticated().to(['read']),
    ]),

  // Team-Player Association (many-to-many)
  TeamPlayer: a
    .model({
      teamId: a.id().required(),
      playerId: a.id().required(),
      isActive: a.boolean().default(true),
      dateJoined: a.datetime(),
      role: a.enum(['player', 'captain', 'assistant']),
      
      // Relationships
      team: a.belongsTo('Team', 'teamId'),
      player: a.belongsTo('Player', 'playerId'),
    })
    .authorization((allow) => [
      allow.groups(['Coach']).to(['read', 'create', 'update', 'delete']),
      allow.groups(['Player']).to(['read']),
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
      gameStats: a.hasMany('GameStat', 'gameId'),
    })
    .authorization((allow) => [
      allow.groups(['Coach']).to(['read', 'create', 'update', 'delete']),
      allow.groups(['Player']).to(['read']),
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
      allow.groups(['Coach']).to(['read', 'create', 'update', 'delete']),
      allow.groups(['Player']).to(['read']),
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
