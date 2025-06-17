/**
 * Format seconds to MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format seconds to a more readable format (e.g., "2m 30s")
 */
export const formatTimeReadable = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  if (mins === 0) {
    return `${secs}s`;
  }
  
  if (secs === 0) {
    return `${mins}m`;
  }
  
  return `${mins}m ${secs}s`;
};

/**
 * Convert MM:SS string back to seconds
 */
export const parseTimeToSeconds = (timeString: string): number => {
  const parts = timeString.split(':');
  if (parts.length !== 2) return 0;
  
  const mins = parseInt(parts[0], 10) || 0;
  const secs = parseInt(parts[1], 10) || 0;
  
  return mins * 60 + secs;
};

/**
 * Format time for game clock display (handles negative time)
 */
export const formatGameClock = (seconds: number): string => {
  const absSeconds = Math.abs(seconds);
  const formatted = formatTime(absSeconds);
  return seconds < 0 ? `-${formatted}` : formatted;
}; 