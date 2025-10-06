import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Configuration Tests', () => {
  it('should validate Node.js version requirement', () => {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    assert.ok(majorVersion >= 18, `Node.js version ${nodeVersion} should be >= 18`);
  });

  it('should have environment setup for ES modules', () => {
    // Test that we can use ES module imports
    assert.ok(import.meta.url, 'ES modules should be properly configured');
  });
});