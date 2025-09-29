import { describe, it } from 'node:test';
import assert from 'node:assert';
import main, { TriageApplication } from '../index.js';

describe('INT Smart Triage AI 2.0', () => {
  it('should export a main function', () => {
    assert.strictEqual(typeof main, 'function');
  });

  it('should export TriageApplication class', () => {
    assert.strictEqual(typeof TriageApplication, 'function');
    const app = new TriageApplication();
    assert.ok(app instanceof TriageApplication);
  });

  it('should return application status when main is called', async () => {
    const result = await main();
    assert.ok(typeof result === 'object');
    assert.ok(result.name);
    assert.ok(result.version);
    assert.ok(result.initialized !== undefined);
  });

  it('should initialize TriageApplication correctly', async () => {
    const app = new TriageApplication();
    const status = await app.initialize();
    
    assert.strictEqual(status.name, 'INT Smart Triage AI');
    assert.strictEqual(status.version, '2.0.0');
    assert.strictEqual(status.initialized, true);
    assert.ok(status.timestamp);
  });

  it('should return same status on multiple initializations', async () => {
    const app = new TriageApplication();
    const status1 = await app.initialize();
    const status2 = await app.initialize();
    
    assert.strictEqual(status1.initialized, status2.initialized);
    assert.strictEqual(status1.version, status2.version);
  });
});
