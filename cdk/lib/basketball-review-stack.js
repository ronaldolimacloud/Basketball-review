"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasketballReviewStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const s3 = require("aws-cdk-lib/aws-s3");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const iam = require("aws-cdk-lib/aws-iam");
class BasketballReviewStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Single DynamoDB table for all basketball data (multi-tenant)
        const basketballTable = new dynamodb.Table(this, 'BasketballTable', {
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            tableName: 'BasketballReview',
            removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
        });
        // Add GSI for querying by organization and type
        basketballTable.addGlobalSecondaryIndex({
            indexName: 'OrgTypeIndex',
            partitionKey: { name: 'OrgId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'Type', type: dynamodb.AttributeType.STRING },
        });
        // S3 bucket for file uploads (images)
        const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
            bucketName: `basketball-review-uploads-${cdk.Aws.ACCOUNT_ID}`,
            cors: [
                {
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.PUT,
                    ],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                },
            ],
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // Shared Lambda role with DynamoDB and S3 permissions
        const lambdaRole = new iam.Role(this, 'LambdaRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
            inlinePolicies: {
                DynamoDBAccess: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'dynamodb:GetItem',
                                'dynamodb:PutItem',
                                'dynamodb:UpdateItem',
                                'dynamodb:DeleteItem',
                                'dynamodb:Query',
                                'dynamodb:Scan',
                            ],
                            resources: [
                                basketballTable.tableArn,
                                `${basketballTable.tableArn}/index/*`,
                            ],
                        }),
                    ],
                }),
                S3Access: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                's3:GetObject',
                                's3:PutObject',
                                's3:DeleteObject',
                            ],
                            resources: [`${uploadsBucket.bucketArn}/*`],
                        }),
                    ],
                }),
            },
        });
        // Lambda function for Players API
        const playersFunction = new lambda.Function(this, 'PlayersFunction', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lambda/players'),
            role: lambdaRole,
            environment: {
                TABLE_NAME: basketballTable.tableName,
                BUCKET_NAME: uploadsBucket.bucketName,
            },
        });
        // Lambda function for Teams API
        const teamsFunction = new lambda.Function(this, 'TeamsFunction', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lambda/teams'),
            role: lambdaRole,
            environment: {
                TABLE_NAME: basketballTable.tableName,
                BUCKET_NAME: uploadsBucket.bucketName,
            },
        });
        // Lambda function for Games API
        const gamesFunction = new lambda.Function(this, 'GamesFunction', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lambda/games'),
            role: lambdaRole,
            environment: {
                TABLE_NAME: basketballTable.tableName,
                BUCKET_NAME: uploadsBucket.bucketName,
            },
        });
        // Lambda function for Uploads API
        const uploadsFunction = new lambda.Function(this, 'UploadsFunction', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lambda/uploads'),
            role: lambdaRole,
            environment: {
                TABLE_NAME: basketballTable.tableName,
                BUCKET_NAME: uploadsBucket.bucketName,
            },
        });
        // API Gateway
        const api = new apigateway.RestApi(this, 'BasketballApi', {
            restApiName: 'Basketball Review API',
            description: 'Basketball Review SAAS Platform API',
            defaultCorsPreflightOptions: {
                allowOrigins: ['*'],
                allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowHeaders: ['Content-Type', 'Authorization', 'X-Org-Id'],
            },
        });
        // API routes
        const apiResource = api.root.addResource('api');
        // Players routes
        const playersResource = apiResource.addResource('players');
        playersResource.addMethod('GET', new apigateway.LambdaIntegration(playersFunction));
        playersResource.addMethod('POST', new apigateway.LambdaIntegration(playersFunction));
        const playerResource = playersResource.addResource('{id}');
        playerResource.addMethod('GET', new apigateway.LambdaIntegration(playersFunction));
        playerResource.addMethod('PUT', new apigateway.LambdaIntegration(playersFunction));
        playerResource.addMethod('DELETE', new apigateway.LambdaIntegration(playersFunction));
        // Teams routes
        const teamsResource = apiResource.addResource('teams');
        teamsResource.addMethod('GET', new apigateway.LambdaIntegration(teamsFunction));
        teamsResource.addMethod('POST', new apigateway.LambdaIntegration(teamsFunction));
        const teamResource = teamsResource.addResource('{id}');
        teamResource.addMethod('GET', new apigateway.LambdaIntegration(teamsFunction));
        teamResource.addMethod('PUT', new apigateway.LambdaIntegration(teamsFunction));
        teamResource.addMethod('DELETE', new apigateway.LambdaIntegration(teamsFunction));
        // Games routes
        const gamesResource = apiResource.addResource('games');
        gamesResource.addMethod('GET', new apigateway.LambdaIntegration(gamesFunction));
        gamesResource.addMethod('POST', new apigateway.LambdaIntegration(gamesFunction));
        const gameResource = gamesResource.addResource('{id}');
        gameResource.addMethod('GET', new apigateway.LambdaIntegration(gamesFunction));
        gameResource.addMethod('PUT', new apigateway.LambdaIntegration(gamesFunction));
        gameResource.addMethod('DELETE', new apigateway.LambdaIntegration(gamesFunction));
        // Uploads routes
        const uploadsResource = apiResource.addResource('uploads');
        uploadsResource.addMethod('POST', new apigateway.LambdaIntegration(uploadsFunction));
        uploadsResource.addMethod('GET', new apigateway.LambdaIntegration(uploadsFunction));
        // Outputs
        new cdk.CfnOutput(this, 'ApiUrl', {
            value: api.url,
            description: 'Basketball Review API URL',
        });
        new cdk.CfnOutput(this, 'BucketName', {
            value: uploadsBucket.bucketName,
            description: 'S3 Bucket for uploads',
        });
        new cdk.CfnOutput(this, 'TableName', {
            value: basketballTable.tableName,
            description: 'DynamoDB Table Name',
        });
    }
}
exports.BasketballReviewStack = BasketballReviewStack;
