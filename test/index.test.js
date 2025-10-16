import { describe, it } from 'node:test';
import assert from 'node:assert';
import main from '../index.js';

describe('INT Smart Triage AI 2.0', () => {
  it('should export a main function', () => {
    assert.strictEqual(typeof main, 'function');
  });

  it('should return application info object', () => {
    const result = main();
    assert.strictEqual(typeof result, 'object');
    assert.strictEqual(result.name, 'INT Smart Triage AI 2.0');
    assert.strictEqual(result.version, '1.0.0');
    assert.strictEqual(result.status, 'operational');
  });

  it('should include mode property', () => {
    const result = main();
    assert.ok(result.mode);
    assert.strictEqual(typeof result.mode, 'string');
  });
});
