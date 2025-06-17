import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { videoProcessor } from './functions/video-processor/resource';
import { videoCompletionHandler } from './functions/video-completion-handler/resource';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import { createCloudFrontDistribution } from './custom/cloudfront/resource';
import { configureS3LifecyclePolicies } from './custom/storage-lifecycle/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  videoProcessor,
  videoCompletionHandler,
});

// Configure MediaConvert and video processing resources
const { videoProcessor: videoProcessorFunction, videoCompletionHandler: completionHandlerFunction } = backend;

// Add S3 trigger for video processing  
// Note: S3 suffix only supports single value, so we'll use the most common video format
// The Lambda function handler filters for all video types
backend.storage.resources.bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3Notifications.LambdaDestination(videoProcessorFunction.resources.lambda),
  {
    prefix: 'protected/game-videos/',
    suffix: '.mp4'
  }
);

// Add additional notifications for other video formats
backend.storage.resources.bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3Notifications.LambdaDestination(videoProcessorFunction.resources.lambda),
  {
    prefix: 'protected/game-videos/',
    suffix: '.mov'
  }
);

backend.storage.resources.bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3Notifications.LambdaDestination(videoProcessorFunction.resources.lambda),
  {
    prefix: 'protected/game-videos/',
    suffix: '.avi'
  }
);

backend.storage.resources.bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3Notifications.LambdaDestination(videoProcessorFunction.resources.lambda),
  {
    prefix: 'protected/game-videos/',
    suffix: '.mkv'
  }
);

// Grant permissions for MediaConvert and DynamoDB access
videoProcessorFunction.addEnvironment('STORAGE_BUCKET_NAME', backend.storage.resources.bucket.bucketName);
videoProcessorFunction.addEnvironment('GAME_TABLE_NAME', backend.data.resources.tables['Game'].tableName);
completionHandlerFunction.addEnvironment('GAME_TABLE_NAME', backend.data.resources.tables['Game'].tableName);

// Add IAM permissions for video processing
videoProcessorFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      'mediaconvert:*',
      'iam:PassRole',
      'dynamodb:UpdateItem',
      'dynamodb:GetItem',
      's3:GetObject',
      's3:PutObject',
      's3:DeleteObject'
    ],
    resources: [
      `arn:aws:mediaconvert:*:*:*`,
      `arn:aws:s3:::${backend.storage.resources.bucket.bucketName}/*`,
      backend.data.resources.tables['Game'].tableArn,
      'arn:aws:iam::*:role/MediaConvert_Default_Role'
    ]
  })
);

// Add IAM permissions for completion handler
completionHandlerFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      'dynamodb:UpdateItem',
      'dynamodb:GetItem',
      's3:ListBucket',
      's3:GetObject'
    ],
    resources: [
      backend.data.resources.tables['Game'].tableArn,
      `arn:aws:s3:::${backend.storage.resources.bucket.bucketName}`,
      `arn:aws:s3:::${backend.storage.resources.bucket.bucketName}/*`
    ]
  })
);

// Create EventBridge rule for MediaConvert job completion
const mediaConvertRule = new events.Rule(backend.videoCompletionHandler.resources.lambda.stack, 'MediaConvertJobCompletion', {
  eventPattern: {
    source: ['aws.mediaconvert'],
    detailType: ['MediaConvert Job State Change'],
    detail: {
      status: ['COMPLETE', 'ERROR']
    }
  }
});

// Add Lambda target to EventBridge rule
mediaConvertRule.addTarget(new targets.LambdaFunction(completionHandlerFunction.resources.lambda));

// Create CloudFront distribution for optimized video delivery
const distribution = createCloudFrontDistribution(backend);

// Configure S3 lifecycle policies for cost optimization
configureS3LifecyclePolicies(backend.storage.resources.bucket as s3.Bucket);
