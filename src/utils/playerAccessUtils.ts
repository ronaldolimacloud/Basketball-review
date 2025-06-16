/**
 * Utility functions for player access code management
 */

/**
 * Generate a unique access code for a player
 * Format: FIRST_LAST_XXXX (e.g., JOHN_DOE_2024)
 */
export const generatePlayerAccessCode = (playerName: string): string => {
  const cleanName = playerName
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '') // Remove non-alphabetic characters
    .trim()
    .split(/\s+/) // Split by whitespace
    .slice(0, 2) // Take first two parts (first and last name)
    .join('_');
  
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${cleanName}_${year}_${randomSuffix}`;
};

/**
 * Generate a simple access code for demo purposes
 */
export const generateSimpleAccessCode = (playerName: string): string => {
  const firstName = playerName.split(' ')[0].toUpperCase();
  const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${firstName}${randomNum}`;
};

/**
 * Validate access code format
 */
export const validateAccessCode = (code: string): boolean => {
  if (!code || code.length < 3) return false;
  
  // Allow alphanumeric characters and underscores
  const validFormat = /^[A-Z0-9_]+$/.test(code);
  
  return validFormat;
};