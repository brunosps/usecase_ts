import { DebugLogger, getDebugConfig } from './debug';

// Mock console.log para capturar output
const originalConsoleLog = console.log;
let mockOutput: any[] = [];

beforeEach(() => {
  mockOutput = [];
  console.log = jest.fn((...args: any[]) => {
    mockOutput.push(args.length === 1 ? args[0] : args);
  });

  // Reset environment variables
  delete process.env.USECASE_DEBUG;
  delete process.env.USECASETS_DEBUG;
  delete process.env.USECASE_DEBUG_LEVEL;
  delete process.env.NODE_ENV;

  // Force recreation of singleton instance by clearing the closure
  jest.resetModules();
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('Debug Functionality', () => {
  describe('Debug Configuration', () => {
    it('should be disabled by default', () => {
      const config = getDebugConfig();
      expect(config.enabled).toBe(false);
      expect(config.level).toBe('basic');
    });

    it('should be enabled with USECASE_DEBUG=true', () => {
      process.env.USECASE_DEBUG = 'true';
      const config = getDebugConfig();
      expect(config.enabled).toBe(true);
    });

    it('should be enabled with USECASETS_DEBUG=true', () => {
      process.env.USECASETS_DEBUG = 'true';
      const config = getDebugConfig();
      expect(config.enabled).toBe(true);
    });

    it('should be enabled in development environment', () => {
      process.env.NODE_ENV = 'development';
      const config = getDebugConfig();
      expect(config.enabled).toBe(true);
    });

    it('should use verbose level when configured', () => {
      process.env.USECASE_DEBUG = 'true';
      process.env.USECASE_DEBUG_LEVEL = 'verbose';
      const config = getDebugConfig();
      expect(config.level).toBe('verbose');
    });
  });

  describe('DebugLogger', () => {
    it('should not log when debug is disabled', () => {
      const logger = new DebugLogger();
      logger.logSuccess('TestCase', { result: 'test' });

      expect(mockOutput).toHaveLength(0);
    });

    it('should log when debug is enabled', () => {
      process.env.USECASE_DEBUG = 'true';
      const logger = new DebugLogger();
      logger.startTiming('TestCase');
      logger.logSuccess('TestCase', { result: 'test' });

      expect(mockOutput).toHaveLength(1);
      expect(mockOutput[0]).toContain('✅ [USECASE:SUCCESS] TestCase');
    });

    it('should log failure with error message', () => {
      process.env.USECASE_DEBUG = 'true';
      const logger = new DebugLogger();
      const error = new Error('Test error');
      logger.startTiming('TestCase');
      logger.logFailure('TestCase', error, 'VALIDATION_ERROR');

      expect(mockOutput).toHaveLength(1);
      expect(mockOutput[0]).toContain('❌ [USECASE:FAILURE] TestCase');
      expect(mockOutput[0]).toContain('VALIDATION_ERROR: Test error');
    });

    it('should log wrapper operations', () => {
      process.env.USECASE_DEBUG = 'true';
      const logger = new DebugLogger();
      logger.logWrapper('ResultWrapper', true, 'testFunction', undefined, 25);

      expect(mockOutput).toHaveLength(1);
      expect(mockOutput[0]).toContain('✅ [ResultWrapper:SUCCESS] testFunction (25ms)');
    });

    it('should log detailed information in verbose mode', () => {
      process.env.USECASE_DEBUG = 'true';
      process.env.USECASE_DEBUG_LEVEL = 'verbose';

      const logger = new DebugLogger();
      logger.startTiming('TestCase', { input: 'test' });
      logger.logSuccess('TestCase', { result: 'success' });

      expect(mockOutput).toHaveLength(2);

      // In verbose mode, console.log is called with multiple arguments
      const firstLog = Array.isArray(mockOutput[0]) ? mockOutput[0][0] : mockOutput[0];
      const secondLog = Array.isArray(mockOutput[1]) ? mockOutput[1][0] : mockOutput[1];

      expect(firstLog).toMatch(/🚀.*USECASE:START.*TestCase/);
      expect(secondLog).toMatch(/✅.*USECASE:SUCCESS.*TestCase/);
    });
  });

  describe('Wrapper Debug Integration', () => {
    const testFunction = (value: string) => {
      if (value === 'error') {
        throw new Error('Function error');
      }
      return { processed: value };
    };

    it('should log successful ResultWrapper execution', () => {
      process.env.USECASE_DEBUG = 'true';

      // Re-import after setting env var
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ResultWrapper } = require('./result-wrapper');
      ResultWrapper(testFunction, ['test']);

      expect(mockOutput.length).toBeGreaterThan(0);
      expect(mockOutput[0]).toContain('✅');
      expect(mockOutput[0]).toContain('ResultWrapper:SUCCESS');
    });

    it('should log failed ResultWrapper execution', () => {
      process.env.USECASE_DEBUG = 'true';

      // Re-import after setting env var
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ResultWrapper } = require('./result-wrapper');
      ResultWrapper(testFunction, ['error']);

      expect(mockOutput.length).toBeGreaterThan(0);
      expect(mockOutput[0]).toContain('❌');
      expect(mockOutput[0]).toContain('ResultWrapper:FAILURE');
    });

    it('should log ResultWrapValue operations', () => {
      process.env.USECASE_DEBUG = 'true';

      // Re-import after setting env var
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ResultWrapValue } = require('./result-wrapper');
      ResultWrapValue('test value');
      ResultWrapValue(null, { nullAsFailure: true });

      expect(mockOutput.length).toBeGreaterThanOrEqual(2);
      expect(mockOutput[0]).toContain('✅');
      expect(mockOutput[0]).toContain('ResultWrapValue:SUCCESS');
      expect(mockOutput[1]).toContain('❌');
      expect(mockOutput[1]).toContain('ResultWrapValue:FAILURE');
    });
  });
});
