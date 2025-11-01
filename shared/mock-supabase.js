/**
 * Mock Supabase client for testing
 * Provides stub implementations of common Supabase methods
 */

export class MockSupabaseClient {
  constructor(options = {}) {
    this.mockData = options.mockData || {};
    this.mockError = options.mockError || null;
    this.calls = [];
  }

  from(table) {
    this.calls.push({ method: 'from', table });
    return new MockQueryBuilder(this, table);
  }

  rpc(functionName, params) {
    this.calls.push({ method: 'rpc', functionName, params });
    return {
      data: this.mockData[functionName] || null,
      error: this.mockError,
    };
  }

  getCalls() {
    return this.calls;
  }

  reset() {
    this.calls = [];
  }
}

class MockQueryBuilder {
  constructor(client, table) {
    this.client = client;
    this.table = table;
    this.operations = [];
  }

  select(columns = '*', options = {}) {
    this.operations.push({ method: 'select', columns, options });
    return this;
  }

  insert(data, options = {}) {
    this.operations.push({ method: 'insert', data, options });
    return this;
  }

  update(data, options = {}) {
    this.operations.push({ method: 'update', data, options });
    return this;
  }

  delete(options = {}) {
    this.operations.push({ method: 'delete', options });
    return this;
  }

  eq(column, value) {
    this.operations.push({ method: 'eq', column, value });
    return this;
  }

  neq(column, value) {
    this.operations.push({ method: 'neq', column, value });
    return this;
  }

  gt(column, value) {
    this.operations.push({ method: 'gt', column, value });
    return this;
  }

  gte(column, value) {
    this.operations.push({ method: 'gte', column, value });
    return this;
  }

  lt(column, value) {
    this.operations.push({ method: 'lt', column, value });
    return this;
  }

  lte(column, value) {
    this.operations.push({ method: 'lte', column, value });
    return this;
  }

  order(column, options = {}) {
    this.operations.push({ method: 'order', column, options });
    return this;
  }

  limit(count) {
    this.operations.push({ method: 'limit', count });
    return this;
  }

  single() {
    this.operations.push({ method: 'single' });
    return {
      data: this.client.mockData[this.table] || null,
      error: this.client.mockError,
    };
  }

  then(resolve) {
    // Support promise-like behavior
    const result = {
      data: this.client.mockData[this.table] || null,
      error: this.client.mockError,
    };
    return Promise.resolve(result).then(resolve);
  }

  catch(reject) {
    return Promise.reject(this.client.mockError).catch(reject);
  }
}

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabase(options = {}) {
  return new MockSupabaseClient(options);
}
