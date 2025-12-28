/**
 * Centralized Logging Service
 * 
 * Provides consistent logging across the app with:
 * - Log levels (debug, info, warn, error)
 * - Context tagging for filtering
 * - Remote logging support (production)
 * - Performance timing utilities
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  feature?: string;
  screen?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  data?: any;
}

interface PerformanceEntry {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class Logger {
  private static instance: Logger;
  private isProduction: boolean;
  private logQueue: LogEntry[] = [];
  private performanceMarks: Map<string, PerformanceEntry> = new Map();
  private globalContext: LogContext = {};

  private constructor() {
    this.isProduction = !__DEV__;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set global context that will be included in all logs
   */
  setGlobalContext(context: LogContext): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  /**
   * Clear global context
   */
  clearGlobalContext(): void {
    this.globalContext = {};
  }

  /**
   * Debug level - only shown in development
   */
  debug(message: string, data?: any, context?: LogContext): void {
    this.log('debug', message, data, context);
  }

  /**
   * Info level - general information
   */
  info(message: string, data?: any, context?: LogContext): void {
    this.log('info', message, data, context);
  }

  /**
   * Warn level - potential issues
   */
  warn(message: string, data?: any, context?: LogContext): void {
    this.log('warn', message, data, context);
  }

  /**
   * Error level - errors and exceptions
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    const errorData = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : error;

    this.log('error', message, errorData, context);

    // TODO: Send to Sentry in production
    // if (this.isProduction) {
    //   Sentry.captureException(error, { extra: { message, context } });
    // }
  }

  /**
   * Core logging function
   */
  private log(
    level: LogLevel,
    message: string,
    data?: any,
    context?: LogContext
  ): void {
    const entry: LogEntry = {
      level,
      message,
      context: { ...this.globalContext, ...context },
      timestamp: new Date().toISOString(),
      data,
    };

    // Console output in development
    if (!this.isProduction || level === 'error') {
      this.consoleLog(entry);
    }

    // Queue for remote logging in production
    if (this.isProduction && level !== 'debug') {
      this.queueForRemote(entry);
    }
  }

  /**
   * Format and output to console
   */
  private consoleLog(entry: LogEntry): void {
    const prefix = this.formatPrefix(entry);
    const contextStr = entry.context
      ? ` [${Object.entries(entry.context)
          .map(([k, v]) => `${k}:${v}`)
          .join(', ')}]`
      : '';

    switch (entry.level) {
      case 'debug':
        console.debug(`${prefix}${contextStr}`, entry.message, entry.data ?? '');
        break;
      case 'info':
        console.info(`${prefix}${contextStr}`, entry.message, entry.data ?? '');
        break;
      case 'warn':
        console.warn(`${prefix}${contextStr}`, entry.message, entry.data ?? '');
        break;
      case 'error':
        console.error(`${prefix}${contextStr}`, entry.message, entry.data ?? '');
        break;
    }
  }

  /**
   * Format log prefix with timestamp and level
   */
  private formatPrefix(entry: LogEntry): string {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    const levelEmoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };
    return `${levelEmoji[entry.level]} [${time}] [${entry.level.toUpperCase()}]`;
  }

  /**
   * Queue log entry for remote sending
   */
  private queueForRemote(entry: LogEntry): void {
    this.logQueue.push(entry);

    // Batch send when queue reaches threshold
    if (this.logQueue.length >= 10) {
      this.flushLogs();
    }
  }

  /**
   * Send queued logs to remote server
   */
  async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    // TODO: Implement remote logging endpoint
    // try {
    //   await fetch('https://api.guidera.app/logs', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ logs: logsToSend }),
    //   });
    // } catch (error) {
    //   // Re-queue on failure
    //   this.logQueue = [...logsToSend, ...this.logQueue];
    // }
  }

  // ==================== Performance Logging ====================

  /**
   * Start a performance measurement
   */
  startTimer(name: string): void {
    this.performanceMarks.set(name, {
      name,
      startTime: performance.now(),
    });
  }

  /**
   * End a performance measurement and log the duration
   */
  endTimer(name: string, context?: LogContext): number | null {
    const mark = this.performanceMarks.get(name);
    if (!mark) {
      this.warn(`Performance mark "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - mark.startTime;

    this.performanceMarks.delete(name);

    this.debug(`⏱️ ${name}: ${duration.toFixed(2)}ms`, { duration }, context);

    return duration;
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    this.startTimer(name);
    try {
      const result = await fn();
      this.endTimer(name, context);
      return result;
    } catch (error) {
      this.endTimer(name, context);
      throw error;
    }
  }

  /**
   * Log screen navigation
   */
  logScreenView(screenName: string, params?: Record<string, any>): void {
    this.info(`Screen: ${screenName}`, params, { screen: screenName });
  }

  /**
   * Log user action
   */
  logAction(action: string, data?: any, context?: LogContext): void {
    this.info(`Action: ${action}`, data, { ...context, action });
  }

  /**
   * Log API request
   */
  logApiRequest(
    method: string,
    url: string,
    status?: number,
    duration?: number
  ): void {
    const level = status && status >= 400 ? 'error' : 'debug';
    this.log(level, `API ${method} ${url}`, { status, duration }, { action: 'api_request' });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
export const startTimer = logger.startTimer.bind(logger);
export const endTimer = logger.endTimer.bind(logger);
export const measureAsync = logger.measureAsync.bind(logger);
export const logScreenView = logger.logScreenView.bind(logger);
export const logAction = logger.logAction.bind(logger);

export default logger;
