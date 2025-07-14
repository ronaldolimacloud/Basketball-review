const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { 
  extractOrgId, 
  validateOrgId, 
  createErrorResponse, 
  createSuccessResponse, 
  handleOptionsRequest 
} = require('../utils/common');

const awsConfig = {
  region: process.env.AWS_REGION || 'ap-southeast-2'
};

const dynamodb = new AWS.DynamoDB.DocumentClient(awsConfig);
const s3 = new AWS.S3(awsConfig);

const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;

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

      case 'POST':
        // Generate presigned URL for upload
        const uploadRequest = JSON.parse(body);
        const { fileName, fileType, uploadType = 'general' } = uploadRequest;
        
        if (!fileName || !fileType) {
          return createErrorResponse(400, 'fileName and fileType are required');
        }

        const fileId = uuidv4();
        const fileExtension = fileName.split('.').pop();
        const s3Key = `${orgId}/${uploadType}/${fileId}.${fileExtension}`;
        
        // Generate presigned URL for upload
        const presignedUrl = s3.getSignedUrl('putObject', {
          Bucket: BUCKET_NAME,
          Key: s3Key,
          ContentType: fileType,
          Expires: 300 // 5 minutes
        });

        // Store file metadata in DynamoDB
        const now = new Date().toISOString();
        const fileRecord = {
          id: fileId,
          orgId: orgId,
          fileName: fileName,
          fileType: fileType,
          uploadType: uploadType,
          s3Key: s3Key,
          url: `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`,
          status: 'pending',
          createdAt: now,
          updatedAt: now
        };

        await dynamodb.put({
          TableName: TABLE_NAME,
          Item: {
            PK: `ORG#${orgId}#UPLOAD#${fileId}`,
            SK: `UPLOAD#${fileId}`,
            OrgId: orgId,
            Type: 'UPLOAD',
            Data: fileRecord,
            CreatedAt: now
          }
        }).promise();

        return createSuccessResponse({
          uploadUrl: presignedUrl,
          fileId: fileId,
          s3Key: s3Key
        });

      case 'GET':
        if (pathParameters && pathParameters.id) {
          // Get single upload record
          const result = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: {
              PK: `ORG#${orgId}#UPLOAD#${pathParameters.id}`,
              SK: `UPLOAD#${pathParameters.id}`
            }
          }).promise();
          
          if (!result.Item) {
            return createErrorResponse(404, 'Upload not found');
          }
          
          return createSuccessResponse(result.Item.Data);
        } else {
          // Get all uploads for organization
          const result = await dynamodb.query({
            TableName: TABLE_NAME,
            IndexName: 'OrgTypeIndex',
            KeyConditionExpression: 'OrgId = :orgId AND #type = :type',
            ExpressionAttributeNames: {
              '#type': 'Type'
            },
            ExpressionAttributeValues: {
              ':orgId': orgId,
              ':type': 'UPLOAD'
            }
          }).promise();
          
          const uploads = result.Items.map(item => item.Data);
          
          return createSuccessResponse(uploads);
        }

      case 'PUT':
        // Update upload status
        if (!pathParameters || !pathParameters.id) {
          return createErrorResponse(400, 'Upload ID required');
        }

        const updateData = JSON.parse(body);
        const existingUpload = await dynamodb.get({
          TableName: TABLE_NAME,
          Key: {
            PK: `ORG#${orgId}#UPLOAD#${pathParameters.id}`,
            SK: `UPLOAD#${pathParameters.id}`
          }
        }).promise();

        if (!existingUpload.Item) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: { message: 'Upload not found' } })
          };
        }

        const updatedUpload = {
          ...existingUpload.Item.Data,
          ...updateData,
          orgId: orgId, // Ensure orgId cannot be changed
          updatedAt: new Date().toISOString()
        };

        await dynamodb.put({
          TableName: TABLE_NAME,
          Item: {
            ...existingUpload.Item,
            Data: updatedUpload
          }
        }).promise();

        return createSuccessResponse(updatedUpload);

      case 'DELETE':
        // Delete upload and S3 file
        if (!pathParameters || !pathParameters.id) {
          return createErrorResponse(400, 'Upload ID required');
        }

        const uploadToDelete = await dynamodb.get({
          TableName: TABLE_NAME,
          Key: {
            PK: `ORG#${orgId}#UPLOAD#${pathParameters.id}`,
            SK: `UPLOAD#${pathParameters.id}`
          }
        }).promise();

        if (!uploadToDelete.Item) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ success: false, error: { message: 'Upload not found' } })
          };
        }

        // Delete from S3
        try {
          await s3.deleteObject({
            Bucket: BUCKET_NAME,
            Key: uploadToDelete.Item.Data.s3Key
          }).promise();
        } catch (s3Error) {
          // Continue with DynamoDB deletion even if S3 deletion fails
        }

        // Delete from DynamoDB
        await dynamodb.delete({
          TableName: TABLE_NAME,
          Key: {
            PK: `ORG#${orgId}#UPLOAD#${pathParameters.id}`,
            SK: `UPLOAD#${pathParameters.id}`
          }
        }).promise();

        return createSuccessResponse({ message: 'Upload deleted successfully' });

      default:
        return createErrorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}; 