/**
 * Simple in-memory cache with TTL support
 *
 * Provides a basic cache implementation for storing values with
 * time-to-live expiration.
 *
 * @module lib/cache
 */

/**
 * Create a cache with TTL support.
 *
 * @param {number} defaultTtlMs - Default time-to-live in milliseconds
 * @returns {Object} Cache instance
 */
export function createCache(defaultTtlMs = 60000) {
  const store = new Map();

  return {
    /**
     * Set a value in the cache with optional TTL.
     *
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} [ttlMs] - Time-to-live in milliseconds (defaults to cache default)
     */
    set(key, value, ttlMs = defaultTtlMs) {
      const expiresAt = Date.now() + ttlMs;
      store.set(key, { value, expiresAt });
    },

    /**
     * Get a value from the cache.
     *
     * @param {string} key - Cache key
     * @returns {*} Cached value or undefined if not found or expired
     */
    get(key) {
      const entry = store.get(key);
      if (!entry) {
        return undefined;
      }

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return undefined;
      }

      return entry.value;
    },

    /**
     * Check if a key exists and is not expired.
     *
     * @param {string} key - Cache key
     * @returns {boolean} True if key exists and is not expired
     */
    has(key) {
      return this.get(key) !== undefined;
    },

    /**
     * Delete a key from the cache.
     *
     * @param {string} key - Cache key
     * @returns {boolean} True if key was deleted
     */
    delete(key) {
      return store.delete(key);
    },

    /**
     * Clear all entries from the cache.
     */
    clear() {
      store.clear();
    },

    /**
     * Get the number of entries in the cache (including expired ones).
     *
     * @returns {number} Number of entries
     */
    size() {
      return store.size;
    },
  };
}
