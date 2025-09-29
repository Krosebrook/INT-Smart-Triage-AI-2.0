#!/usr/bin/env node

/**
 * Demonstration script for the new error handling and logging features
 * Shows various scenarios and how they are handled
 */

import { generateRequestId, createContextLogger } from '../lib/logger.js';
import { APIError, ErrorTypes, ValidationHelpers, createErrorResponse } from '../lib/errorHandler.js';

console.log('🎯 INT Smart Triage AI 2.0 - Error Handling & Logging Demo\n');

// Demo 1: Successful operation with logging
console.log('1. 📊 Successful API Operation');
const requestId1 = generateRequestId();
const logger1 = createContextLogger(requestId1, 'demo-user', '/api/triage-report');

logger1.info('Processing customer triage request', {
  customerName: 'Jane Smith',
  ticketSubject: 'Billing Question',
  priority: 'medium'
});

const startTime = Date.now();
// Simulate processing
await new Promise(resolve => setTimeout(resolve, 100));
const responseTime = Date.now() - startTime;

logger1.info('Triage request processed successfully', {
  responseTime: `${responseTime}ms`,
  priority: 'medium',
  confidence: '90%'
});

console.log(`✅ Request ${requestId1.substring(0, 8)}... completed in ${responseTime}ms\n`);

// Demo 2: Validation error handling
console.log('2. ⚠️  Validation Error Scenario');
const requestId2 = generateRequestId();
const logger2 = createContextLogger(requestId2, 'demo-user', '/api/triage-report');

try {
  // Simulate validation error
  ValidationHelpers.validateFieldOptions('invalid_tone', ['calm', 'frustrated', 'angry'], 'customer tone');
} catch (error) {
  logger2.warn('Validation error occurred', {
    errorType: error.type,
    field: 'customer tone',
    providedValue: 'invalid_tone'
  });
  
  const errorResponse = createErrorResponse(
    error.type,
    error.message,
    error.details,
    requestId2
  );
  
  console.log(`❌ Validation Error Response:`, JSON.stringify(errorResponse, null, 2));
}
console.log();

// Demo 3: Critical error with full context
console.log('3. 🚨 Critical Error with Context Logging');
const requestId3 = generateRequestId();
const logger3 = createContextLogger(requestId3, 'demo-user', '/api/triage-report');

try {
  // Simulate database error
  throw new APIError(
    ErrorTypes.DATABASE_ERROR,
    'Failed to connect to database',
    { host: 'db.example.com', timeout: '5000ms' },
    new Error('Connection timeout')
  );
} catch (error) {
  logger3.error('Critical database error occurred', error, {
    endpoint: '/api/triage-report',
    operation: 'INSERT',
    table: 'reports',
    severity: 'critical',
    requiresInvestigation: true
  });
  
  const errorResponse = createErrorResponse(
    error.type,
    error.message,
    null, // No details in production
    requestId3
  );
  
  console.log(`🆘 Critical Error Response:`, JSON.stringify(errorResponse, null, 2));
}
console.log();

// Demo 4: Request correlation example
console.log('4. 🔗 Request Correlation Tracking');
console.log('Simulating multiple related operations with same request ID...');

const requestId4 = generateRequestId();
const logger4 = createContextLogger(requestId4, 'demo-user', '/api/triage-report');

logger4.info('Step 1: Validating input data');
logger4.debug('Input validation passed', { fields: ['customerName', 'ticketSubject'] });
logger4.info('Step 2: Processing with AI engine');
logger4.debug('AI processing completed', { confidence: '92%', priority: 'high' });
logger4.info('Step 3: Saving to database');
logger4.info('Request completed successfully');

console.log(`🔗 All operations tracked with Request ID: ${requestId4}\n`);

// Demo 5: Different log levels
console.log('5. 📊 Log Level Examples');
const requestId5 = generateRequestId();
const logger5 = createContextLogger(requestId5, 'demo-user', '/api/health-check');

logger5.debug('Detailed debugging information (dev only)');
logger5.info('General information about operation');
logger5.warn('Warning about degraded performance');
logger5.error('Error that needs attention', new Error('Sample error'));

console.log('\n' + '='.repeat(60));
console.log('🎉 Demo completed!');
console.log('\nKey Features Demonstrated:');
console.log('✅ Structured logging with Winston');
console.log('✅ Request correlation with UUIDs');
console.log('✅ Standardized error responses');
console.log('✅ Context-aware logging');
console.log('✅ Security-first error handling');
console.log('✅ Multiple log levels');
console.log('✅ Critical error tracking');
console.log('\n📚 See docs/ERROR_HANDLING_AND_LOGGING.md for complete documentation.');