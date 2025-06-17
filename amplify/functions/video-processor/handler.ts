/// <reference types="node" />
import { S3Event, S3Handler } from 'aws-lambda';
import { MediaConvertClient, CreateJobCommand, CreateJobCommandInput } from '@aws-sdk/client-mediaconvert';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

// MediaConvert client initialization
const mediaConvertClient = new MediaConvertClient({ 
  region: process.env.AWS_REGION || 'ap-southeast-2'
});

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-2'
});

interface ProcessingJobConfig {
  inputKey: string;
  outputPrefix: string;
  gameId?: string;
}

export const handler: S3Handler = async (event: S3Event) => {
  console.log('🎬 Video processing triggered:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      
      // Only process video files uploaded to game-videos folder
      if (!key.startsWith('protected/game-videos/') || !isVideoFile(key)) {
        console.log(`⏭️ Skipping non-video file: ${key}`);
        continue;
      }

      await processVideo({
        inputKey: key,
        outputPrefix: key.replace('game-videos/', 'processed-videos/').replace(/\.[^/.]+$/, ''),
        gameId: extractGameId(key)
      });

    } catch (error) {
      console.error('❌ Error processing video:', error);
      // Continue processing other files even if one fails
    }
  }
};

async function processVideo(config: ProcessingJobConfig): Promise<void> {
  const jobSettings = createJobSettings(config);
  
  try {
    console.log(`🔄 Starting MediaConvert job for: ${config.inputKey}`);
    
    const command = new CreateJobCommand(jobSettings);
    const response = await mediaConvertClient.send(command);
    
    console.log(`✅ MediaConvert job created: ${response.Job?.Id}`);
    
    // Update game record with processing status if gameId is available
    if (config.gameId) {
      await updateGameProcessingStatus(config.gameId, 'PROCESSING', response.Job?.Id);
    }
    
  } catch (error) {
    console.error('❌ Failed to create MediaConvert job:', error);
    
    if (config.gameId) {
      await updateGameProcessingStatus(config.gameId, 'FAILED');
    }
    
    throw error;
  }
}

function createJobSettings(config: ProcessingJobConfig): CreateJobCommandInput {
  const inputS3Uri = `s3://${process.env.STORAGE_BUCKET_NAME}/${config.inputKey}`;
  const outputS3Uri = `s3://${process.env.STORAGE_BUCKET_NAME}/${config.outputPrefix}`;

  return {
    Role: process.env.MEDIACONVERT_ROLE_ARN!,
    JobTemplate: process.env.MEDIACONVERT_JOB_TEMPLATE_NAME,
    Settings: {
      Inputs: [
        {
          FileInput: inputS3Uri,
          AudioSelectors: {
            'Audio Selector 1': {
              DefaultSelection: 'DEFAULT'
            }
          },
          VideoSelector: {}
        }
      ],
      OutputGroups: [
        // MP4 Output for web playback
        {
          Name: 'File Group',
          OutputGroupSettings: {
            Type: 'FILE_GROUP_SETTINGS',
            FileGroupSettings: {
              Destination: `${outputS3Uri}/mp4/`
            }
          },
          Outputs: [
            // 1080p version
            {
              NameModifier: '_1080p',
              ContainerSettings: {
                Container: 'MP4',
                Mp4Settings: {}
              },
              VideoDescription: {
                Width: 1920,
                Height: 1080,
                CodecSettings: {
                  Codec: 'H_264',
                  H264Settings: {
                    RateControlMode: 'QVBR',
                    MaxBitrate: 5000000,
                    QvbrSettings: {
                      QvbrQualityLevel: 8
                    }
                  }
                }
              },
              AudioDescriptions: [
                {
                  CodecSettings: {
                    Codec: 'AAC',
                    AacSettings: {
                      Bitrate: 128000,
                      SampleRate: 48000
                    }
                  }
                }
              ]
            },
            // 720p version for mobile
            {
              NameModifier: '_720p',
              ContainerSettings: {
                Container: 'MP4',
                Mp4Settings: {}
              },
              VideoDescription: {
                Width: 1280,
                Height: 720,
                CodecSettings: {
                  Codec: 'H_264',
                  H264Settings: {
                    RateControlMode: 'QVBR',
                    MaxBitrate: 2500000,
                    QvbrSettings: {
                      QvbrQualityLevel: 7
                    }
                  }
                }
              },
              AudioDescriptions: [
                {
                  CodecSettings: {
                    Codec: 'AAC',
                    AacSettings: {
                      Bitrate: 128000,
                      SampleRate: 48000
                    }
                  }
                }
              ]
            }
          ]
        },
        // Thumbnail generation
        {
          Name: 'Thumbnail Group',
          OutputGroupSettings: {
            Type: 'FILE_GROUP_SETTINGS',
            FileGroupSettings: {
              Destination: `${outputS3Uri}/thumbnails/`
            }
          },
          Outputs: [
            {
              NameModifier: '_thumb',
              ContainerSettings: {
                Container: 'RAW'
              },
              VideoDescription: {
                Width: 1280,
                Height: 720,
                CodecSettings: {
                  Codec: 'FRAME_CAPTURE',
                  FrameCaptureSettings: {
                    FramerateNumerator: 1,
                    FramerateDenominator: 60, // One frame every 60 seconds
                    MaxCaptures: 10,
                    Quality: 80
                  }
                }
              }
            }
          ]
        }
      ]
    },
    Tags: {
      Project: 'BasketballReview',
      ProcessedBy: 'AutomatedPipeline',
      GameId: config.gameId || 'unknown'
    }
  };
}

async function updateGameProcessingStatus(
  gameId: string, 
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
  jobId?: string
): Promise<void> {
  try {
    const updateParams = {
      TableName: process.env.GAME_TABLE_NAME!,
      Key: {
        id: { S: gameId }
      },
      UpdateExpression: 'SET videoProcessingStatus = :status' + (jobId ? ', mediaConvertJobId = :jobId' : ''),
      ExpressionAttributeValues: {
        ':status': { S: status },
        ...(jobId && { ':jobId': { S: jobId } })
      }
    };

    await dynamoClient.send(new UpdateItemCommand(updateParams));
    console.log(`✅ Updated game ${gameId} processing status to: ${status}`);
  } catch (error) {
    console.error('❌ Failed to update game processing status:', error);
  }
}

function isVideoFile(filename: string): boolean {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return videoExtensions.includes(extension);
}

function extractGameId(key: string): string | undefined {
  // Extract gameId from S3 key pattern: protected/game-videos/{gameId}/filename.mp4
  const match = key.match(/protected\/game-videos\/([^\/]+)\//);
  return match ? match[1] : undefined;
}