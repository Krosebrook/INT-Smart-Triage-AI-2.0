/**
 * Tests for shared library utilities
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  success,
  failure,
  ErrorCode,
  isSuccess,
  isFailure,
  tryCatch,
  notConfigured,
  validationError,
  notFound,
} from '../src/lib/result.js';

import { Container, container } from '../src/lib/container.js';

import {
  getEnvVar,
  hasEnvVar,
  getEnvVars,
  isDevelopment,
  isProduction,
  isTest,
} from '../src/lib/env.js';

describe('Result utilities', () => {
  describe('success()', () => {
    it('should create a success result spreading object properties', () => {
      const result = success({ id: 1, name: 'Test' });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.name, 'Test');
    });

    it('should use data property for arrays', () => {
      const result = success([1, 2, 3]);
      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(result.data, [1, 2, 3]);
    });

    it('should use data property for primitives', () => {
      const result = success('test');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data, 'test');
    });

    it('should use data property for null', () => {
      const result = success(null);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data, null);
    });
  });

  describe('failure()', () => {
    it('should create a failure result with error message', () => {
      const result = failure('Something went wrong');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Something went wrong');
    });

    it('should include error code when provided', () => {
      const result = failure('Not found', ErrorCode.NOT_FOUND);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Not found');
      assert.strictEqual(result.code, ErrorCode.NOT_FOUND);
    });
  });

  describe('isSuccess()', () => {
    it('should return true for success results', () => {
      const result = success({ data: 'test' });
      assert.strictEqual(isSuccess(result), true);
    });

    it('should return false for failure results', () => {
      const result = failure('error');
      assert.strictEqual(isSuccess(result), false);
    });

    it('should return false for null/undefined', () => {
      assert.ok(!isSuccess(null));
      assert.ok(!isSuccess(undefined));
    });
  });

  describe('isFailure()', () => {
    it('should return true for failure results', () => {
      const result = failure('error');
      assert.strictEqual(isFailure(result), true);
    });

    it('should return false for success results', () => {
      const result = success({ data: 'test' });
      assert.strictEqual(isFailure(result), false);
    });
  });

  describe('tryCatch()', () => {
    it('should return success for successful async operation', async () => {
      const result = await tryCatch(async () => ({ value: 42 }));
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.value, 42);
    });

    it('should return failure for rejected promise', async () => {
      const result = await tryCatch(async () => {
        throw new Error('Async error');
      });
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Async error');
    });

    it('should include context in error message', async () => {
      const result = await tryCatch(async () => {
        throw new Error('Original error');
      }, 'Failed to load data');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Failed to load data: Original error');
    });
  });

  describe('notConfigured()', () => {
    it('should create database not configured error', () => {
      const result = notConfigured();
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Database not configured');
      assert.strictEqual(result.code, ErrorCode.DATABASE_NOT_CONFIGURED);
    });
  });

  describe('validationError()', () => {
    it('should create validation error with message', () => {
      const result = validationError('Email is required');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Email is required');
      assert.strictEqual(result.code, ErrorCode.VALIDATION_ERROR);
    });
  });

  describe('notFound()', () => {
    it('should create not found error with default resource', () => {
      const result = notFound();
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Resource not found');
      assert.strictEqual(result.code, ErrorCode.NOT_FOUND);
    });

    it('should create not found error with custom resource', () => {
      const result = notFound('User');
      assert.strictEqual(result.error, 'User not found');
    });
  });
});

describe('Container', () => {
  let testContainer;

  beforeEach(() => {
    testContainer = new Container();
  });

  describe('register()', () => {
    it('should register a service factory', () => {
      testContainer.register('logger', () => ({ log: () => {} }));
      assert.strictEqual(testContainer.has('logger'), true);
    });

    it('should allow chaining', () => {
      const result = testContainer
        .register('a', () => 1)
        .register('b', () => 2);
      assert.strictEqual(result, testContainer);
    });
  });

  describe('resolve()', () => {
    it('should resolve a registered service', () => {
      testContainer.register('config', () => ({ apiUrl: 'http://test.com' }));
      const config = testContainer.resolve('config');
      assert.deepStrictEqual(config, { apiUrl: 'http://test.com' });
    });

    it('should cache singleton instances', () => {
      let callCount = 0;
      testContainer.register('counter', () => {
        callCount++;
        return { count: callCount };
      });

      const first = testContainer.resolve('counter');
      const second = testContainer.resolve('counter');

      assert.strictEqual(first, second);
      assert.strictEqual(callCount, 1);
    });

    it('should not cache non-singleton instances', () => {
      let callCount = 0;
      testContainer.register(
        'counter',
        () => {
          callCount++;
          return { count: callCount };
        },
        { singleton: false }
      );

      testContainer.resolve('counter');
      testContainer.resolve('counter');

      assert.strictEqual(callCount, 2);
    });

    it('should pass container to factory', () => {
      testContainer.register('dep', () => 'dependency');
      testContainer.register('service', (c) => ({
        dep: c.resolve('dep'),
      }));

      const service = testContainer.resolve('service');
      assert.strictEqual(service.dep, 'dependency');
    });

    it('should throw for unregistered service', () => {
      assert.throws(() => testContainer.resolve('unknown'), {
        message: "Service 'unknown' is not registered",
      });
    });
  });

  describe('instance()', () => {
    it('should register a pre-created instance', () => {
      const config = { debug: true };
      testContainer.instance('config', config);
      assert.strictEqual(testContainer.resolve('config'), config);
    });
  });

  describe('clearInstances()', () => {
    it('should clear cached instances', () => {
      let callCount = 0;
      testContainer.register('counter', () => ++callCount);

      testContainer.resolve('counter');
      testContainer.clearInstances();
      testContainer.resolve('counter');

      assert.strictEqual(callCount, 2);
    });
  });

  describe('reset()', () => {
    it('should clear all registrations and instances', () => {
      testContainer.register('service', () => ({}));
      testContainer.reset();
      assert.strictEqual(testContainer.has('service'), false);
    });
  });
});

describe('Default container', () => {
  it('should be a Container instance', () => {
    assert.ok(container instanceof Container);
  });
});

describe('Environment utilities', () => {
  describe('getEnvVar()', () => {
    it('should return undefined for missing var without default', () => {
      const result = getEnvVar('NON_EXISTENT_VAR_12345');
      assert.strictEqual(result, undefined);
    });

    it('should return default value for missing var', () => {
      const result = getEnvVar('NON_EXISTENT_VAR_12345', 'default');
      assert.strictEqual(result, 'default');
    });

    it('should return process.env value when set', () => {
      const original = process.env.TEST_VAR;
      process.env.TEST_VAR = 'test_value';
      try {
        const result = getEnvVar('TEST_VAR');
        assert.strictEqual(result, 'test_value');
      } finally {
        if (original !== undefined) {
          process.env.TEST_VAR = original;
        } else {
          delete process.env.TEST_VAR;
        }
      }
    });
  });

  describe('hasEnvVar()', () => {
    it('should return false for missing var', () => {
      assert.strictEqual(hasEnvVar('NON_EXISTENT_VAR_12345'), false);
    });

    it('should return true for existing var', () => {
      process.env.TEST_HAS_VAR = 'value';
      try {
        assert.strictEqual(hasEnvVar('TEST_HAS_VAR'), true);
      } finally {
        delete process.env.TEST_HAS_VAR;
      }
    });

    it('should return false for empty string', () => {
      process.env.TEST_EMPTY_VAR = '';
      try {
        assert.strictEqual(hasEnvVar('TEST_EMPTY_VAR'), false);
      } finally {
        delete process.env.TEST_EMPTY_VAR;
      }
    });
  });

  describe('getEnvVars()', () => {
    it('should return object with requested vars', () => {
      process.env.TEST_A = 'a';
      process.env.TEST_B = 'b';
      try {
        const result = getEnvVars(['TEST_A', 'TEST_B', 'TEST_MISSING']);
        assert.strictEqual(result.TEST_A, 'a');
        assert.strictEqual(result.TEST_B, 'b');
        assert.strictEqual(result.TEST_MISSING, undefined);
      } finally {
        delete process.env.TEST_A;
        delete process.env.TEST_B;
      }
    });
  });

  describe('Environment checks', () => {
    it('isDevelopment() should return true when NODE_ENV not set', () => {
      const original = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      try {
        assert.strictEqual(isDevelopment(), true);
      } finally {
        if (original !== undefined) {
          process.env.NODE_ENV = original;
        }
      }
    });

    it('isProduction() should return true when NODE_ENV is production', () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        assert.strictEqual(isProduction(), true);
      } finally {
        if (original !== undefined) {
          process.env.NODE_ENV = original;
        } else {
          delete process.env.NODE_ENV;
        }
      }
    });

    it('isTest() should return true when NODE_ENV is test', () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      try {
        assert.strictEqual(isTest(), true);
      } finally {
        if (original !== undefined) {
          process.env.NODE_ENV = original;
        } else {
          delete process.env.NODE_ENV;
        }
      }
    });
  });
});
