import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { CfnOutput, Duration } from 'aws-cdk-lib';

export function createCloudFrontDistribution(backend: any) {
  const { storage } = backend;
  
  // Create CloudFront distribution for optimized video delivery
  const distribution = new cloudfront.Distribution(backend.storage.resources.bucket.stack, 'VideoDistribution', {
    defaultBehavior: {
      origin: origins.S3BucketOrigin.withOriginAccessIdentity(storage.resources.bucket, {
        originAccessIdentity: new cloudfront.OriginAccessIdentity(
          backend.storage.resources.bucket.stack,
          'VideoDistributionOAI'
        )
      }),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: new cloudfront.CachePolicy(backend.storage.resources.bucket.stack, 'VideoCachePolicy', {
        cachePolicyName: 'BasketballVideoCache',
        defaultTtl: Duration.hours(24),
        maxTtl: Duration.days(365),
        minTtl: Duration.seconds(0),
        headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Range'),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
        cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      }),
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      compress: true,
    },
    additionalBehaviors: {
      // Optimized caching for processed videos
      'protected/processed-videos/*': {
        origin: origins.S3BucketOrigin.withOriginAccessIdentity(storage.resources.bucket, {
          originAccessIdentity: new cloudfront.OriginAccessIdentity(
            backend.storage.resources.bucket.stack,
            'ProcessedVideoOAI'
          )
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: new cloudfront.CachePolicy(backend.storage.resources.bucket.stack, 'ProcessedVideoCachePolicy', {
          cachePolicyName: 'ProcessedVideoCache',
          defaultTtl: Duration.days(30),
          maxTtl: Duration.days(365),
          minTtl: Duration.hours(1),
          headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Range', 'Accept-Encoding'),
          queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
          cookieBehavior: cloudfront.CacheCookieBehavior.none(),
        }),
        compress: true,
      },
      // Optimized caching for thumbnails
      'protected/video-thumbnails/*': {
        origin: origins.S3BucketOrigin.withOriginAccessIdentity(storage.resources.bucket, {
          originAccessIdentity: new cloudfront.OriginAccessIdentity(
            backend.storage.resources.bucket.stack,
            'ThumbnailOAI'
          )
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: new cloudfront.CachePolicy(backend.storage.resources.bucket.stack, 'ThumbnailCachePolicy', {
          cachePolicyName: 'ThumbnailCache',
          defaultTtl: Duration.days(7),
          maxTtl: Duration.days(365),
          minTtl: Duration.hours(1),
          headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Accept-Encoding'),
          queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
          cookieBehavior: cloudfront.CacheCookieBehavior.none(),
        }),
        compress: true,
      }
    },
    priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe edge locations
    httpVersion: cloudfront.HttpVersion.HTTP2,
    enableIpv6: true,
    comment: 'Basketball Review App - Video CDN',
  });

  // Output the CloudFront distribution domain for use in the app
  new CfnOutput(backend.storage.resources.bucket.stack, 'VideoDistributionDomain', {
    value: distribution.distributionDomainName,
    description: 'CloudFront distribution domain for video delivery',
    exportName: 'BasketballReviewVideoDistributionDomain'
  });

  // Grant read permissions to CloudFront
  // Note: OriginAccessIdentity permissions are handled by the S3Origin construct

  return distribution;
}