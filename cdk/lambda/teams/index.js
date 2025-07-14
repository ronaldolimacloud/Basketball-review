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
          // Get single team
          const result = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: {
              PK: `ORG#${orgId}#TEAM#${pathParameters.id}`,
              SK: `TEAM#${pathParameters.id}`
            }
          }).promise();
          
          if (!result.Item) {
            return createErrorResponse(404, 'Team not found');
          }
          
          return createSuccessResponse(result.Item.Data);
        } else {
          // Get all teams for organization
          const result = await dynamodb.query({
            TableName: TABLE_NAME,
            IndexName: 'OrgTypeIndex',
            KeyConditionExpression: 'OrgId = :orgId AND #type = :type',
            ExpressionAttributeNames: {
              '#type': 'Type'
            },
            ExpressionAttributeValues: {
              ':orgId': orgId,
              ':type': 'TEAM'
            }
          }).promise();
          
          const teams = result.Items
            .filter(item => item.Data && item.Data.isActive !== false)
            .map(item => item.Data);
            
          return createSuccessResponse(teams);
        }

      case 'POST':
        // Create new team
        const teamData = JSON.parse(body);
        const teamId = uuidv4();
        const now = new Date().toISOString();
        
        const newTeam = {
          id: teamId,
          orgId: orgId,
          name: teamData.name,
          description: teamData.description || null,
          logoUrl: teamData.logoUrl || null,
          isActive: true,
          players: [], // Array of player IDs
          createdAt: now,
          updatedAt: now
        };

        await dynamodb.put({
          TableName: TABLE_NAME,
          Item: {
            PK: `ORG#${orgId}#TEAM#${teamId}`,
            SK: `TEAM#${teamId}`,
            OrgId: orgId,
            Type: 'TEAM',
            Data: newTeam,
            CreatedAt: now
          }
        }).promise();

        return createSuccessResponse(newTeam, 201);

      case 'PUT':
        // Update team
        if (!pathParameters || !pathParameters.id) {
          return createErrorResponse(400, 'Team ID required');
        }

        const updateData = JSON.parse(body);
        const existingTeam = await dynamodb.get({
          TableName: TABLE_NAME,
          Key: {
            PK: `ORG#${orgId}#TEAM#${pathParameters.id}`,
            SK: `TEAM#${pathParameters.id}`
          }
        }).promise();

        if (!existingTeam.Item) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: { message: 'Team not found' } })
          };
        }

        const updatedTeam = {
          ...existingTeam.Item.Data,
          ...updateData,
          orgId: orgId, // Ensure orgId cannot be changed
          updatedAt: new Date().toISOString()
        };

        await dynamodb.put({
          TableName: TABLE_NAME,
          Item: {
            ...existingTeam.Item,
            Data: updatedTeam
          }
        }).promise();

        return createSuccessResponse(updatedTeam);

      case 'DELETE':
        // Soft delete team
        if (!pathParameters || !pathParameters.id) {
          return createErrorResponse(400, 'Team ID required');
        }

        const teamToDelete = await dynamodb.get({
          TableName: TABLE_NAME,
          Key: {
            PK: `ORG#${orgId}#TEAM#${pathParameters.id}`,
            SK: `TEAM#${pathParameters.id}`
          }
        }).promise();

        if (!teamToDelete.Item) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: { message: 'Team not found' } })
          };
        }

        await dynamodb.put({
          TableName: TABLE_NAME,
          Item: {
            ...teamToDelete.Item,
            Data: {
              ...teamToDelete.Item.Data,
              isActive: false,
              updatedAt: new Date().toISOString()
            }
          }
        }).promise();

        return createSuccessResponse({ message: 'Team deleted successfully' });

      default:
        return createErrorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}; 