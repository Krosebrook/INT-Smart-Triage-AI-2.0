/**
 * Unit tests for Logger
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { logger, LogLevel } from '../src/logger.js';

describe('Logger', () => {
  let originalConsole;

  beforeEach(() => {
    // Save original console methods
    originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };

    // Mock console methods
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
    console.error = () => {};

    // Reset logger to default state
    logger.configure({
      level: LogLevel.INFO,
      enabled: true,
      includeTimestamp: true,
      includeContext: true,
    });
  });

  afterEach(() => {
    // Restore console methods
    Object.assign(console, originalConsole);
  });

  describe('LogLevel', () => {
    it('should export all log levels', () => {
      assert.strictEqual(LogLevel.DEBUG, 'debug');
      assert.strictEqual(LogLevel.INFO, 'info');
      assert.strictEqual(LogLevel.WARN, 'warn');
      assert.strictEqual(LogLevel.ERROR, 'error');
    });
  });

  describe('Logging methods', () => {
    it('should have debug method', () => {
      assert.strictEqual(typeof logger.debug, 'function');
      assert.doesNotThrow(() => logger.debug('test message'));
    });

    it('should have info method', () => {
      assert.strictEqual(typeof logger.info, 'function');
      assert.doesNotThrow(() => logger.info('test message'));
    });

    it('should have warn method', () => {
      assert.strictEqual(typeof logger.warn, 'function');
      assert.doesNotThrow(() => logger.warn('test message'));
    });

    it('should have error method', () => {
      assert.strictEqual(typeof logger.error, 'function');
      assert.doesNotThrow(() => logger.error('test message'));
    });

    it('should accept context objects', () => {
      assert.doesNotThrow(() =>
        logger.info('test', { key: 'value', number: 123 })
      );
    });
  });

  describe('configure()', () => {
    it('should accept configuration options', () => {
      assert.doesNotThrow(() =>
        logger.configure({
          level: LogLevel.WARN,
          enabled: false,
          includeTimestamp: false,
        })
      );
    });

    it('should update configuration', () => {
      logger.configure({ level: LogLevel.ERROR });
      const config = logger.getConfig();
      assert.strictEqual(config.level, LogLevel.ERROR);
    });
  });

  describe('getConfig()', () => {
    it('should return current configuration', () => {
      const config = logger.getConfig();
      assert.strictEqual(typeof config, 'object');
      assert.ok('level' in config);
      assert.ok('enabled' in config);
      assert.ok('includeTimestamp' in config);
      assert.ok('includeContext' in config);
    });

    it('should return a copy of config', () => {
      const config1 = logger.getConfig();
      const config2 = logger.getConfig();
      assert.notStrictEqual(config1, config2);
    });
  });

  describe('enable() and disable()', () => {
    it('should enable logging', () => {
      logger.disable();
      logger.enable();
      const config = logger.getConfig();
      assert.strictEqual(config.enabled, true);
    });

    it('should disable logging', () => {
      logger.enable();
      logger.disable();
      const config = logger.getConfig();
      assert.strictEqual(config.enabled, false);
    });
  });

  describe('Log level filtering', () => {
    it('should respect log level configuration', () => {
      let debugLogged = false;
      let errorLogged = false;

      console.log = () => {
        debugLogged = true;
      };
      console.error = () => {
        errorLogged = true;
      };

      logger.configure({ level: LogLevel.ERROR });
      logger.debug('should not log');
      assert.strictEqual(debugLogged, false);

      logger.error('should log');
      assert.strictEqual(errorLogged, true);
    });
  });

  describe('Default export', () => {
    it('should export logger as default', async () => {
      const defaultLogger = (await import('../src/logger.js')).default;
      assert.strictEqual(defaultLogger, logger);
    });
  });
});
