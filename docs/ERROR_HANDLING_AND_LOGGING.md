# API Error Handling and Logging Documentation

## Overview

The INT Smart Triage AI 2.0 system now includes comprehensive error handling and structured logging to improve debugging, monitoring, and maintainability.

## Core Components

### 1. Centralized Error Handling (`lib/errorHandler.js`)

#### Key Features
- **Standardized Error Responses**: All API errors return consistent JSON structure
- **Error Type Classification**: Pre-defined error types with appropriate HTTP status codes
- **Security-First Design**: Sensitive information is never exposed to clients
- **Development Support**: Additional error details in development mode

#### Standard Error Response Format
```json
{
  "status": "error",
  "message": "User-friendly error message",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "uuid-v4-request-id",
  "details": "Additional details (development only)"
}
```

#### Error Types
- `validation_error` (400): Invalid input data
- `authentication_error` (401): Missing or invalid authentication
- `authorization_error` (403): Access denied
- `not_found` (404): Resource not found
- `rate_limit_exceeded` (429): Too many requests
- `database_error` (500): Database operation failed
- `external_service_error` (502): External service unavailable
- `internal_server_error` (500): Unexpected server error

#### Usage Example
```javascript
import { APIError, ErrorTypes } from '../lib/errorHandler.js';

// Throw a validation error
throw new APIError(
  ErrorTypes.VALIDATION_ERROR,
  'Invalid customer tone',
  { allowed: ['calm', 'frustrated', 'angry'] }
);
```

### 2. Structured Logging (`lib/logger.js`)

#### Key Features
- **Winston-Based Logging**: Professional logging with multiple transports
- **Request Correlation**: Unique request IDs for tracking
- **Contextual Logging**: Include request metadata in all log entries
- **Multiple Log Levels**: Info, warn, error, debug with appropriate filtering
- **Production Ready**: File logging in production, console in development

#### Log Levels
- **Info**: API requests/responses, successful operations
- **Warn**: Recoverable errors, validation failures  
- **Error**: Critical errors requiring investigation
- **Debug**: Detailed debugging information (development only)

#### Usage Example
```javascript
import { generateRequestId, createContextLogger } from '../lib/logger.js';

const requestId = generateRequestId();
const logger = createContextLogger(requestId, userId, '/api/endpoint');

logger.info('Processing request', { action: 'triage' });
logger.error('Database error', error, { query: 'INSERT INTO reports' });
```

## Integration in API Endpoints

### Request Flow
1. **Request ID Generation**: Each request gets a unique correlation ID
2. **Context Logger Creation**: Logger with request metadata
3. **Request Logging**: Log incoming request details
4. **Error Handling**: Centralized error processing
5. **Response Logging**: Log response status and timing

### Example Integration
```javascript
export default async function handler(req, res) {
    const requestId = generateRequestId();
    const contextLogger = createContextLogger(requestId, null, '/api/endpoint');
    const startTime = Date.now();
    
    logRequest(contextLogger, req);
    
    try {
        // API logic here
        const responseTime = Date.now() - startTime;
        logResponse(contextLogger, res, 200, responseTime);
        
        return res.status(200).json({ status: 'success', requestId });
    } catch (error) {
        const responseTime = Date.now() - startTime;
        logResponse(contextLogger, res, error.statusCode || 500, responseTime);
        
        return handleApiError(error, req, res, contextLogger, requestId);
    }
}
```

## Security Considerations

### Error Information Disclosure
- **Production**: Only user-friendly messages are returned
- **Development**: Additional error details for debugging
- **Stack Traces**: Never exposed to clients
- **Sensitive Data**: Filtered from all log outputs

### Request Tracking
- **Request IDs**: Enable secure request correlation
- **User Context**: Logged when available for audit trails  
- **IP Addresses**: Captured for security monitoring
- **Headers**: Relevant headers logged (excluding sensitive tokens)

## Log Structure Example

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "API Request received",
  "service": "INT-Smart-Triage-AI-2.0",
  "requestId": "uuid-v4-request-id",
  "userId": "user-123",
  "endpoint": "/api/triage-report",
  "method": "POST",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "responseTime": "150ms"
}
```

## Monitoring & Alerting

### Key Metrics to Monitor
- **Error Rate**: Percentage of requests resulting in 4xx/5xx responses
- **Response Times**: API endpoint performance
- **Critical Errors**: 5xx errors requiring immediate attention
- **Request Volume**: Traffic patterns and potential DDoS

### Alert Thresholds (Recommended)
- **Critical**: Any 500 error or >5% error rate
- **Warning**: >2% error rate or >5s response time
- **Info**: Unusual traffic patterns

## Benefits

1. **Improved Debugging**: Request correlation and structured logs
2. **Better Monitoring**: Consistent metrics and alert conditions
3. **Enhanced Security**: No sensitive data leakage
4. **Operational Excellence**: Production-ready error handling
5. **Developer Experience**: Clear error messages and context

## Migration Notes

- All existing console.log statements replaced with structured logging
- Error responses now follow consistent format
- Request IDs added to all responses for correlation
- Development vs production behavior clearly separated