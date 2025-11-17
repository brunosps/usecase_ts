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
      const sanitizedContext = this.sanitizeContextVerbose(context);
      console.log(`✅ [USECASE:SUCCESS] ${useCaseClass}`);
      console.log(
        JSON.stringify(
          {
            duration: `${duration}ms`,
            output: this.sanitizeOutput(data),
            context: sanitizedContext,
            timestamp: new Date().toISOString(),
          },
          null,
          2,
        ),
      );
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
        context: this.sanitizeContextVerbose(context),
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

    try {
      // Limit size of logged output
      const stringified = JSON.stringify(output, null, 2);
      if (stringified.length > 1000) {
        return `${stringified.substring(0, 1000)}... [truncated]`;
      }

      return output;
    } catch (error) {
      // Handle circular references
      return '[Complex Object - cannot stringify]';
    }
  }

  /**
   * Sanitize context for logging
   */
  private sanitizeContext(context?: Record<string, any>): any {
    if (!context) return undefined;

    try {
      // Try to get useful information from context
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(context)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          sanitized[key] = value;
        } else if (value === null || value === undefined) {
          sanitized[key] = value;
        } else if (Array.isArray(value)) {
          sanitized[key] = `Array(${value.length})`;
        } else if (typeof value === 'object') {
          // Try to extract useful properties from the object
          const objInfo: any = {};
          
          // Get _inputParams and _outputParams if they exist
          if ('_inputParams' in value) {
            try {
              objInfo.input = this.formatContextData(value._inputParams, 200);
            } catch {
              objInfo.input = '[Complex Input]';
            }
          }
          
          if ('_outputParams' in value) {
            try {
              objInfo.output = this.formatContextData(value._outputParams, 200);
            } catch {
              objInfo.output = '[Complex Output]';
            }
          }
          
          // If we got useful info, use it; otherwise just show keys
          if (Object.keys(objInfo).length > 0) {
            sanitized[key] = objInfo;
          } else {
            const keys = Object.keys(value);
            sanitized[key] = keys.length > 0 ? `{${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}}` : '{}';
          }
        }
      }

      return sanitized;
    } catch (error) {
      return '[Context - cannot process]';
    }
  }

  /**
   * Format context data for logging with proper truncation
   */
  private formatContextData(data: any, maxLength: number = 200): any {
    if (data === null || data === undefined) {
      return data;
    }

    try {
      const jsonStr = JSON.stringify(data);

      // If it's small enough, parse it back to show as object
      if (jsonStr.length <= maxLength) {
        return data;
      }

      // If it's an object or array, try to show a preview
      if (typeof data === 'object') {
        if (Array.isArray(data)) {
          return `Array(${data.length}) [${data.slice(0, 2).map(item => {
            const str = JSON.stringify(item);
            return str.length > 30 ? `${str.substring(0, 30)}...` : str;
          }).join(', ')}${data.length > 2 ? ', ...' : ''}]`;
        } else {
          // Show first few keys with their values
          const entries = Object.entries(data).slice(0, 3);
          const preview = entries.map(([k, v]) => {
            const valStr = JSON.stringify(v);
            const shortVal = valStr.length > 30 ? `${valStr.substring(0, 30)}...` : valStr;
            return `${k}: ${shortVal}`;
          }).join(', ');

          const totalKeys = Object.keys(data).length;
          return `{${preview}${totalKeys > 3 ? `, ... +${totalKeys - 3} more` : ''}}`;
        }
      }

      // For strings or other types, just truncate
      return `${jsonStr.substring(0, maxLength)}...`;
    } catch {
      return '[Complex Data]';
    }
  }

  /**
   * Sanitize context for verbose logging with better formatting
   */
  private sanitizeContextVerbose(context?: Record<string, any>): any {
    if (!context) return undefined;

    try {
      const result: any = {};

      for (const [key, value] of Object.entries(context)) {
        if (typeof value === 'object' && value !== null) {
          // Check if it's a use case context with _inputParams and _outputParams
          if ('_inputParams' in value || '_outputParams' in value) {
            const contextInfo: any = {};

            if ('_inputParams' in value) {
              contextInfo.input = value._inputParams;
            }

            if ('_outputParams' in value) {
              contextInfo.output = value._outputParams;
            }

            result[key] = contextInfo;
          } else {
            result[key] = value;
          }
        } else {
          result[key] = value;
        }
      }

      return result;
    } catch (error) {
      return context;
    }
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
