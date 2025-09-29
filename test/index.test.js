import { describe, it } from 'node:test';
import assert from 'node:assert';
import main from '../index.js';

describe('INT Smart Triage AI 2.0', () => {
  it('should export a main function', () => {
    assert.strictEqual(typeof main, 'function');
  });

  it('should return expected message', () => {
    const result = main();
    assert.strictEqual(result, 'Hello from INT Smart Triage AI 2.0');
  });

  it('should return a non-empty string', () => {
    const result = main();
    assert.ok(typeof result === 'string' && result.length > 0);
  });
});
