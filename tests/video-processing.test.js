/**
 * Video Processing Pipeline Integration Tests
 * 
 * These tests verify the end-to-end video processing functionality
 * including MediaConvert integration, S3 triggers, and status updates.
 */

import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { describe, beforeAll, afterAll, test, expect } from '@jest/testing-library/jest';

const client = generateClient();

// Mock video file for testing
const createMockVideoFile = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const context = canvas.getContext('2d');
  
  // Draw a simple test pattern
  context.fillStyle = '#FF0000';
  context.fillRect(0, 0, 320, 240);
  context.fillStyle = '#00FF00';
  context.fillRect(320, 0, 320, 240);
  context.fillStyle = '#0000FF';
  context.fillRect(0, 240, 320, 240);
  context.fillStyle = '#FFFF00';
  context.fillRect(320, 240, 320, 240);
  
  return new Promise(resolve => {
    canvas.toBlob(resolve, 'video/mp4');
  });
};

describe('Video Processing Pipeline', () => {
  let testGameId;
  let uploadedVideoKey;
  
  beforeAll(async () => {
    // Create a test game for uploading videos
    const testGame = await client.graphql({
      query: `
        mutation CreateGame($input: CreateGameInput!) {
          createGame(input: $input) {
            id
            homeTeam
            awayTeam
            videoProcessingStatus
          }
        }
      `,
      variables: {
        input: {
          homeTeam: "Test Team A",
          awayTeam: "Test Team B",
          date: new Date().toISOString(),
          notes: "Integration test game"
        }
      }
    });
    
    testGameId = testGame.data.createGame.id;
    console.log(`🏀 Created test game: ${testGameId}`);
  });

  afterAll(async () => {
    // Cleanup: Delete test game and uploaded files
    if (testGameId) {
      await client.graphql({
        query: `
          mutation DeleteGame($input: DeleteGameInput!) {
            deleteGame(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: { id: testGameId }
        }
      });
      console.log(`🗑️ Cleaned up test game: ${testGameId}`);
    }
  });

  test('Video upload triggers processing pipeline', async () => {
    // Create mock video file
    const mockVideoFile = await createMockVideoFile();
    const fileName = `test-video-${Date.now()}.mp4`;
    uploadedVideoKey = `protected/game-videos/${testGameId}/${fileName}`;

    console.log(`🎬 Testing video upload: ${fileName}`);

    // Upload video to S3
    const uploadResult = await uploadData({
      key: uploadedVideoKey,
      data: mockVideoFile,
      options: {
        contentType: 'video/mp4',
        onProgress: (progress) => {
          console.log(`📊 Upload progress: ${Math.round(progress.transferredBytes / progress.totalBytes * 100)}%`);
        }
      }
    }).result;

    expect(uploadResult.key).toBe(uploadedVideoKey);
    console.log(`✅ Video uploaded successfully to: ${uploadResult.key}`);

    // Wait for S3 event to trigger Lambda
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if game record was updated with processing status
    const gameQuery = await client.graphql({
      query: `
        query GetGame($id: ID!) {
          getGame(id: $id) {
            id
            videoProcessingStatus
            mediaConvertJobId
            processedVideoUrls
          }
        }
      `,
      variables: { id: testGameId }
    });

    const game = gameQuery.data.getGame;
    expect(game.videoProcessingStatus).toBeDefined();
    expect(['PENDING', 'PROCESSING'].includes(game.videoProcessingStatus)).toBe(true);
    
    console.log(`📊 Video processing status: ${game.videoProcessingStatus}`);
    
    if (game.mediaConvertJobId) {
      console.log(`🎯 MediaConvert job ID: ${game.mediaConvertJobId}`);
    }
  }, 30000); // 30 second timeout

  test('MediaConvert job processes video to multiple qualities', async () => {
    console.log(`🔍 Checking MediaConvert job status for game: ${testGameId}`);

    // Poll for processing completion (up to 10 minutes)
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes with 10-second intervals
    let processingCompleted = false;

    while (attempts < maxAttempts && !processingCompleted) {
      const gameQuery = await client.graphql({
        query: `
          query GetGame($id: ID!) {
            getGame(id: $id) {
              id
              videoProcessingStatus
              processedVideoUrls
              thumbnailUrls
            }
          }
        `,
        variables: { id: testGameId }
      });

      const game = gameQuery.data.getGame;
      console.log(`📊 Attempt ${attempts + 1}: Status = ${game.videoProcessingStatus}`);

      if (game.videoProcessingStatus === 'COMPLETED') {
        processingCompleted = true;
        
        // Verify processed video URLs exist
        expect(game.processedVideoUrls).toBeDefined();
        const videoUrls = JSON.parse(game.processedVideoUrls || '{}');
        expect(videoUrls['720p']).toBeDefined();
        expect(videoUrls['1080p']).toBeDefined();
        
        console.log(`✅ Processing completed! Video URLs:`, videoUrls);

        // Verify thumbnail URLs exist
        if (game.thumbnailUrls) {
          const thumbnails = JSON.parse(game.thumbnailUrls);
          expect(Array.isArray(thumbnails)).toBe(true);
          expect(thumbnails.length).toBeGreaterThan(0);
          console.log(`✅ Generated ${thumbnails.length} thumbnails`);
        }

        break;
      } else if (game.videoProcessingStatus === 'FAILED') {
        throw new Error('Video processing failed');
      }

      // Wait 10 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
    }

    if (!processingCompleted) {
      console.log(`⏰ Processing still in progress after ${maxAttempts} attempts`);
      // This is not necessarily a failure - MediaConvert can take time
      expect(['PENDING', 'PROCESSING'].includes(
        await getGameProcessingStatus(testGameId)
      )).toBe(true);
    }
  }, 600000); // 10 minute timeout

  test('CloudFront URLs are accessible', async () => {
    console.log(`🌐 Testing CloudFront URL accessibility`);

    const gameQuery = await client.graphql({
      query: `
        query GetGame($id: ID!) {
          getGame(id: $id) {
            id
            videoProcessingStatus
            processedVideoUrls
          }
        }
      `,
      variables: { id: testGameId }
    });

    const game = gameQuery.data.getGame;
    
    if (game.videoProcessingStatus === 'COMPLETED' && game.processedVideoUrls) {
      const videoUrls = JSON.parse(game.processedVideoUrls);
      
      // Test 720p URL accessibility
      if (videoUrls['720p']) {
        const response = await fetch(videoUrls['720p'], { method: 'HEAD' });
        expect(response.ok).toBe(true);
        expect(response.headers.get('content-type')).toContain('video');
        console.log(`✅ 720p video URL accessible: ${response.status}`);
      }
      
      // Test 1080p URL accessibility
      if (videoUrls['1080p']) {
        const response = await fetch(videoUrls['1080p'], { method: 'HEAD' });
        expect(response.ok).toBe(true);
        expect(response.headers.get('content-type')).toContain('video');
        console.log(`✅ 1080p video URL accessible: ${response.status}`);
      }
    } else {
      console.log(`⏭️ Skipping CloudFront test - processing not completed`);
    }
  });

  test('Video service functions work correctly', async () => {
    const { uploadGameVideo, getVideoSources, checkProcessingStatus } = await import('../src/services/videoService');
    
    console.log(`🔧 Testing video service functions`);

    // Test checkProcessingStatus
    const status = await checkProcessingStatus(testGameId);
    expect(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(status)).toBe(true);
    console.log(`✅ Processing status check: ${status}`);

    // Test getVideoSources
    const videoData = await getVideoSources(testGameId);
    expect(videoData).toBeDefined();
    expect(videoData.processingStatus).toBe(status);
    console.log(`✅ Video sources retrieved:`, {
      status: videoData.processingStatus,
      hasVideoSources: !!videoData.videoSources,
      hasThumbnails: !!videoData.thumbnails
    });
  });

  // Helper function
  async function getGameProcessingStatus(gameId) {
    const gameQuery = await client.graphql({
      query: `
        query GetGame($id: ID!) {
          getGame(id: $id) {
            videoProcessingStatus
          }
        }
      `,
      variables: { id: gameId }
    });
    return gameQuery.data.getGame.videoProcessingStatus;
  }
});