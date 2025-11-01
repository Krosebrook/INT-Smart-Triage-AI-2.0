/**
 * Shared test helper utilities
 * Common assertion helpers and test utilities
 */

import assert from 'node:assert';

/**
 * Assert that a value is a valid ISO date string
 */
export function assertIsISODate(
  value,
  message = 'Expected valid ISO date string'
) {
  assert.strictEqual(typeof value, 'string', message);
  const date = new Date(value);
  assert.ok(!isNaN(date.getTime()), message);
  assert.strictEqual(date.toISOString(), value, message);
}

/**
 * Assert that a value is a non-empty string
 */
export function assertNonEmptyString(
  value,
  message = 'Expected non-empty string'
) {
  assert.strictEqual(typeof value, 'string', message);
  assert.ok(value.length > 0, message);
}

/**
 * Assert that an object has all required properties
 */
export function assertHasProperties(
  obj,
  properties,
  message = 'Missing required properties'
) {
  assert.strictEqual(typeof obj, 'object', 'Expected an object');
  assert.ok(obj !== null, 'Expected non-null object');

  for (const prop of properties) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(obj, prop),
      `${message}: missing property '${prop}'`
    );
  }
}

/**
 * Assert that a value is a valid email address
 */
export function assertValidEmail(
  value,
  message = 'Expected valid email address'
) {
  assertNonEmptyString(value, message);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert.ok(emailRegex.test(value), message);
}

/**
 * Assert that an array contains specific items
 */
export function assertArrayContains(
  array,
  items,
  message = 'Array does not contain expected items'
) {
  assert.ok(Array.isArray(array), 'Expected an array');
  for (const item of items) {
    assert.ok(array.includes(item), `${message}: missing item '${item}'`);
  }
}

/**
 * Assert that a function throws an error with a specific message
 */
export function assertThrowsWithMessage(
  fn,
  expectedMessage,
  message = 'Function did not throw expected error'
) {
  try {
    fn();
    assert.fail(message);
  } catch (error) {
    if (expectedMessage instanceof RegExp) {
      assert.match(error.message, expectedMessage, message);
    } else {
      assert.ok(error.message.includes(expectedMessage), message);
    }
  }
}

/**
 * Assert that an async function rejects with a specific message
 */
export async function assertRejectsWithMessage(
  promise,
  expectedMessage,
  message = 'Promise did not reject with expected error'
) {
  try {
    await promise;
    assert.fail(message);
  } catch (error) {
    if (expectedMessage instanceof RegExp) {
      assert.match(error.message, expectedMessage, message);
    } else {
      assert.ok(error.message.includes(expectedMessage), message);
    }
  }
}

/**
 * Create a mock logger for testing
 */
export function createMockLogger() {
  const logs = {
    info: [],
    warn: [],
    error: [],
    debug: [],
  };

  return {
    info: (...args) => logs.info.push(args),
    warn: (...args) => logs.warn.push(args),
    error: (...args) => logs.error.push(args),
    debug: (...args) => logs.debug.push(args),
    getLogs: () => logs,
    clearLogs: () => {
      logs.info = [];
      logs.warn = [];
      logs.error = [];
      logs.debug = [];
    },
  };
}

/**
 * Wait for a specified duration (for async testing)
 */
export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a spy function that tracks calls
 */
export function createSpy() {
  const calls = [];
  const spy = (...args) => {
    calls.push(args);
    return spy.returnValue;
  };
  spy.calls = calls;
  spy.returnValue = undefined;
  spy.getCallCount = () => calls.length;
  spy.getCall = (index) => calls[index];
  spy.wasCalled = () => calls.length > 0;
  spy.wasCalledWith = (...expectedArgs) => {
    return calls.some((callArgs) =>
      expectedArgs.every((arg, i) => callArgs[i] === arg)
    );
  };
  spy.reset = () => {
    calls.length = 0;
  };
  return spy;
}
