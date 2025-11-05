/**
 * Debug utilities for usecase_ts
 * Controlled by environment variables:
 * - USECASE_DEBUG=true or USECASETS_DEBUG=true to enable debug logging
 * - USECASE_DEBUG_LEVEL=verbose for detailed logging
 */

export type DebugLevel = 'basic' | 'verbose';

export interface DebugOptions {
  enabled: boolean;
  level: DebugLevel;
}

/**
 * Get debug configuration from environment variables
 */
export function getDebugConfig(): DebugOptions {
  const enabled =
    process.env.USECASE_DEBUG === 'true' ||
    process.env.USECASETS_DEBUG === 'true' ||
    process.env.NODE_ENV === 'development';

  const level: DebugLevel = process.env.USECASE_DEBUG_LEVEL === 'verbose' ? 'verbose' : 'basic';

  return { enabled, level };
}

/**
 * Debug logger for usecase results
 */
export class DebugLogger {
  private config: DebugOptions;
  private startTimes: Map<string, number> = new Map();

  constructor() {
    this.config = getDebugConfig();
  }

  /**
   * Check if debug is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Start timing for a use case execution
   */
  startTiming(useCaseClass: string, input?: any): void {
    if (!this.isEnabled()) return;

    this.startTimes.set(useCaseClass, Date.now());

    if (this.config.level === 'verbose') {
      console.log(`🚀 [USECASE:START] ${useCaseClass}`, {
        input: this.sanitizeInput(input),
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Log successful result
   */
  logSuccess<T>(useCaseClass: string, data: T, context?: Record<string, any>): void {
    if (!this.isEnabled()) return;

    const duration = this.getDuration(useCaseClass);

    if (this.config.level === 'verbose') {
      console.log(`✅ [USECASE:SUCCESS] ${useCaseClass}`, {
        duration: `${duration}ms`,
        output: this.sanitizeOutput(data),
        context: this.sanitizeContext(context),
        timestamp: new Date().toISOString(),
      });
    } else {
      console.log(`✅ [USECASE:SUCCESS] ${useCaseClass} (${duration}ms)`);
    }
  }

  /**
   * Log failure result
   */
  logFailure(
    useCaseClass: string,
    error: Error,
    failureType: string,
    context?: Record<string, any>,
  ): void {
    if (!this.isEnabled()) return;

    const duration = this.getDuration(useCaseClass);

    if (this.config.level === 'verbose') {
      console.log(`❌ [USECASE:FAILURE] ${useCaseClass}`, {
        duration: `${duration}ms`,
        failureType,
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines only
        },
        context: this.sanitizeContext(context),
        timestamp: new Date().toISOString(),
      });
    } else {
      console.log(
        `❌ [USECASE:FAILURE] ${useCaseClass} (${duration}ms) - ${failureType}: ${error.message}`,
      );
    }
  }

  /**
   * Log wrapper function execution
   */
  logWrapper(
    wrapperType:
      | 'ResultWrapper'
      | 'ResultAsyncWrapper'
      | 'ResultWrapValue'
      | 'ResultWrapValueAsync',
    isSuccess: boolean,
    functionName?: string,
    error?: Error,
    duration?: number,
  ): void {
    if (!this.isEnabled()) return;

    const emoji = isSuccess ? '✅' : '❌';
    const status = isSuccess ? 'SUCCESS' : 'FAILURE';
    const durationStr = duration ? ` (${duration}ms)` : '';
    const fnName = functionName || 'anonymous';

    if (this.config.level === 'verbose' && !isSuccess && error) {
      console.log(`${emoji} [${wrapperType}:${status}] ${fnName}${durationStr}`, {
        error: {
          message: error.message,
          name: error.name,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      console.log(
        `${emoji} [${wrapperType}:${status}] ${fnName}${durationStr}${!isSuccess && error ? ` - ${error.message}` : ''}`,
      );
    }
  }

  /**
   * Get execution duration
   */
  private getDuration(useCaseClass: string): number {
    const startTime = this.startTimes.get(useCaseClass);
    if (!startTime) return 0;

    const duration = Date.now() - startTime;
    this.startTimes.delete(useCaseClass); // Clean up
    return duration;
  }

  /**
   * Sanitize input for logging (remove sensitive data)
   */
  private sanitizeInput(input: any): any {
    if (!input) return input;

    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];

    if (typeof input === 'object') {
      const sanitized = { ...input };
      for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '[REDACTED]';
        }
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Sanitize output for logging
   */
  private sanitizeOutput(output: any): any {
    if (!output) return output;

    // Limit size of logged output
    const stringified = JSON.stringify(output);
    if (stringified.length > 500) {
      return `${stringified.substring(0, 500)}... [truncated]`;
    }

    return output;
  }

  /**
   * Sanitize context for logging
   */
  private sanitizeContext(context?: Record<string, any>): any {
    if (!context) return undefined;

    // Remove complex objects to avoid circular references
    const sanitized: any = {};
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value && typeof value === 'object') {
        sanitized[key] = '[Object]';
      }
    }

    return sanitized;
  }
}

// Singleton instance
let debugLogger: DebugLogger | null = null;

/**
 * Get the singleton debug logger instance
 */
export function getDebugLogger(): DebugLogger {
  if (!debugLogger) {
    debugLogger = new DebugLogger();
  }
  return debugLogger;
}

/**
 * Reset debug logger (useful for testing)
 */
export function resetDebugLogger(): void {
  debugLogger = null;
}
