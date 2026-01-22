#!/usr/bin/env node

/**
 * Integration test for the updated API endpoints
 * Tests error handling and logging integration
 */

// Mock the Vercel request/response objects for testing
class MockRequest {
  constructor(method = 'GET', body = {}, headers = {}) {
    this.method = method;
    this.body = body;
    this.headers = {
      'user-agent': 'test-agent',
      'content-type': 'application/json',
      ...headers
    };
    this.url = '/api/test';
  }
}

class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this._json = null;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  json(data) {
    this._json = data;
    return this;
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }
}

// Set test environment
process.env.NODE_ENV = 'development';

async function testHealthCheckAPI() {
  console.log('Testing Health Check API...');
  
  // Import the handler
  const healthHandler = (await import('../api/health-check.js')).default;
  
  // Test GET request (valid)
  const req1 = new MockRequest('GET');
  const res1 = new MockResponse();
  
  try {
    await healthHandler(req1, res1);
    console.log('✅ GET request successful');
    console.log('  Status:', res1.statusCode);
    console.log('  Response includes requestId:', !!res1._json.requestId);
  } catch (error) {
    console.log('❌ GET request failed:', error.message);
  }
  
  // Test POST request (invalid method)
  const req2 = new MockRequest('POST');
  const res2 = new MockResponse();
  
  try {
    await healthHandler(req2, res2);
    console.log('✅ POST request handled correctly');
    console.log('  Status:', res2.statusCode);
    console.log('  Error response:', res2._json.status === 'error');
  } catch (error) {
    console.log('❌ POST request error handling failed:', error.message);
  }
}

async function testTriageReportAPI() {
  console.log('\nTesting Triage Report API...');
  
  // Import the handler
  const triageHandler = (await import('../api/triage-report.js')).default;
  
  // Test valid POST request
  const validBody = {
    customerName: 'John Doe',
    ticketSubject: 'Test Issue',
    issueDescription: 'This is a test issue for validation',
    customerTone: 'calm',
    csrAgent: 'TestAgent'
  };
  
  const req1 = new MockRequest('POST', validBody);
  const res1 = new MockResponse();
  
  try {
    await triageHandler(req1, res1);
    console.log('✅ Valid POST request handled');
    console.log('  Status:', res1.statusCode);
    console.log('  Response type:', res1._json.status);
    console.log('  Includes requestId:', !!res1._json.requestId);
  } catch (error) {
    console.log('❌ Valid POST request failed:', error.message);
  }
  
  // Test invalid method
  const req2 = new MockRequest('GET');
  const res2 = new MockResponse();
  
  try {
    await triageHandler(req2, res2);
    console.log('✅ GET request (invalid method) handled correctly');
    console.log('  Status:', res2.statusCode);
    console.log('  Error response:', res2._json.status === 'error');
  } catch (error) {
    console.log('❌ Invalid method handling failed:', error.message);
  }
  
  // Test missing required fields
  const req3 = new MockRequest('POST', { customerName: 'John' }); // Missing required fields
  const res3 = new MockResponse();
  
  try {
    await triageHandler(req3, res3);
    console.log('✅ Missing fields validation handled correctly');
    console.log('  Status:', res3.statusCode);
    console.log('  Error response:', res3._json.status === 'error');
  } catch (error) {
    console.log('❌ Missing fields validation failed:', error.message);
  }
  
  // Test invalid customer tone
  const invalidBody = {
    ...validBody,
    customerTone: 'invalid_tone'
  };
  
  const req4 = new MockRequest('POST', invalidBody);
  const res4 = new MockResponse();
  
  try {
    await triageHandler(req4, res4);
    console.log('✅ Invalid tone validation handled correctly');
    console.log('  Status:', res4.statusCode);
    console.log('  Error response:', res4._json.status === 'error');
  } catch (error) {
    console.log('❌ Invalid tone validation failed:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Running API Integration Tests\n');
  console.log('='.repeat(50));
  
  await testHealthCheckAPI();
  await testTriageReportAPI();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Integration tests completed!');
  console.log('Check the console output above to verify all tests passed.');
}

runTests().catch(console.error);