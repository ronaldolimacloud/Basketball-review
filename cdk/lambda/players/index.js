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
          // Get single player
          const result = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: {
              PK: `ORG#${orgId}#PLAYER#${pathParameters.id}`,
              SK: `PLAYER#${pathParameters.id}`
            }
          }).promise();
          
          if (!result.Item) {
            return createErrorResponse(404, 'Player not found');
          }
          
          return createSuccessResponse(result.Item.Data);
        } else {
          // Get all players for organization
          const result = await dynamodb.query({
            TableName: TABLE_NAME,
            IndexName: 'OrgTypeIndex',
            KeyConditionExpression: 'OrgId = :orgId AND #type = :type',
            ExpressionAttributeNames: {
              '#type': 'Type'
            },
            ExpressionAttributeValues: {
              ':orgId': orgId,
              ':type': 'PLAYER'
            }
          }).promise();
          
          const players = result.Items
            .filter(item => item.Data && item.Data.isActive !== false)
            .map(item => item.Data);
            
          return createSuccessResponse(players);
        }

      case 'POST':
        // Create new player
        const playerData = JSON.parse(body);
        const playerId = uuidv4();
        const now = new Date().toISOString();
        
        const newPlayer = {
          id: playerId,
          orgId: orgId,
          name: playerData.name,
          position: playerData.position || null,
          height: playerData.height || null,
          weight: playerData.weight || null,
          jerseyNumber: playerData.jerseyNumber || null,
          profileImageUrl: null,
          isActive: true,
          totalGamesPlayed: 0,
          careerPoints: 0,
          careerAssists: 0,
          careerRebounds: 0,
          careerSteals: 0,
          careerBlocks: 0,
          careerFouls: 0,
          careerTurnovers: 0,
          careerFgMade: 0,
          careerFgAttempts: 0,
          careerFtMade: 0,
          careerFtAttempts: 0,
          careerMinutesPlayed: 0,
          createdAt: now,
          updatedAt: now
        };

        await dynamodb.put({
          TableName: TABLE_NAME,
          Item: {
            PK: `ORG#${orgId}#PLAYER#${playerId}`,
            SK: `PLAYER#${playerId}`,
            OrgId: orgId,
            Type: 'PLAYER',
            Data: newPlayer,
            CreatedAt: now
          }
        }).promise();

        return createSuccessResponse(newPlayer, 201);

      case 'PUT':
        // Update player
        if (!pathParameters || !pathParameters.id) {
          return createErrorResponse(400, 'Player ID required');
        }

        const updateData = JSON.parse(body);
        const existingPlayer = await dynamodb.get({
          TableName: TABLE_NAME,
          Key: {
            PK: `ORG#${orgId}#PLAYER#${pathParameters.id}`,
            SK: `PLAYER#${pathParameters.id}`
          }
        }).promise();

        if (!existingPlayer.Item) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: { message: 'Player not found' } })
          };
        }

        const updatedPlayer = {
          ...existingPlayer.Item.Data,
          ...updateData,
          orgId: orgId, // Ensure orgId cannot be changed
          updatedAt: new Date().toISOString()
        };

        await dynamodb.put({
          TableName: TABLE_NAME,
          Item: {
            ...existingPlayer.Item,
            Data: updatedPlayer
          }
        }).promise();

        return createSuccessResponse(updatedPlayer);

      case 'DELETE':
        // Soft delete player
        if (!pathParameters || !pathParameters.id) {
          return createErrorResponse(400, 'Player ID required');
        }

        const playerToDelete = await dynamodb.get({
          TableName: TABLE_NAME,
          Key: {
            PK: `ORG#${orgId}#PLAYER#${pathParameters.id}`,
            SK: `PLAYER#${pathParameters.id}`
          }
        }).promise();

        if (!playerToDelete.Item) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: { message: 'Player not found' } })
          };
        }

        await dynamodb.put({
          TableName: TABLE_NAME,
          Item: {
            ...playerToDelete.Item,
            Data: {
              ...playerToDelete.Item.Data,
              isActive: false,
              updatedAt: new Date().toISOString()
            }
          }
        }).promise();

        return createSuccessResponse({ message: 'Player deleted successfully' });

      default:
        return createErrorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}; 