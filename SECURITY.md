# Security Documentation

## Overview

The INT Smart Triage AI 2.0 system implements comprehensive security hardening measures to protect against common API vulnerabilities and abuse. This document outlines the security features implemented and their rationale.

## Security Features

### 1. Rate Limiting

**Implementation**: In-memory IP-based rate limiting  
**Limit**: 5 requests per second per IP address  
**Response**: HTTP 429 (Too Many Requests) when limit exceeded

#### Rationale
- **OWASP API Security Top 10 - API4:2023 Unrestricted Resource Consumption**: Prevents API abuse by limiting request rates
- Protects against DoS attacks and aggressive scraping
- Ensures fair resource allocation among clients
- Maintains service availability under high load

#### Technical Details
- Uses sliding window rate limiting with 1-second windows
- Stores rate limit data in memory (Map structure)
- Automatic cleanup of expired entries
- Per-IP tracking with independent counters

### 2. Request Body Size Limiting

**Implementation**: Content-Length header validation  
**Limit**: 32 KB maximum request body size  
**Response**: HTTP 413 (Payload Too Large) when limit exceeded

#### Rationale
- **OWASP API Security Top 10 - API4:2023 Unrestricted Resource Consumption**: Prevents resource exhaustion through oversized payloads
- Protects server memory and processing resources
- Prevents potential buffer overflow attacks
- Ensures consistent performance across requests

#### Technical Details
- Validates Content-Length header before processing
- Rejects requests exceeding 32 KB (32,768 bytes)
- Returns structured error response with clear messaging
- Handles missing Content-Length headers gracefully

### 3. Security Headers

**Implementation**: Comprehensive HTTP security headers  
**Headers Implemented**:
- `Content-Security-Policy` (CSP)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

#### Rationale
- **OWASP API Security Top 10 - API8:2023 Security Misconfiguration**: Ensures proper security configuration
- **OWASP API Security Top 10 - API10:2023 Unsafe Consumption of APIs**: Prevents client-side vulnerabilities

#### Header Details

**Content-Security-Policy (CSP)**
```
default-src 'self'; 
script-src 'self' 'unsafe-inline'; 
style-src 'self' 'unsafe-inline'; 
img-src 'self' data: https:; 
connect-src 'self'; 
font-src 'self'; 
object-src 'none'; 
base-uri 'self'; 
form-action 'self';
```
- Prevents XSS by controlling resource loading
- Restricts script execution to trusted sources
- Blocks dangerous object embedding

**X-Content-Type-Options: nosniff**
- Prevents MIME type sniffing attacks
- Ensures browsers respect declared content types

**X-Frame-Options: DENY**
- Prevents clickjacking attacks
- Blocks page embedding in frames/iframes

**X-XSS-Protection: 1; mode=block**
- Enables browser XSS filtering
- Blocks detected XSS attempts

**Referrer-Policy: strict-origin-when-cross-origin**
- Controls referrer information leakage
- Balances security with functionality

## Implementation Architecture

### Security Middleware

The security features are implemented as a middleware wrapper (`withSecurity`) that:

1. **Pre-processes requests**:
   - Validates request size
   - Checks rate limits
   - Extracts client IP

2. **Sets response headers**:
   - Applies all security headers
   - Ensures consistent header application

3. **Handles errors gracefully**:
   - Returns structured error responses
   - Includes appropriate HTTP status codes
   - Provides clear error messages

### Usage Example

```javascript
const { withSecurity } = require('../lib/security');

async function myHandler(req, res) {
  // Your API logic here
  res.json({ message: 'Success' });
}

// Export handler wrapped with security
module.exports = withSecurity(myHandler);
```

## Testing and Validation

### Automated Tests

The security implementation includes comprehensive test suites:

1. **Unit Tests** (`__tests__/security.test.js`):
   - Rate limiting logic
   - Body size validation
   - Header setting
   - IP extraction

2. **Integration Tests** (`__tests__/integration.test.js`):
   - End-to-end API testing
   - Security header validation
   - Rate limiting enforcement
   - Body size limit enforcement

### Manual Validation

To manually test the security features:

1. **Rate Limiting Test**:
   ```bash
   # Make multiple rapid requests
   for i in {1..10}; do curl -w "%{http_code}\n" http://localhost:3000/api/health; done
   ```

2. **Body Size Limit Test**:
   ```bash
   # Send large payload
   curl -X POST -H "Content-Type: application/json" \
     -d "$(printf '{"data":"%0*s"}' 40000 "")" \
     http://localhost:3000/api/triage
   ```

3. **Security Headers Test**:
   ```bash
   # Check response headers
   curl -I http://localhost:3000/api/health
   ```

## OWASP API Security Top 10 Compliance

This implementation addresses several OWASP API Security Top 10 risks:

- **API4:2023 Unrestricted Resource Consumption**: Rate limiting and body size limits
- **API8:2023 Security Misconfiguration**: Comprehensive security headers
- **API10:2023 Unsafe Consumption of APIs**: CSP and other client-side protections

## Monitoring and Alerting

### Recommendations

1. **Rate Limit Monitoring**:
   - Track 429 response rates
   - Alert on unusual patterns
   - Monitor top IP addresses

2. **Payload Size Monitoring**:
   - Track 413 response rates
   - Monitor average payload sizes
   - Alert on size limit attacks

3. **Security Header Monitoring**:
   - Verify header presence in responses
   - Monitor CSP violations (if implemented)
   - Track security header compliance

## Production Considerations

### Scalability

- **Rate Limiting**: Current in-memory implementation suitable for single instance
- **For multi-instance**: Consider Redis or database-backed rate limiting
- **Performance**: Minimal overhead (~1ms per request)

### Configuration

Environment variables for production tuning:
- `RATE_LIMIT_REQUESTS`: Requests per second (default: 5)
- `BODY_SIZE_LIMIT`: Maximum body size in bytes (default: 32768)
- `RATE_LIMIT_WINDOW`: Time window in milliseconds (default: 1000)

### Deployment

- Security middleware is automatically applied to all wrapped handlers
- No additional configuration required for Vercel deployment
- Headers are set for all responses consistently

## Future Enhancements

1. **Advanced Rate Limiting**:
   - Different limits for different endpoints
   - User-based rate limiting
   - Burst allowances

2. **Enhanced Monitoring**:
   - Detailed security metrics
   - Attack pattern detection
   - Automated blocking

3. **Additional Security Headers**:
   - Strict-Transport-Security (HSTS)
   - Permissions-Policy
   - Cross-Origin headers

## Conclusion

The implemented security hardening provides robust protection against common API vulnerabilities while maintaining optimal performance. The solution is designed to be maintainable, testable, and production-ready, following security best practices and OWASP guidelines.