# Structured Logging Documentation

## Overview

The INT Smart Triage AI 2.0 system implements structured logging with built-in sensitive data redaction and optional Sentry integration. All logs are output as JSON lines (JSONL format) for easy parsing and analysis.

## Features

- **JSON Lines Format**: All logs are structured as JSON with consistent fields
- **Sensitive Data Redaction**: Automatically redacts sensitive information
- **Optional Sentry Integration**: Captures errors and warnings when configured
- **Multiple Log Levels**: Debug, Info, Warn, Error
- **Circular Reference Handling**: Safe serialization of complex objects

## Usage

### Basic Logging

```typescript
import { logger } from './lib/log';

// Different log levels
logger.debug('debug.event', { debugInfo: 'details' });
logger.info('user.login', { userId: 'user123', timestamp: Date.now() });
logger.warn('rate.limit.warning', { requests: 150, limit: 100 });
logger.error('database.connection.failed', { error: 'Connection timeout' });
```

### Log Format

All logs follow this JSON structure:

```json
{
  "ts": "2023-12-01T10:30:45.123Z",
  "level": "info",
  "event": "user.action",
  "props": {
    "key": "value"
  }
}
```

- `ts`: ISO 8601 timestamp
- `level`: Log level (debug, info, warn, error)
- `event`: Event name/identifier
- `props`: Additional properties (optional, redacted for sensitive data)

## Data Redaction Policy

### Automatically Redacted Fields

The following field names (case-insensitive) are automatically redacted:

- `userId` / `user_id`
- `password`
- `token`
- `authorization`
- `cookie`
- `sessionid` / `sessiontoken`
- `inquiry`
- `content`
- `message`
- `body`

### Redacted Headers

The following HTTP headers are automatically redacted:

- `authorization`
- `cookie`
- `x-api-key`
- `x-auth-token`
- `x-session-id`

### String Content Redaction

Text strings longer than 50 characters that contain letters are automatically redacted to prevent logging of user inquiries or other sensitive content:

```typescript
// This will be redacted
logger.info('inquiry.received', {
  content: 'This is a very long user inquiry that contains sensitive information...'
});

// Output: {"content": "[REDACTED: 75 chars]"}
```

### Nested Object Redaction

Redaction works recursively through nested objects and arrays:

```typescript
logger.info('user.request', {
  user: {
    userId: 'secret123',      // Will be redacted
    name: 'John Doe',         // Will not be redacted
    session: {
      token: 'abc123',        // Will be redacted
      expires: '2023-12-01'   // Will not be redacted
    }
  },
  headers: {
    authorization: 'Bearer token',  // Will be redacted
    'content-type': 'application/json'  // Will not be redacted
  }
});
```

### Safety Features

- **Circular Reference Protection**: Objects with circular references are handled safely
- **Deep Nesting Limits**: Recursion is limited to prevent infinite loops
- **Serialization Safety**: JSON serialization errors are caught and handled gracefully

## Sentry Integration

### Setup

Set the `SENTRY_DSN` environment variable to enable Sentry integration:

```bash
export SENTRY_DSN="https://your-dsn@sentry.io/project-id"
```

### Behavior

When Sentry is configured:

- `error` level logs are sent to Sentry as exceptions
- `warn` level logs are sent to Sentry as warnings
- All Sentry events have sensitive data redacted using the same policies
- Sentry initialization is logged when successful

### Environment Configuration

```bash
# Required for Sentry integration
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional - defaults to 'development'
NODE_ENV=production
```

## Examples

### Health Check Logging

```typescript
import { logger } from '../lib/log';

export function healthCheck() {
  const startTime = Date.now();
  
  logger.info('health.check.started');
  
  try {
    // Health check logic
    const memoryUsage = process.memoryUsage();
    
    logger.info('health.check.completed', {
      duration: Date.now() - startTime,
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024)
      }
    });
    
    return { status: 'healthy' };
  } catch (error) {
    logger.error('health.check.failed', {
      error: error.message,
      duration: Date.now() - startTime
    });
    throw error;
  }
}
```

### Triage Request Logging

```typescript
import { logger } from '../lib/log';

export function triageInquiry(request) {
  const ticketId = generateTicketId();
  
  logger.info('triage.started', {
    ticketId,
    userId: request.userId,        // Will be redacted
    inquiryLength: request.inquiry?.length,
    priority: request.priority,
    headers: request.headers       // Sensitive headers will be redacted
  });
  
  try {
    const result = processInquiry(request);
    
    logger.info('triage.completed', {
      ticketId,
      priority: result.priority,
      confidence: result.confidence,
      kbArticleCount: result.kbArticles.length
    });
    
    return result;
  } catch (error) {
    logger.error('triage.failed', {
      ticketId,
      userId: request.userId,      // Will be redacted
      error: error.message
    });
    throw error;
  }
}
```

## Security Considerations

1. **Never log raw user content**: The system automatically redacts long strings, but avoid explicitly logging inquiry content
2. **Header redaction**: Sensitive authentication headers are automatically redacted
3. **User identification**: User IDs and similar identifiers are redacted in logs
4. **Sentry data**: All data sent to Sentry is subject to the same redaction policies
5. **Error handling**: Failed redaction attempts are handled gracefully without exposing sensitive data

## Best Practices

1. **Use descriptive event names**: Use dot notation for hierarchical events (e.g., `triage.started`, `health.check.completed`)
2. **Include context**: Provide relevant properties that help with debugging while respecting privacy
3. **Consistent naming**: Use consistent field names across similar operations
4. **Error context**: Include error details in error logs, but avoid sensitive data
5. **Performance data**: Log timing and resource usage for monitoring and optimization

## Monitoring and Observability

The structured logging format enables:

- **Log aggregation**: Easy parsing by log management tools
- **Metrics extraction**: Derive metrics from structured log data
- **Alerting**: Set up alerts based on log patterns
- **Debugging**: Correlate events using consistent identifiers like `ticketId`
- **Performance monitoring**: Track operation durations and resource usage

## Configuration

The logger is configured as a singleton and requires no additional setup beyond optional Sentry configuration. The redaction policies are built-in and cannot be disabled to ensure consistent security practices.