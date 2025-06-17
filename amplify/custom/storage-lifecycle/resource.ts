import * as s3 from 'aws-cdk-lib/aws-s3';
import { Duration } from 'aws-cdk-lib';

export function configureS3LifecyclePolicies(bucket: s3.Bucket) {
  // Add lifecycle rules for cost optimization
  bucket.addLifecycleRule({
    id: 'GameVideoLifecycle',
    prefix: 'protected/game-videos/',
    enabled: true,
    transitions: [
      {
        storageClass: s3.StorageClass.INFREQUENT_ACCESS,
        transitionAfter: Duration.days(30) // Move to IA after 30 days
      },
      {
        storageClass: s3.StorageClass.GLACIER,
        transitionAfter: Duration.days(365) // Archive after 1 year
      },
      {
        storageClass: s3.StorageClass.DEEP_ARCHIVE,
        transitionAfter: Duration.days(1095) // Deep archive after 3 years
      }
    ]
  });

  bucket.addLifecycleRule({
    id: 'ProcessedVideoLifecycle',
    prefix: 'protected/processed-videos/',
    enabled: true,
    transitions: [
      {
        storageClass: s3.StorageClass.INFREQUENT_ACCESS,
        transitionAfter: Duration.days(90) // Keep processed videos accessible longer
      },
      {
        storageClass: s3.StorageClass.GLACIER,
        transitionAfter: Duration.days(365)
      }
    ]
  });

  bucket.addLifecycleRule({
    id: 'ThumbnailLifecycle',
    prefix: 'protected/video-thumbnails/',
    enabled: true,
    transitions: [
      {
        storageClass: s3.StorageClass.INFREQUENT_ACCESS,
        transitionAfter: Duration.days(30)
      },
      {
        storageClass: s3.StorageClass.GLACIER,
        transitionAfter: Duration.days(180) // Shorter archive time for thumbnails
      }
    ]
  });

  bucket.addLifecycleRule({
    id: 'VideoClipLifecycle',
    prefix: 'protected/video-clips/',
    enabled: true,
    transitions: [
      {
        storageClass: s3.StorageClass.INFREQUENT_ACCESS,
        transitionAfter: Duration.days(60) // Keep clips accessible longer for frequent review
      },
      {
        storageClass: s3.StorageClass.GLACIER,
        transitionAfter: Duration.days(365)
      }
    ]
  });

  // Clean up incomplete multipart uploads after 7 days
  bucket.addLifecycleRule({
    id: 'CleanupIncompleteUploads',
    enabled: true,
    abortIncompleteMultipartUploadAfter: Duration.days(7)
  });

  // Clean up temporary upload files
  bucket.addLifecycleRule({
    id: 'TempFileCleanup',
    prefix: 'temp/',
    enabled: true,
    expiration: Duration.days(1) // Delete temp files after 1 day
  });
}