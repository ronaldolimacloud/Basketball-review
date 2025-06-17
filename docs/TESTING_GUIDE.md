# Video Processing Pipeline - Testing Guide

## Overview
This guide provides comprehensive testing procedures for the video processing pipeline, including unit tests, integration tests, and end-to-end verification.

## 🧪 Test Structure

### Test Files
```
tests/
├── video-processing.test.js     # End-to-end integration tests
├── video-ui.test.tsx           # UI component tests
└── __mocks__/                  # Mock configurations

scripts/
└── test-lambda-functions.js    # Lambda function testing script
```

## 🚀 Quick Start

### Prerequisites
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev jest @types/jest

# Ensure AWS CLI is configured
aws configure list

# Set environment variables
export AWS_REGION=us-east-1
export AMPLIFY_ENV=dev
```

### Run All Tests
```bash
# Run UI component tests
npm test

# Run integration tests
npm run test:integration

# Run Lambda function tests
npm run test:lambda

# Run complete test suite
npm run test:all
```

## 📋 Test Categories

### 1. Unit Tests (UI Components)

**File**: `tests/video-ui.test.tsx`

Tests individual React components:
- VideoPlayer quality selector functionality
- VideoUploadManager drag & drop behavior
- ThumbnailPreview interaction handling
- Error state management
- Loading state management

**Run**: `npm test video-ui`

### 2. Integration Tests (End-to-End)

**File**: `tests/video-processing.test.js`

Tests complete pipeline:
- Video upload to S3
- Lambda trigger activation
- MediaConvert job creation
- Processing status updates
- CloudFront URL accessibility
- Video service API functions

**Run**: `npm test video-processing`

### 3. Lambda Function Tests

**File**: `scripts/test-lambda-functions.js`

Tests AWS infrastructure:
- Lambda function compilation
- S3 event trigger configuration
- MediaConvert service setup
- EventBridge rule configuration
- IAM permissions verification

**Run**: `node scripts/test-lambda-functions.js`

## 🎬 Video Processing Pipeline Tests

### Test Workflow
1. **Upload Test Video** → S3 bucket with game-videos prefix
2. **Verify S3 Trigger** → Lambda function receives S3 event
3. **Check MediaConvert Job** → Job created with correct settings
4. **Monitor Processing** → Status updates via EventBridge
5. **Validate Outputs** → Multiple quality videos generated
6. **Test Delivery** → CloudFront URLs accessible

### Expected Results
- ✅ Video uploaded successfully to S3
- ✅ Processing status changes: PENDING → PROCESSING → COMPLETED
- ✅ Multiple video qualities generated (720p, 1080p)
- ✅ Thumbnails created at regular intervals
- ✅ CloudFront URLs return video content
- ✅ DynamoDB record updated with processed URLs

## 🔧 Lambda Function Testing

### Local Testing
```bash
# Test video processor function
cd amplify/functions/video-processor
npm run build
npm run test

# Test completion handler function
cd amplify/functions/video-completion-handler
npm run build
npm run test
```

### AWS Integration Testing
```bash
# Run comprehensive AWS integration tests
node scripts/test-lambda-functions.js

# Test specific components
node scripts/test-lambda-functions.js --component s3
node scripts/test-lambda-functions.js --component mediaconvert
node scripts/test-lambda-functions.js --component eventbridge
```

## 📊 Test Data and Mocks

### Mock Video File Generation
```javascript
// Creates a test video file for upload testing
const createMockVideoFile = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  // ... generates test pattern
  return canvas.toBlob(resolve, 'video/mp4');
};
```

### Mock S3 Event
```javascript
const mockS3Event = {
  Records: [{
    eventVersion: '2.1',
    eventSource: 'aws:s3',
    eventName: 'ObjectCreated:Put',
    s3: {
      bucket: { name: 'amplify-basketballreview-dev-storage' },
      object: { 
        key: 'protected/game-videos/test-game-123/sample.mp4',
        size: 1024000
      }
    }
  }]
};
```

### Mock MediaConvert Event
```javascript
const mockMediaConvertEvent = {
  Records: [{
    eventSource: 'aws:events',
    source: 'aws.mediaconvert',
    detail: {
      status: 'COMPLETE',
      jobId: 'test-job-123',
      userMetadata: { gameId: 'test-game-123' }
    }
  }]
};
```

## 🐛 Debugging Tests

### Common Issues

**1. AWS Permissions**
```bash
# Check current AWS credentials
aws sts get-caller-identity

# Verify MediaConvert access
aws mediaconvert describe-endpoints --region us-east-1
```

**2. S3 Bucket Access**
```bash
# List S3 buckets
aws s3 ls

# Check bucket notifications
aws s3api get-bucket-notification-configuration --bucket your-bucket-name
```

**3. Lambda Function Logs**
```bash
# View recent logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/

# Stream logs in real-time
aws logs tail /aws/lambda/your-function-name --follow
```

### Test Environment Variables
```bash
# Required for testing
export AWS_REGION=us-east-1
export AMPLIFY_ENV=dev
export TEST_GAME_ID=test-game-123
export TEST_TIMEOUT=600000  # 10 minutes for MediaConvert
```

## 📈 Performance Testing

### Load Testing Video Uploads
```javascript
// Test concurrent uploads
const concurrentUploads = Array.from({ length: 5 }, (_, i) => 
  uploadGameVideo(`test-game-${i}`, mockVideoFile)
);

await Promise.all(concurrentUploads);
```

### MediaConvert Capacity Testing
```bash
# Check current MediaConvert job limits
aws mediaconvert describe-endpoints
aws service-quotas get-service-quota --service-code mediaconvert --quota-code L-1B-1B9
```

## 📋 Test Checklist

### Pre-deployment Checklist
- [ ] All unit tests pass (`npm test`)
- [ ] Integration tests complete successfully
- [ ] Lambda functions compile without errors
- [ ] S3 event notifications configured correctly
- [ ] MediaConvert endpoints accessible
- [ ] EventBridge rules active
- [ ] CloudFront distribution operational
- [ ] IAM permissions validated

### Post-deployment Verification
- [ ] Upload test video through UI
- [ ] Verify processing status updates
- [ ] Check multiple quality outputs generated
- [ ] Validate thumbnail creation
- [ ] Test CloudFront URL accessibility
- [ ] Confirm cost optimization policies active

## 🔄 Continuous Testing

### GitHub Actions Integration
```yaml
# .github/workflows/video-tests.yml
name: Video Processing Tests
on: [push, pull_request]
jobs:
  test-video-pipeline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:video
      - run: npm run test:lambda
```

### Local Development Testing
```bash
# Watch mode for continuous testing
npm run test:watch

# Test specific components during development
npm test -- --grep "VideoPlayer"
npm test -- --grep "upload"
```

## 📞 Support and Troubleshooting

### Getting Help
- Check CloudWatch logs for Lambda functions
- Review S3 access logs for upload issues
- Monitor MediaConvert job status in AWS Console
- Use AWS X-Ray for tracing request flows

### Common Test Failures
1. **Timeout errors**: Increase test timeout for MediaConvert jobs
2. **Permission errors**: Verify AWS credentials and IAM roles
3. **Network errors**: Check internet connectivity and AWS service status
4. **Resource limits**: Monitor AWS service quotas and limits

---

**Test Coverage Goal**: 90%+ for video processing components
**Test Execution Time**: ~15 minutes for full suite
**Required AWS Services**: S3, Lambda, MediaConvert, EventBridge, CloudFront