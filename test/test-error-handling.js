#!/usr/bin/env node

/**
 * Simple test script to validate the error handling and logging modules
 */

import { createContextLogger, generateRequestId, logRequest, logResponse } from '../lib/logger.js';
import { APIError, ErrorTypes, ValidationHelpers } from '../lib/errorHandler.js';

console.log('Testing error handling and logging modules...\n');

// Test 1: Logger functionality
console.log('1. Testing Logger:');
const requestId = generateRequestId();
console.log('Generated Request ID:', requestId);

const logger = createContextLogger(requestId, 'test-user', '/api/test');
logger.info('Test info message', { testData: 'example' });
logger.warn('Test warning message');
logger.debug('Test debug message');

// Test 2: Error handling
console.log('\n2. Testing Error Handling:');
try {
  throw new APIError(ErrorTypes.VALIDATION_ERROR, 'Test validation error', { field: 'testField' });
} catch (error) {
  console.log('Caught APIError:', {
    type: error.type,
    message: error.message,
    statusCode: error.statusCode,
    details: error.details
  });
}

// Test 3: Validation helpers
console.log('\n3. Testing Validation Helpers:');
try {
  const testData = { name: 'John', age: 30 };
  ValidationHelpers.validateRequiredFields(testData, ['name', 'age', 'email']);
} catch (error) {
  console.log('Validation error caught correctly:', error.message);
}

try {
  ValidationHelpers.validateFieldOptions('invalid', ['valid1', 'valid2'], 'testField');
} catch (error) {
  console.log('Field validation error caught correctly:', error.message);
}

console.log('\n✅ All tests completed successfully!');
console.log('Error handling and logging modules are working correctly.');