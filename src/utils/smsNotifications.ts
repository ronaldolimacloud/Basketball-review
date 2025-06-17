/**
 * SMS Notification Utilities using AWS SNS
 * 
 * This module provides functions to send SMS notifications to players
 * with their access codes and portal links.
 */

export interface SMSMessage {
  phoneNumber: string;
  message: string;
  playerName?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Formats a phone number to E.164 format for SMS sending
 * @param phoneNumber - Raw phone number input
 * @returns Formatted phone number or null if invalid
 */
export const formatPhoneNumber = (phoneNumber: string): string | null => {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it's 10 digits, assume US number and add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it's 11 digits and starts with 1, format as US number
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // If it already has country code (12+ digits), add + if missing
  if (cleaned.length >= 11) {
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }
  
  return null; // Invalid format
};

/**
 * Validates if a phone number is in the correct format for SMS
 * @param phoneNumber - Phone number to validate
 * @returns True if valid, false otherwise
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const formatted = formatPhoneNumber(phoneNumber);
  return formatted !== null;
};

/**
 * Creates a formatted SMS message for player portal access
 * @param playerName - Name of the player
 * @param accessCode - Player's access code
 * @param portalUrl - URL to the player portal
 * @returns Formatted SMS message
 */
export const createPlayerAccessMessage = (
  playerName: string,
  accessCode: string,
  portalUrl: string
): string => {
  return `Hi ${playerName}! 🏀

Your basketball portal is ready:
${portalUrl}

Access code: ${accessCode}

View your stats, videos, and coach feedback anytime!

- Your Coach`;
};

/**
 * Creates a team announcement SMS message
 * @param teamName - Name of the team
 * @param message - Announcement message
 * @param portalUrl - URL to the player portal
 * @returns Formatted SMS message
 */
export const createTeamAnnouncementMessage = (
  teamName: string,
  message: string,
  portalUrl: string
): string => {
  return `🏀 ${teamName} Update:

${message}

Check your portal for more details:
${portalUrl}

- Your Coach`;
};

/**
 * Sends an SMS using AWS SNS (MCP integration)
 * 
 * NOTE: This function currently returns a mock response.
 * In a real implementation, this would use the AWS SNS MCP tool
 * to send actual SMS messages.
 * 
 * @param smsMessage - SMS message details
 * @returns Promise with SMS sending result
 */
export const sendSMS = async (smsMessage: SMSMessage): Promise<SMSResult> => {
  try {
    // Validate phone number format
    const formattedPhone = formatPhoneNumber(smsMessage.phoneNumber);
    if (!formattedPhone) {
      return {
        success: false,
        error: 'Invalid phone number format. Please use format: (555) 123-4567 or +1-555-123-4567'
      };
    }

    // TODO: Implement actual AWS SNS integration using MCP tools
    // For now, we'll simulate the SMS sending
    console.log('🚀 Simulating SMS send:', {
      to: formattedPhone,
      message: smsMessage.message,
      player: smsMessage.playerName
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate success response
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      messageId,
    };

    /*
    // Future implementation with AWS SNS MCP:
    const result = await mcp__awslabs_sns_sqs__publish({
      PhoneNumber: formattedPhone,
      Message: smsMessage.message,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional'
        }
      }
    });

    return {
      success: true,
      messageId: result.MessageId
    };
    */

  } catch (error) {
    console.error('❌ SMS sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Sends SMS to multiple recipients (batch operation)
 * @param messages - Array of SMS messages to send
 * @returns Promise with array of results
 */
export const sendBatchSMS = async (messages: SMSMessage[]): Promise<SMSResult[]> => {
  const results: SMSResult[] = [];
  
  // Send messages sequentially to avoid rate limiting
  for (const message of messages) {
    const result = await sendSMS(message);
    results.push(result);
    
    // Add small delay between messages
    if (messages.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
};