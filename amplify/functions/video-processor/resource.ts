import { defineFunction } from '@aws-amplify/backend';

export const videoProcessor = defineFunction({
  name: 'video-processor',
  entry: './handler.ts',
  environment: {
    STORAGE_BUCKET_NAME: '', // Will be set by backend
    MEDIACONVERT_ROLE_ARN: '', // Will be set by backend  
    MEDIACONVERT_JOB_TEMPLATE_NAME: 'basketball-video-processing',
    GAME_TABLE_NAME: '' // Will be set by backend
  },
  runtime: 18,
  timeoutSeconds: 900, // 15 minutes for video processing
  memoryMB: 1024,
  resourceGroupName: 'storage' // Assign to storage stack since it's triggered by S3 events
});