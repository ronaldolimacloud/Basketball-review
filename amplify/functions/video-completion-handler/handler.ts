/// <reference types="node" />
import { EventBridgeEvent, EventBridgeHandler } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-2'
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2'
});

interface MediaConvertJobCompletionEvent {
  version: string;
  id: string;
  'detail-type': string;
  source: string;
  account: string;
  time: string;
  region: string;
  detail: {
    status: string;
    jobId: string;
    queue: string;
    userMetadata?: {
      GameId?: string;
    };
    outputGroupDetails?: Array<{
      outputDetails?: Array<{
        outputFilePaths?: string[];
      }>;
    }>;
  };
}

export const handler: EventBridgeHandler<
  'MediaConvert Job State Change',
  MediaConvertJobCompletionEvent['detail'],
  void
> = async (event) => {
  console.log('🎬 MediaConvert job completion event:', JSON.stringify(event, null, 2));

  const { detail } = event;
  const { status, jobId, userMetadata, outputGroupDetails } = detail;

  // Extract game ID from user metadata
  const gameId = userMetadata?.GameId;
  if (!gameId) {
    console.log('⚠️ No GameId found in job metadata, skipping update');
    return;
  }

  try {
    if (status === 'COMPLETE') {
      console.log(`✅ Job ${jobId} completed successfully for game ${gameId}`);
      
      // Extract output file paths
      const processedUrls = extractProcessedUrls(outputGroupDetails);
      const thumbnailUrls = extractThumbnailUrls(outputGroupDetails);

      await updateGameWithCompletedProcessing(gameId, processedUrls, thumbnailUrls);
      
    } else if (status === 'ERROR') {
      console.log(`❌ Job ${jobId} failed for game ${gameId}`);
      await updateGameProcessingStatus(gameId, 'FAILED');
      
    } else {
      console.log(`ℹ️ Job ${jobId} status: ${status}`);
    }
    
  } catch (error) {
    console.error('❌ Error handling MediaConvert completion:', error);
  }
};

function extractProcessedUrls(outputGroupDetails?: MediaConvertJobCompletionEvent['detail']['outputGroupDetails']): Record<string, string> {
  const urls: Record<string, string> = {};
  
  if (!outputGroupDetails) return urls;

  for (const group of outputGroupDetails) {
    if (group.outputDetails) {
      for (const output of group.outputDetails) {
        if (output.outputFilePaths) {
          for (const filePath of output.outputFilePaths) {
            // Convert S3 path to HTTPS URL
            const s3Url = filePath.replace('s3://', 'https://s3.amazonaws.com/');
            
            if (filePath.includes('_1080p')) {
              urls['1080p'] = s3Url;
            } else if (filePath.includes('_720p')) {
              urls['720p'] = s3Url;
            }
          }
        }
      }
    }
  }
  
  return urls;
}

function extractThumbnailUrls(outputGroupDetails?: MediaConvertJobCompletionEvent['detail']['outputGroupDetails']): string[] {
  const urls: string[] = [];
  
  if (!outputGroupDetails) return urls;

  for (const group of outputGroupDetails) {
    if (group.outputDetails) {
      for (const output of group.outputDetails) {
        if (output.outputFilePaths) {
          for (const filePath of output.outputFilePaths) {
            if (filePath.includes('/thumbnails/') && filePath.includes('_thumb')) {
              // Convert S3 path to HTTPS URL
              const s3Url = filePath.replace('s3://', 'https://s3.amazonaws.com/');
              urls.push(s3Url);
            }
          }
        }
      }
    }
  }
  
  return urls.sort(); // Sort to maintain consistent order
}

async function updateGameWithCompletedProcessing(
  gameId: string,
  processedUrls: Record<string, string>,
  thumbnailUrls: string[]
): Promise<void> {
  const updateParams = {
    TableName: process.env.GAME_TABLE_NAME!,
    Key: {
      id: { S: gameId }
    },
    UpdateExpression: 'SET videoProcessingStatus = :status, processedVideoUrls = :processedUrls, thumbnailUrls = :thumbnails, updatedAt = :timestamp',
    ExpressionAttributeValues: {
      ':status': { S: 'COMPLETED' },
      ':processedUrls': { S: JSON.stringify(processedUrls) },
      ':thumbnails': { S: JSON.stringify(thumbnailUrls) },
      ':timestamp': { S: new Date().toISOString() }
    }
  };

  await dynamoClient.send(new UpdateItemCommand(updateParams));
  console.log(`✅ Updated game ${gameId} with processed video URLs`);
}

async function updateGameProcessingStatus(
  gameId: string,
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
): Promise<void> {
  const updateParams = {
    TableName: process.env.GAME_TABLE_NAME!,
    Key: {
      id: { S: gameId }
    },
    UpdateExpression: 'SET videoProcessingStatus = :status, updatedAt = :timestamp',
    ExpressionAttributeValues: {
      ':status': { S: status },
      ':timestamp': { S: new Date().toISOString() }
    }
  };

  await dynamoClient.send(new UpdateItemCommand(updateParams));
  console.log(`✅ Updated game ${gameId} processing status to: ${status}`);
}