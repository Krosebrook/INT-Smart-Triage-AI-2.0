# Testing Guide

## Overview

This document describes the testing infrastructure, patterns, and utilities for the INT Smart Triage AI 2.0 project.

## Test Structure

All tests are located in the `test/` directory and use Node.js's built-in test runner (`node:test`).

### Directory Structure

```
test/
├── *.test.js           # Test files for each module
shared/
├── test-helpers.js     # Common assertion helpers and utilities
├── mock-supabase.js    # Mock Supabase client
├── mock-apis.js        # Mock external API integrations
└── test-fixtures.js    # Sample test data
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test test/<filename>.test.js
```

### Run with Coverage

```bash
npm run test:coverage
```

### Check Coverage Thresholds

```bash
npm run test:coverage-check
```

Coverage thresholds are set to 70% for lines, functions, and branches.

## Test Patterns

### Basic Test Structure

Tests follow the pattern established by Node.js test runner with `describe` and `it` blocks:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MyModule } from '../src/myModule.js';

describe('MyModule', () => {
  describe('myMethod()', () => {
    it('should do something', () => {
      const result = MyModule.myMethod();
      assert.strictEqual(result, expectedValue);
    });
  });
});
```

### Using beforeEach and afterEach

```javascript
import { describe, it, beforeEach, afterEach } from 'node:test';

describe('MyService', () => {
  let service;

  beforeEach(() => {
    service = new MyService();
  });

  afterEach(() => {
    // Clean up
  });

  it('should work', () => {
    // test implementation
  });
});
```

## Shared Test Utilities

### Test Helpers (`shared/test-helpers.js`)

Common assertion helpers and utilities:

```javascript
import {
  assertIsISODate,
  assertNonEmptyString,
  assertHasProperties,
  assertValidEmail,
  createMockLogger,
  createSpy,
  wait,
} from '../shared/test-helpers.js';

// Assert ISO date
assertIsISODate('2024-01-15T10:30:00Z');

// Assert non-empty string
assertNonEmptyString('hello');

// Assert object has properties
assertHasProperties(obj, ['name', 'email', 'id']);

// Create a spy function
const spy = createSpy();
spy('arg1', 'arg2');
assert.strictEqual(spy.getCallCount(), 1);
assert.ok(spy.wasCalledWith('arg1', 'arg2'));

// Wait for async operations
await wait(100); // Wait 100ms
```

### Mock Supabase (`shared/mock-supabase.js`)

Mock Supabase client for testing database interactions without a real database:

```javascript
import { createMockSupabase } from '../shared/mock-supabase.js';

const mockClient = createMockSupabase({
  mockData: {
    reports: [{ id: 1, name: 'Test Report' }],
  },
  mockError: null,
});

// Use in tests
const { data, error } = await mockClient.from('reports').select('*');
```

### Mock APIs (`shared/mock-apis.js`)

Mock implementations for external API integrations:

```javascript
import {
  mockFreshdeskAPI,
  mockHubSpotAPI,
  createMockFetch,
} from '../shared/mock-apis.js';

// Use mock Freshdesk API
const ticket = mockFreshdeskAPI.createTicket({
  subject: 'Test',
  description: 'Test description',
});

// Use mock HubSpot API
const contact = mockHubSpotAPI.createContact({
  email: 'test@example.com',
  firstname: 'Test',
  lastname: 'User',
});

// Create custom mock fetch
const mockFetch = createMockFetch({
  'https://api.example.com/data': {
    status: 200,
    data: { success: true },
  },
});
```

### Test Fixtures (`shared/test-fixtures.js`)

Pre-defined sample data for common entities:

```javascript
import {
  sampleTicket,
  sampleCustomer,
  sampleCSR,
  sampleArticle,
  sampleTriageReport,
  createSampleTickets,
} from '../shared/test-fixtures.js';

// Use in tests
const ticket = sampleTicket;
const tickets = createSampleTickets(10); // Create 10 sample tickets
```

## Test Coverage

The project aims for 70% code coverage across:

- Lines
- Functions
- Branches

Coverage reports are generated in:

- Console output (text)
- HTML report: `coverage/index.html`
- LCOV report: `coverage/lcov.info`

## Testing Modules Without Database

Many modules require Supabase configuration. When testing without a configured database:

1. Tests should check if the database is configured
2. Tests should verify error handling when database is not available
3. Use mock Supabase client for unit tests

Example:

```javascript
describe('getReport()', () => {
  it('should return error when database not configured', async () => {
    const result = await getReport('TEST-001');

    if (!supabase) {
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Database not configured');
    }
  });
});
```

## Integration Testing

For integration tests that require external services:

1. Use environment variables to configure test credentials
2. Check if credentials are available before running integration tests
3. Skip integration tests gracefully when credentials are not available

## Continuous Integration

Tests run automatically on every push and pull request via GitHub Actions (`.github/workflows/ci.yml`).

The CI pipeline:

1. Installs dependencies
2. Runs linter (`npm run lint`)
3. Runs tests (`npm test`)
4. Builds the project (`npm run build`)

## Best Practices

1. **Write Descriptive Test Names**: Use clear, descriptive names that explain what is being tested
2. **Test One Thing**: Each test should verify one specific behavior
3. **Use Assertions Wisely**: Use the most specific assertion possible
4. **Clean Up**: Use `afterEach` to clean up resources
5. **Avoid Test Dependencies**: Tests should be independent and run in any order
6. **Mock External Dependencies**: Use mock objects for external services
7. **Test Error Cases**: Don't just test the happy path
8. **Keep Tests Fast**: Unit tests should run quickly

## Troubleshooting

### Tests Fail Due to Missing Dependencies

```bash
npm ci
```

### Tests Fail Due to Lint Errors

```bash
npm run lint:fix
```

### Coverage Below Threshold

Run coverage report to identify untested code:

```bash
npm run test:coverage
```

Then add tests for uncovered areas.

## Adding New Tests

When adding a new module:

1. Create a corresponding test file in `test/`
2. Follow the existing naming convention: `<moduleName>.test.js`
3. Use shared utilities from `shared/` directory
4. Ensure tests pass locally before committing
5. Verify coverage meets the 70% threshold

## Examples

See existing test files for reference:

- `test/logger.test.js` - Simple module testing
- `test/supabaseClient.test.js` - Database module with mocking
- `test/analyticsService.test.js` - Service with database dependency
- `test/syncQueue.test.js` - Complex class testing

## Resources

- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [Node.js Assert Module](https://nodejs.org/api/assert.html)
- [c8 Coverage Tool](https://github.com/bcoe/c8)
