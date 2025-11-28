/**
 * Lightweight Dependency Injection Container
 *
 * Provides a simple service container for managing dependencies
 * and enabling testability through dependency injection.
 *
 * @module lib/container
 * @since 2.1.0
 */

/**
 * @typedef {Object} ServiceDefinition
 * @property {Function} factory - Factory function to create the service
 * @property {boolean} [singleton=true] - Whether to cache the instance
 */

/**
 * Simple dependency injection container.
 *
 * @class Container
 *
 * @example
 * const container = new Container();
 * container.register('database', () => new Database(config));
 * container.register('userService', (c) => new UserService(c.resolve('database')));
 *
 * const userService = container.resolve('userService');
 */
export class Container {
  constructor() {
    /** @private */
    this.services = new Map();
    /** @private */
    this.instances = new Map();
  }

  /**
   * Register a service factory.
   *
   * @param {string} name - Service name
   * @param {Function} factory - Factory function that receives the container
   * @param {Object} [options] - Registration options
   * @param {boolean} [options.singleton=true] - Cache the instance
   * @returns {Container} This container for chaining
   *
   * @example
   * container.register('logger', () => new Logger(), { singleton: true });
   */
  register(name, factory, options = {}) {
    const { singleton = true } = options;
    this.services.set(name, { factory, singleton });
    // Clear cached instance if re-registering
    this.instances.delete(name);
    return this;
  }

  /**
   * Register a pre-created instance.
   *
   * @param {string} name - Service name
   * @param {*} instance - Service instance
   * @returns {Container} This container for chaining
   *
   * @example
   * container.instance('config', { apiUrl: 'https://api.example.com' });
   */
  instance(name, instance) {
    this.instances.set(name, instance);
    this.services.set(name, { factory: () => instance, singleton: true });
    return this;
  }

  /**
   * Resolve a service by name.
   *
   * @template T
   * @param {string} name - Service name
   * @returns {T} Service instance
   * @throws {Error} If service is not registered
   *
   * @example
   * const db = container.resolve('database');
   */
  resolve(name) {
    // Return cached instance if exists
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    const definition = this.services.get(name);
    if (!definition) {
      throw new Error(`Service '${name}' is not registered`);
    }

    const instance = definition.factory(this);

    // Cache singleton instances
    if (definition.singleton) {
      this.instances.set(name, instance);
    }

    return instance;
  }

  /**
   * Check if a service is registered.
   *
   * @param {string} name - Service name
   * @returns {boolean} True if registered
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Clear all cached instances (useful for testing).
   *
   * @returns {Container} This container for chaining
   */
  clearInstances() {
    this.instances.clear();
    return this;
  }

  /**
   * Clear all registrations and instances.
   *
   * @returns {Container} This container for chaining
   */
  reset() {
    this.services.clear();
    this.instances.clear();
    return this;
  }
}

/**
 * Default application container instance.
 *
 * Use this for the main application. Tests can create their own
 * container instances for isolation.
 */
export const container = new Container();

export default container;
