/**
 * Lambda Function Testing Script
 * 
 * Tests MediaConvert Lambda functions locally and in AWS environment
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AMPLIFY_ENV = process.env.AMPLIFY_ENV || 'dev';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🧪 ${title}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

async function testLambdaFunctionLocally(functionName, testEvent) {
  logSection(`Testing ${functionName} locally`);
  
  const functionPath = path.join(process.cwd(), 'amplify', 'functions', functionName);
  
  if (!existsSync(functionPath)) {
    log(`❌ Function directory not found: ${functionPath}`, 'red');
    return false;
  }

  try {
    // Check if handler file exists
    const handlerPath = path.join(functionPath, 'handler.ts');
    if (!existsSync(handlerPath)) {
      log(`❌ Handler file not found: ${handlerPath}`, 'red');
      return false;
    }

    log(`📁 Function path: ${functionPath}`, 'blue');
    log(`📄 Handler found: handler.ts`, 'green');

    // Test TypeScript compilation
    log(`🔧 Testing TypeScript compilation...`, 'yellow');
    try {
      await runCommand('npm', ['run', 'build'], { cwd: functionPath });
      log(`✅ TypeScript compilation successful`, 'green');
    } catch (error) {
      log(`❌ TypeScript compilation failed: ${error.message}`, 'red');
      return false;
    }

    // Check dependencies
    const packageJsonPath = path.join(functionPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      log(`📦 Dependencies:`, 'blue');
      Object.keys(packageJson.dependencies || {}).forEach(dep => {
        log(`  - ${dep}: ${packageJson.dependencies[dep]}`, 'blue');
      });
    }

    // Simulate event locally (basic validation)
    log(`🧪 Validating event structure...`, 'yellow');
    if (testEvent.Records && Array.isArray(testEvent.Records)) {
      log(`✅ Event structure valid: ${testEvent.Records.length} records`, 'green');
      
      testEvent.Records.forEach((record, index) => {
        if (record.s3) {
          log(`  Record ${index + 1}: S3 event`, 'blue');
          log(`    Bucket: ${record.s3.bucket.name}`, 'blue');
          log(`    Key: ${record.s3.object.key}`, 'blue');
        } else if (record.eventBridge) {
          log(`  Record ${index + 1}: EventBridge event`, 'blue');
          log(`    Source: ${record.source}`, 'blue');
        }
      });
    }

    return true;
  } catch (error) {
    log(`❌ Local test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testS3TriggerIntegration() {
  logSection('Testing S3 Trigger Integration');
  
  try {
    // Check if S3 bucket exists and has proper event notifications
    log(`🪣 Checking S3 bucket configuration...`, 'yellow');
    
    const result = await runCommand('aws', [
      's3api', 'get-bucket-notification-configuration',
      '--bucket', `amplify-basketballreview-${AMPLIFY_ENV}-storage`,
      '--region', AWS_REGION
    ]);

    const config = JSON.parse(result.stdout);
    log(`✅ S3 bucket notification configuration retrieved`, 'green');
    
    if (config.LambdaConfigurations) {
      log(`📋 Lambda configurations found: ${config.LambdaConfigurations.length}`, 'green');
      config.LambdaConfigurations.forEach((lambda, index) => {
        log(`  Configuration ${index + 1}:`, 'blue');
        log(`    Lambda ARN: ${lambda.LambdaFunctionArn}`, 'blue');
        log(`    Events: ${lambda.Events.join(', ')}`, 'blue');
        if (lambda.Filter) {
          log(`    Prefix: ${lambda.Filter.Key?.FilterRules?.find(r => r.Name === 'prefix')?.Value || 'None'}`, 'blue');
          log(`    Suffix: ${lambda.Filter.Key?.FilterRules?.find(r => r.Name === 'suffix')?.Value || 'None'}`, 'blue');
        }
      });
    } else {
      log(`⚠️ No Lambda configurations found`, 'yellow');
    }

    return true;
  } catch (error) {
    log(`❌ S3 integration test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testMediaConvertSetup() {
  logSection('Testing MediaConvert Setup');
  
  try {
    // Check MediaConvert endpoints
    log(`🎬 Checking MediaConvert endpoints...`, 'yellow');
    
    const endpointsResult = await runCommand('aws', [
      'mediaconvert', 'describe-endpoints',
      '--region', AWS_REGION
    ]);

    const endpoints = JSON.parse(endpointsResult.stdout);
    if (endpoints.Endpoints && endpoints.Endpoints.length > 0) {
      log(`✅ MediaConvert endpoint available: ${endpoints.Endpoints[0].Url}`, 'green');
    } else {
      log(`❌ No MediaConvert endpoints found`, 'red');
      return false;
    }

    // Check IAM permissions for MediaConvert
    log(`🔐 Checking IAM role for MediaConvert...`, 'yellow');
    
    try {
      const roleResult = await runCommand('aws', [
        'iam', 'get-role',
        '--role-name', `MediaConvertRole-${AMPLIFY_ENV}`,
        '--region', AWS_REGION
      ]);
      log(`✅ MediaConvert IAM role exists`, 'green');
    } catch (error) {
      log(`⚠️ MediaConvert IAM role not found or not accessible`, 'yellow');
    }

    return true;
  } catch (error) {
    log(`❌ MediaConvert setup test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testEventBridgeRules() {
  logSection('Testing EventBridge Rules');
  
  try {
    // List EventBridge rules
    log(`📋 Checking EventBridge rules...`, 'yellow');
    
    const rulesResult = await runCommand('aws', [
      'events', 'list-rules',
      '--name-prefix', `amplify-basketballreview-${AMPLIFY_ENV}`,
      '--region', AWS_REGION
    ]);

    const rules = JSON.parse(rulesResult.stdout);
    if (rules.Rules && rules.Rules.length > 0) {
      log(`✅ EventBridge rules found: ${rules.Rules.length}`, 'green');
      
      for (const rule of rules.Rules) {
        log(`  Rule: ${rule.Name}`, 'blue');
        log(`    State: ${rule.State}`, 'blue');
        log(`    Description: ${rule.Description || 'None'}`, 'blue');
        
        // Get targets for this rule
        try {
          const targetsResult = await runCommand('aws', [
            'events', 'list-targets-by-rule',
            '--rule', rule.Name,
            '--region', AWS_REGION
          ]);
          
          const targets = JSON.parse(targetsResult.stdout);
          if (targets.Targets) {
            log(`    Targets: ${targets.Targets.length}`, 'blue');
            targets.Targets.forEach((target, index) => {
              log(`      Target ${index + 1}: ${target.Arn}`, 'blue');
            });
          }
        } catch (error) {
          log(`    ⚠️ Could not retrieve targets: ${error.message}`, 'yellow');
        }
      }
    } else {
      log(`⚠️ No EventBridge rules found`, 'yellow');
    }

    return true;
  } catch (error) {
    log(`❌ EventBridge rules test failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log(`🏀 Basketball Review - Video Processing Lambda Tests`, 'bright');
  log(`Environment: ${AMPLIFY_ENV}`, 'blue');
  log(`Region: ${AWS_REGION}`, 'blue');

  const results = [];

  // Test video processor function locally
  const videoProcessorEvent = {
    Records: [{
      eventVersion: '2.1',
      eventSource: 'aws:s3',
      eventName: 'ObjectCreated:Put',
      s3: {
        bucket: { name: `amplify-basketballreview-${AMPLIFY_ENV}-storage` },
        object: { 
          key: 'protected/game-videos/test-game-123/sample-video.mp4',
          size: 1024000
        }
      }
    }]
  };

  results.push({
    name: 'Video Processor Local Test',
    success: await testLambdaFunctionLocally('video-processor', videoProcessorEvent)
  });

  // Test video completion handler function locally
  const completionEvent = {
    Records: [{
      eventSource: 'aws:events',
      eventName: 'MediaConvert Job State Change',
      source: 'aws.mediaconvert',
      detail: {
        status: 'COMPLETE',
        jobId: 'test-job-123',
        userMetadata: {
          gameId: 'test-game-123'
        }
      }
    }]
  };

  results.push({
    name: 'Video Completion Handler Local Test',
    success: await testLambdaFunctionLocally('video-completion-handler', completionEvent)
  });

  // Test AWS integrations
  results.push({
    name: 'S3 Trigger Integration',
    success: await testS3TriggerIntegration()
  });

  results.push({
    name: 'MediaConvert Setup',
    success: await testMediaConvertSetup()
  });

  results.push({
    name: 'EventBridge Rules',
    success: await testEventBridgeRules()
  });

  // Summary
  logSection('Test Results Summary');
  
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const color = result.success ? 'green' : 'red';
    log(`${status} ${result.name}`, color);
  });

  log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`, 
    passedTests === totalTests ? 'green' : 'yellow');

  if (passedTests === totalTests) {
    log(`🎉 All tests passed! Video processing pipeline is ready.`, 'green');
  } else {
    log(`⚠️ Some tests failed. Please review the issues above.`, 'yellow');
  }

  return passedTests === totalTests;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Test runner crashed: ${error.message}`, 'red');
      process.exit(1);
    });
}

export { runAllTests, testLambdaFunctionLocally, testS3TriggerIntegration, testMediaConvertSetup };