#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BasketballReviewStack } from '../lib/basketball-review-stack';

const app = new cdk.App();
new BasketballReviewStack(app, 'BasketballReviewStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
}); 