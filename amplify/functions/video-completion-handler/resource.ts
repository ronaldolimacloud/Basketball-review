import { defineFunction } from '@aws-amplify/backend';

export const videoCompletionHandler = defineFunction({
  name: 'video-completion-handler',
  entry: './handler.ts',
  environment: {
    GAME_TABLE_NAME: '' // Will be set by backend
  },
  runtime: 18,
  timeoutSeconds: 60,
  memoryMB: 256,
  resourceGroupName: 'storage' // Assign to storage stack since it handles video processing completion
});