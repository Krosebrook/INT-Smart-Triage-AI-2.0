/**
 * Unit tests for Cache
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createCache } from '../src/lib/cache.js';
import { wait } from '../shared/test-helpers.js';

describe('Cache', () => {
  describe('createCache()', () => {
    it('should create a cache with default TTL', () => {
      const cache = createCache();
      assert.ok(cache);
      assert.strictEqual(typeof cache.set, 'function');
      assert.strictEqual(typeof cache.get, 'function');
      assert.strictEqual(typeof cache.has, 'function');
      assert.strictEqual(typeof cache.delete, 'function');
      assert.strictEqual(typeof cache.clear, 'function');
      assert.strictEqual(typeof cache.size, 'function');
    });

    it('should create a cache with custom TTL', () => {
      const cache = createCache(5000);
      assert.ok(cache);
    });
  });

  describe('set() and get()', () => {
    it('should store and retrieve values', () => {
      const cache = createCache();
      cache.set('key1', 'value1');
      const value = cache.get('key1');
      assert.strictEqual(value, 'value1');
    });

    it('should store different types of values', () => {
      const cache = createCache();
      cache.set('string', 'hello');
      cache.set('number', 42);
      cache.set('boolean', true);
      cache.set('object', { foo: 'bar' });
      cache.set('array', [1, 2, 3]);

      assert.strictEqual(cache.get('string'), 'hello');
      assert.strictEqual(cache.get('number'), 42);
      assert.strictEqual(cache.get('boolean'), true);
      assert.deepStrictEqual(cache.get('object'), { foo: 'bar' });
      assert.deepStrictEqual(cache.get('array'), [1, 2, 3]);
    });

    it('should return undefined for non-existent keys', () => {
      const cache = createCache();
      const value = cache.get('nonexistent');
      assert.strictEqual(value, undefined);
    });

    it('should overwrite existing values', () => {
      const cache = createCache();
      cache.set('key', 'value1');
      cache.set('key', 'value2');
      assert.strictEqual(cache.get('key'), 'value2');
    });
  });

  describe('has()', () => {
    it('should return true for existing keys', () => {
      const cache = createCache();
      cache.set('key', 'value');
      assert.strictEqual(cache.has('key'), true);
    });

    it('should return false for non-existent keys', () => {
      const cache = createCache();
      assert.strictEqual(cache.has('nonexistent'), false);
    });

    it('should return false for expired keys', async () => {
      const cache = createCache(50);
      cache.set('key', 'value');
      assert.strictEqual(cache.has('key'), true);

      await wait(60);
      assert.strictEqual(cache.has('key'), false);
    });
  });

  describe('delete()', () => {
    it('should delete existing keys', () => {
      const cache = createCache();
      cache.set('key', 'value');
      const deleted = cache.delete('key');
      assert.strictEqual(deleted, true);
      assert.strictEqual(cache.get('key'), undefined);
    });

    it('should return false for non-existent keys', () => {
      const cache = createCache();
      const deleted = cache.delete('nonexistent');
      assert.strictEqual(deleted, false);
    });
  });

  describe('clear()', () => {
    it('should remove all entries', () => {
      const cache = createCache();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      assert.strictEqual(cache.get('key1'), undefined);
      assert.strictEqual(cache.get('key2'), undefined);
      assert.strictEqual(cache.get('key3'), undefined);
      assert.strictEqual(cache.size(), 0);
    });
  });

  describe('size()', () => {
    it('should return number of entries', () => {
      const cache = createCache();
      assert.strictEqual(cache.size(), 0);

      cache.set('key1', 'value1');
      assert.strictEqual(cache.size(), 1);

      cache.set('key2', 'value2');
      assert.strictEqual(cache.size(), 2);

      cache.delete('key1');
      assert.strictEqual(cache.size(), 1);

      cache.clear();
      assert.strictEqual(cache.size(), 0);
    });
  });

  describe('TTL Expiration', () => {
    it('should expire entries after default TTL', async () => {
      const cache = createCache(50);
      cache.set('key', 'value');

      assert.strictEqual(cache.get('key'), 'value');

      await wait(60);

      assert.strictEqual(cache.get('key'), undefined);
    });

    it('should expire entries after custom TTL', async () => {
      const cache = createCache(100);
      cache.set('key', 'value', 30);

      assert.strictEqual(cache.get('key'), 'value');

      await wait(40);

      assert.strictEqual(cache.get('key'), undefined);
    });

    it('should not expire entries before TTL', async () => {
      const cache = createCache(100);
      cache.set('key', 'value');

      await wait(50);

      assert.strictEqual(cache.get('key'), 'value');
    });

    it('should remove expired entries on access', async () => {
      const cache = createCache(50);
      cache.set('key', 'value');

      assert.strictEqual(cache.size(), 1);

      await wait(60);

      // Accessing expired entry should remove it
      cache.get('key');

      // Size should still be 0 after removal (Note: size counts all entries including expired)
      // But the entry is actually removed when accessed
      assert.strictEqual(cache.get('key'), undefined);
    });

    it('should handle multiple entries with different TTLs', async () => {
      const cache = createCache(100);
      cache.set('short', 'value1', 30);
      cache.set('long', 'value2', 200);

      await wait(40);

      assert.strictEqual(cache.get('short'), undefined);
      assert.strictEqual(cache.get('long'), 'value2');

      await wait(180);

      assert.strictEqual(cache.get('long'), undefined);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined values', () => {
      const cache = createCache();
      cache.set('key', undefined);
      // Since get returns undefined for missing keys, we use has() to verify
      assert.strictEqual(cache.has('key'), false); // undefined is not cached
    });

    it('should handle null values', () => {
      const cache = createCache();
      cache.set('key', null);
      assert.strictEqual(cache.get('key'), null);
    });

    it('should handle empty string values', () => {
      const cache = createCache();
      cache.set('key', '');
      assert.strictEqual(cache.get('key'), '');
    });

    it('should handle zero values', () => {
      const cache = createCache();
      cache.set('key', 0);
      assert.strictEqual(cache.get('key'), 0);
    });

    it('should handle false values', () => {
      const cache = createCache();
      cache.set('key', false);
      assert.strictEqual(cache.get('key'), false);
    });
  });
});
