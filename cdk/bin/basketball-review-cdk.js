#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = require("aws-cdk-lib");
const basketball_review_stack_1 = require("../lib/basketball-review-stack");
const app = new cdk.App();
new basketball_review_stack_1.BasketballReviewStack(app, 'BasketballReviewStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});
