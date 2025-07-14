const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { 
  extractOrgId, 
  validateOrgId, 
  createErrorResponse, 
  createSuccessResponse, 
  handleOptionsRequest 
} = require('../utils/common');

const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'ap-southeast-2'
});

const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const { httpMethod, pathParameters, body, headers } = event;
  
  // Extract organization ID from headers (for multi-tenant SAAS)
  const orgId = extractOrgId(headers);
  
  if (!validateOrgId(orgId)) {
    return createErrorResponse(400, 'Organization ID required');
  }

  try {
    switch (httpMethod) {
      case 'OPTIONS':
        return handleOptionsRequest();

      case 'GET':
        if (pathParameters && pathParameters.id) {
          // Get single game
          const result = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: {
              PK: `ORG#${orgId}#GAME#${pathParameters.id}`,
              SK: `GAME#${pathParameters.id}`
            }
          }).promise();
          
          if (!result.Item) {
            return createErrorResponse(404, 'Game not found');
          }
          
          return createSuccessResponse(result.Item.Data);
        } else {
          // Get all games for organization
          const result = await dynamodb.query({
            TableName: TABLE_NAME,
            IndexName: 'OrgTypeIndex',
            KeyConditionExpression: 'OrgId = :orgId AND #type = :type',
            ExpressionAttributeNames: {
              '#type': 'Type'
            },
            ExpressionAttributeValues: {
              ':orgId': orgId,
              ':type': 'GAME'
            }
          }).promise();
          
          const games = result.Items.map(item => item.Data);
          
          return createSuccessResponse(games);
        }

      case 'POST':
        // Create new game
        const gameData = JSON.parse(body);
        const gameId = uuidv4();
        const now = new Date().toISOString();
        
        const newGame = {
          id: gameId,
          orgId: orgId,
          homeTeamId: gameData.homeTeamId || null,
          homeTeamName: gameData.homeTeamName,
          awayTeamId: gameData.awayTeamId || null,
          awayTeamName: gameData.awayTeamName,
          gameFormat: gameData.gameFormat || 'quarters',
          gameDate: gameData.gameDate || now,
          homeTeamScore: 0,
          awayTeamScore: 0,
          totalDuration: 0,
          isCompleted: false,
          notes: gameData.notes || null,
          periodScores: [],
          playerStats: {},
          gameEvents: [],
          createdAt: now,
          updatedAt: now
        };

        await dynamodb.put({
          TableName: TABLE_NAME,
          Item: {
            PK: `ORG#${orgId}#GAME#${gameId}`,
            SK: `GAME#${gameId}`,
            OrgId: orgId,
            Type: 'GAME',
            Data: newGame,
            CreatedAt: now
          }
        }).promise();

        return createSuccessResponse(newGame, 201);

      case 'PUT':
        // Update game
        if (!pathParameters || !pathParameters.id) {
          return createErrorResponse(400, 'Game ID required');
        }

        const updateData = JSON.parse(body);
        const existingGame = await dynamodb.get({
          TableName: TABLE_NAME,
          Key: {
            PK: `ORG#${orgId}#GAME#${pathParameters.id}`,
            SK: `GAME#${pathParameters.id}`
          }
        }).promise();

        if (!existingGame.Item) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: { message: 'Game not found' } })
          };
        }

        const updatedGame = {
          ...existingGame.Item.Data,
          ...updateData,
          orgId: orgId, // Ensure orgId cannot be changed
          updatedAt: new Date().toISOString()
        };

        await dynamodb.put({
          TableName: TABLE_NAME,
          Item: {
            ...existingGame.Item,
            Data: updatedGame
          }
        }).promise();

        return createSuccessResponse(updatedGame);

      case 'DELETE':
        // Delete game
        if (!pathParameters || !pathParameters.id) {
          return createErrorResponse(400, 'Game ID required');
        }

        const gameToDelete = await dynamodb.get({
          TableName: TABLE_NAME,
          Key: {
            PK: `ORG#${orgId}#GAME#${pathParameters.id}`,
            SK: `GAME#${pathParameters.id}`
          }
        }).promise();

        if (!gameToDelete.Item) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: { message: 'Game not found' } })
          };
        }

        await dynamodb.delete({
          TableName: TABLE_NAME,
          Key: {
            PK: `ORG#${orgId}#GAME#${pathParameters.id}`,
            SK: `GAME#${pathParameters.id}`
          }
        }).promise();

        return createSuccessResponse({ message: 'Game deleted successfully' });

      default:
        return createErrorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}; 