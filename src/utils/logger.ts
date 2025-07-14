/**
 * Logger utility for Basketball Review App
 * 
 * This logger provides controlled logging that can be disabled in production
 * and supports different log levels.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      enabled: import.meta.env.MODE === 'development' || import.meta.env.VITE_ENABLE_LOGGING === 'true',
      level: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info',
      prefix: '[Basketball]',
      ...config
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.enabled && this.levels[level] >= this.levels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): [string, ...any[]] {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `${this.config.prefix} [${timestamp}] [${level.toUpperCase()}]`;
    return [`${prefix} ${message}`, ...args];
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('debug', message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(...this.formatMessage('info', message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', message, ...args));
    }
  }

  error(message: string, error?: Error | any, ...args: any[]): void {
    if (this.shouldLog('error')) {
      if (error instanceof Error) {
        console.error(...this.formatMessage('error', message), error.message, error.stack, ...args);
      } else if (error) {
        console.error(...this.formatMessage('error', message), error, ...args);
      } else {
        console.error(...this.formatMessage('error', message, ...args));
      }
    }
  }

  // Special method for game events tracking
  gameEvent(eventType: string, data: any): void {
    if (this.shouldLog('debug')) {
      this.debug(`📊 Game Event: ${eventType}`, data);
    }
  }

  // Special method for API calls
  api(method: string, endpoint: string, data?: any): void {
    if (this.shouldLog('debug')) {
      this.debug(`🔌 API ${method} ${endpoint}`, data);
    }
  }

  // Group console methods (useful for organizing complex logs)
  group(label: string): void {
    if (this.config.enabled && console.group) {
      console.group(`${this.config.prefix} ${label}`);
    }
  }

  groupEnd(): void {
    if (this.config.enabled && console.groupEnd) {
      console.groupEnd();
    }
  }

  // Create a child logger with a different prefix
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: `${this.config.prefix} [${prefix}]`
    });
  }
}

// Create and export the default logger instance
export const logger = new Logger();

// Export the Logger class for creating custom instances
export { Logger };

// Export type definitions
export type { LogLevel, LoggerConfig };

/**
 * Usage examples:
 * 
 * // Basic logging
 * logger.info('Application started');
 * logger.error('Failed to load data', error);
 * 
 * // Game events
 * logger.gameEvent('SCORE_UPDATE', { team: 'home', points: 2 });
 * 
 * // API logging
 * logger.api('POST', '/api/games', gameData);
 * 
 * // Child logger for specific components
 * const gameLogger = logger.child('GameReview');
 * gameLogger.info('Game started');
 * 
 * // Environment variables:
 * // VITE_ENABLE_LOGGING=true - Enable logging in production
 * // VITE_LOG_LEVEL=debug|info|warn|error - Set minimum log level
 */