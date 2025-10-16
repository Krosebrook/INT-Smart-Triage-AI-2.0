# API Reference Documentation

## Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Security Headers](#security-headers)
5. [Endpoints](#endpoints)
   - [POST /api/triage-report](#post-apitriage-report)
   - [GET /api/health-check](#get-apihealth-check)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Code Examples](#code-examples)

---

## Overview

INT Smart Triage AI 2.0 provides a RESTful API for intelligent ticket triage and system health monitoring. The API is built on Vercel serverless functions with Supabase backend, implementing strict security measures including Row Level Security (RLS).

### API Characteristics

- **Protocol**: HTTPS only
- **Data Format**: JSON
- **Character Encoding**: UTF-8
- **Authentication**: Service role key (server-side)
- **Security**: RLS enforcement, comprehensive headers
- **Caching**: Health endpoint cached for 10 seconds
- **Timeout**: 3 seconds for health checks, 10 seconds for triage

---

## Base URL

```
Production: https://your-domain.vercel.app/api
Development: http://localhost:3000/api
```

---

## Authentication

### Server-Side (Service Role)

API endpoints use Supabase service role keys for secure database operations. These keys bypass RLS policies for legitimate server operations.

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: Service role keys must NEVER be exposed to client-side code.

### Client-Side Authentication (Future)

Optional JWT-based authentication for CSR login functionality:

- Login endpoint (planned)
- Session management (planned)
- Role-based access control (prepared in RLS policies)

---

## Security Headers

All API responses include comprehensive security headers:

| Header                      | Value                                 | Purpose                      |
| --------------------------- | ------------------------------------- | ---------------------------- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS for 1 year       |
| `X-Content-Type-Options`    | `nosniff`                             | Prevent MIME-type sniffing   |
| `X-Frame-Options`           | `DENY`                                | Prevent clickjacking         |
| `X-XSS-Protection`          | `1; mode=block`                       | Enable XSS filter            |
| `Content-Security-Policy`   | `default-src 'self'`                  | Restrict content sources     |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`     | Control referrer information |

---

## Endpoints

### POST /api/triage-report

**Description**: Process a customer support ticket and automatically determine priority, routing, and response approach using AI analysis.

**Location**: `api/triage-report.js:155`

#### Request

**Method**: `POST`

**Headers**:

```http
Content-Type: application/json
User-Agent: YourApp/1.0
X-Session-ID: optional-session-identifier
```

**Body Parameters**:

| Parameter          | Type              | Required | Max Length | Description                |
| ------------------ | ----------------- | -------- | ---------- | -------------------------- |
| `customerName`     | string            | Yes      | 100 chars  | Customer's full name       |
| `ticketSubject`    | string            | Yes      | 200 chars  | Ticket subject/title       |
| `issueDescription` | string            | Yes      | 2000 chars | Detailed issue description |
| `customerTone`     | string            | Yes      | -          | Customer's emotional tone  |
| `csrAgent`         | string            | No       | 50 chars   | Assigned CSR agent name    |
| `timestamp`        | string (ISO 8601) | No       | -          | Ticket creation timestamp  |

**Valid Customer Tones**:

- `calm` - Neutral, patient tone
- `frustrated` - Showing signs of frustration
- `angry` - Upset or angry customer
- `confused` - Customer needs guidance
- `urgent` - Time-sensitive request

**Example Request**:

```json
POST /api/triage-report
Content-Type: application/json

{
  "customerName": "John Smith",
  "ticketSubject": "Website login not working",
  "issueDescription": "I've been trying to log in to my account for the past hour but keep getting an error message saying 'Invalid credentials' even though I know my password is correct. This is urgent as I need to access my dashboard for an important client meeting.",
  "customerTone": "frustrated",
  "csrAgent": "Sarah Johnson",
  "timestamp": "2025-10-16T14:30:00Z"
}
```

#### Response

**Success Response** (HTTP 200):

```json
{
  "success": true,
  "reportId": "TR-1697456789123-A1B2C3D4",
  "timestamp": "2025-10-16T14:30:00.000Z",
  "priority": "high",
  "confidence": "90%",
  "responseApproach": "Empathetic response with clear action plan and frequent updates.",
  "talkingPoints": [
    "Acknowledge their frustration and validate their concerns",
    "Provide clear timeline with milestone updates",
    "Offer alternative solutions where possible",
    "Ensure direct contact for follow-up"
  ],
  "knowledgeBase": [
    "KB-AUTH-01: Authentication Issues Resolution",
    "KB-001: General Troubleshooting Guide",
    "KB-015: Customer Communication Best Practices",
    "KB-032: Escalation Procedures and Guidelines"
  ],
  "security": {
    "rlsEnforced": true,
    "auditLogged": true,
    "serverAuthorized": true
  }
}
```

**Response Fields**:

| Field              | Type          | Description                                            |
| ------------------ | ------------- | ------------------------------------------------------ |
| `success`          | boolean       | Operation success status                               |
| `reportId`         | string        | Unique report identifier (format: TR-timestamp-random) |
| `timestamp`        | string        | Server processing timestamp (ISO 8601)                 |
| `priority`         | string        | Ticket priority: `low`, `medium`, or `high`            |
| `confidence`       | string        | AI confidence level (0-100%)                           |
| `responseApproach` | string        | Recommended response strategy                          |
| `talkingPoints`    | array[string] | Key points to address with customer                    |
| `knowledgeBase`    | array[string] | Relevant KB article IDs                                |
| `security`         | object        | Security verification details                          |

#### Priority Determination Logic

The API analyzes ticket content and customer tone to determine priority:

**High Priority Triggers** (90% confidence):

- Keywords: down, outage, critical, urgent, broken, not working, crashed
- Customer tone: angry, urgent
- Response time: Immediate (< 2 hours)

**Medium Priority** (80% confidence):

- Keywords: slow, issue, problem, error, bug
- Customer tone: frustrated, confused
- Response time: Same day (< 8 hours)

**Low Priority** (85% confidence):

- Keywords: question, help, how to, feature, enhancement
- Customer tone: calm
- Response time: Next business day (< 24 hours)

#### Response Approach by Customer Tone

| Tone           | Approach             | Key Actions                                                |
| -------------- | -------------------- | ---------------------------------------------------------- |
| **Angry**      | De-escalation        | Apologize, take ownership, offer compensation              |
| **Frustrated** | Clear action plan    | Validate concerns, provide timeline, offer alternatives    |
| **Confused**   | Educational          | Step-by-step guidance, non-technical language, visual aids |
| **Urgent**     | Immediate escalation | Acknowledge urgency, escalate to tech team, direct contact |
| **Calm**       | Standard empathetic  | Technical focus, realistic timeline, clear steps           |

#### Knowledge Base Suggestions

The API automatically suggests relevant KB articles based on issue type:

| Issue Keywords                  | Suggested Articles                           |
| ------------------------------- | -------------------------------------------- |
| login, password, authentication | KB-AUTH-01: Authentication Issues Resolution |
| slow, performance, lag          | KB-PERF-01: Performance Optimization Guide   |
| payment, billing, invoice       | KB-BILL-01: Billing and Payment Support      |
| All tickets                     | KB-001, KB-015, KB-032 (default articles)    |

#### Error Responses

**Validation Error** (HTTP 400):

```json
{
  "error": "Validation Error",
  "message": "Missing required fields: customerName, ticketSubject, issueDescription, customerTone"
}
```

**Invalid Tone** (HTTP 400):

```json
{
  "error": "Validation Error",
  "message": "Invalid customer tone. Must be one of: calm, frustrated, angry, confused, urgent"
}
```

**Method Not Allowed** (HTTP 405):

```json
{
  "error": "Method Not Allowed",
  "message": "Only POST requests are allowed"
}
```

**Service Configuration Error** (HTTP 500):

```json
{
  "error": "Service Configuration Error",
  "message": "Database service not properly configured"
}
```

**Internal Server Error** (HTTP 500):

```json
{
  "error": "Internal Server Error",
  "message": "Failed to process triage request",
  "reportId": null,
  "timestamp": "2025-10-16T14:30:00.000Z",
  "details": "Contact system administrator"
}
```

Note: In development mode (`NODE_ENV=development`), the `details` field contains the actual error message for debugging.

#### Database Schema

Data is stored in the `reports` table with the following structure:

```sql
{
  report_id: "TR-1697456789123-A1B2C3D4",
  customer_name: "John Smith",
  ticket_subject: "Website login not working",
  issue_description: "I've been trying to log in...",
  customer_tone: "frustrated",
  priority: "high",
  confidence_score: 90.0,
  response_approach: "Empathetic response...",
  talking_points: ["Acknowledge their frustration", ...],
  knowledge_base_articles: ["KB-AUTH-01", ...],
  csr_agent: "Sarah Johnson",
  created_at: "2025-10-16T14:30:00.000Z",
  processed_at: "2025-10-16T14:30:01.523Z",
  -- Audit fields
  ip_address: "192.168.1.100",
  user_agent: "Mozilla/5.0...",
  session_id: "optional-session-id"
}
```

#### Security Features

1. **Input Sanitization** (`api/triage-report.js:205-212`)
   - Trim whitespace
   - Enforce maximum lengths
   - Lowercase tone validation
   - Prevent XSS attacks

2. **Row Level Security (RLS)** (`api/triage-report.js:282-328`)
   - Default DENY policy blocks client access
   - Service role bypass for legitimate operations
   - Audit logging for all operations

3. **Comprehensive Audit Trail** (`api/triage-report.js:273-279`)
   - IP address tracking
   - User agent logging
   - Session ID correlation
   - Timestamp precision

4. **JSON Structure Validation** (`api/triage-report.js:228-252`)
   - Verify response object structure
   - Check all required fields
   - Validate array types
   - Prevent malformed responses

---

### GET /api/health-check

**Description**: Verify system health, database connectivity, and RLS enforcement status. Results are cached for 10 seconds to reduce database load.

**Location**: `api/health-check.js:25`

#### Request

**Method**: `GET`

**Headers**: None required

**Query Parameters**: None

**Example Request**:

```http
GET /api/health-check
```

#### Response

**Success Response** (HTTP 200):

```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T14:30:00.000Z",
  "service": "INT Smart Triage AI 2.0",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "api": "healthy",
    "database": "healthy",
    "rls": "enforced"
  },
  "security": "RLS properly enforced - public access denied",
  "cached": false
}
```

**Cached Response** (HTTP 200):

```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T14:30:00.000Z",
  "service": "INT Smart Triage AI 2.0",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "api": "healthy",
    "database": "healthy",
    "rls": "enforced"
  },
  "security": "RLS properly enforced - public access denied",
  "cached": true,
  "cacheAge": 5
}
```

**Response Fields**:

| Field             | Type          | Description                                        |
| ----------------- | ------------- | -------------------------------------------------- |
| `status`          | string        | Overall health: `healthy`, `degraded`, `unhealthy` |
| `timestamp`       | string        | Health check timestamp (ISO 8601)                  |
| `service`         | string        | Service name                                       |
| `version`         | string        | API version                                        |
| `environment`     | string        | Deployment environment                             |
| `checks`          | object        | Individual component health checks                 |
| `checks.api`      | string        | API endpoint status                                |
| `checks.database` | string        | Database connectivity status                       |
| `checks.rls`      | string        | Row Level Security status                          |
| `security`        | string        | Security verification message (optional)           |
| `warnings`        | array[string] | Warning messages (optional)                        |
| `cached`          | boolean       | Whether response is from cache                     |
| `cacheAge`        | number        | Cache age in seconds (if cached)                   |

#### Health Check Status Values

**API Check** (`checks.api`):

- `healthy` - API endpoint operational
- `error` - API endpoint error

**Database Check** (`checks.database`):

- `healthy` - Database connected and operational
- `table_missing` - Reports table doesn't exist (run setup)
- `error` - Connection error
- `not_configured` - Environment variables missing

**RLS Check** (`checks.rls`):

- `enforced` - RLS properly blocking public access (GOOD!)
- `enabled` - RLS enabled but needs verification
- `disabled` - RLS not enabled (SECURITY RISK!)
- `needs_verification` - Manual check required
- `table_missing` - Table doesn't exist
- `not_configured` - Environment variables missing
- `manual_verification_required` - RLS check function unavailable

#### Caching Behavior

**Cache Duration**: 10 seconds (`api/health-check.js:14`)

**Cache Logic** (`api/health-check.js:43-54`):

- First request: Performs full health check, caches result
- Subsequent requests: Returns cached data with `cached: true` and `cacheAge`
- After 10 seconds: Cache expires, new health check performed

**Benefits**:

- Reduces database load
- Faster response times for frequent checks
- Prevents thundering herd problem

#### Timeout Handling

**Timeout Duration**: 3 seconds (`api/health-check.js:60`)

If the health check exceeds 3 seconds, returns timeout error:

```json
{
  "status": "unhealthy",
  "timestamp": "2025-10-16T14:30:00.000Z",
  "service": "INT Smart Triage AI 2.0",
  "version": "1.0.0",
  "checks": {
    "api": "error",
    "database": "timeout",
    "rls": "unknown"
  },
  "error": {
    "message": "Health check timeout after 3 seconds",
    "timestamp": "2025-10-16T14:30:03.000Z"
  }
}
```

#### Warning Messages

**Table Missing**:

```json
{
  "warnings": ["Reports table does not exist. Run database setup."],
  "checks": {
    "database": "table_missing",
    "rls": "table_missing"
  }
}
```

**RLS Verification Needed**:

```json
{
  "warnings": ["Database accessible - verify RLS is properly configured"],
  "checks": {
    "database": "healthy",
    "rls": "needs_verification"
  }
}
```

**Configuration Missing**:

```json
{
  "warnings": ["Supabase environment variables not configured"],
  "checks": {
    "database": "not_configured",
    "rls": "not_configured"
  }
}
```

#### Error Responses

**Method Not Allowed** (HTTP 405):

```json
{
  "error": "Method Not Allowed",
  "message": "Only GET requests are allowed"
}
```

**Internal Server Error** (HTTP 500):

```json
{
  "status": "unhealthy",
  "timestamp": "2025-10-16T14:30:00.000Z",
  "service": "INT Smart Triage AI 2.0",
  "version": "1.0.0",
  "checks": {
    "api": "error",
    "database": "timeout",
    "rls": "unknown"
  },
  "error": {
    "message": "Internal server error during health check",
    "timestamp": "2025-10-16T14:30:00.000Z"
  }
}
```

#### Monitoring Best Practices

1. **Uptime Monitoring**: Poll health check every 30-60 seconds
2. **Alert on Degraded Status**: Notify team if status is not `healthy`
3. **RLS Verification**: Ensure `rls: "enforced"` in production
4. **Cache Awareness**: Consider `cached` field for accurate metrics
5. **Timeout Handling**: Retry once on timeout before alerting

---

## Error Handling

### Standard Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "error": "Error Type",
  "message": "Human-readable error description",
  "timestamp": "2025-10-16T14:30:00.000Z",
  "details": "Additional context (development only)"
}
```

### HTTP Status Codes

| Code    | Meaning               | Common Causes                                 |
| ------- | --------------------- | --------------------------------------------- |
| **200** | Success               | Request processed successfully                |
| **400** | Bad Request           | Missing required fields, invalid input        |
| **405** | Method Not Allowed    | Wrong HTTP method (e.g., GET instead of POST) |
| **500** | Internal Server Error | Database error, processing failure            |
| **503** | Service Unavailable   | Database timeout, service down                |

### Error Types

#### Client Errors (4xx)

**Validation Error** (400):

- Missing required fields
- Invalid field format
- Invalid enum values
- Field exceeds maximum length

**Method Not Allowed** (405):

- Using GET on POST-only endpoint
- Using POST on GET-only endpoint

#### Server Errors (5xx)

**Service Configuration Error** (500):

- Environment variables not set
- Database credentials invalid
- Supabase client initialization failed

**Internal Server Error** (500):

- Unexpected exceptions
- Database query failures
- JSON parsing errors

**Service Unavailable** (503):

- Database timeout
- External service failure

### Error Recovery Strategies

1. **Validation Errors**: Review request format, check required fields
2. **Configuration Errors**: Verify environment variables in Vercel dashboard
3. **Database Errors**: Check Supabase project status, verify RLS policies
4. **Timeouts**: Retry with exponential backoff (max 3 attempts)
5. **Server Errors**: Check logs, contact system administrator

---

## Rate Limiting

### Current Implementation

Rate limiting is handled by Vercel's edge network:

- **Free Tier**: 100,000 requests/month
- **Pro Tier**: 1,000,000 requests/month
- **Fair Use Policy**: Automatic throttling for abuse

### Recommended Client-Side Rate Limiting

To avoid hitting limits:

```javascript
// Implement exponential backoff for retries
async function callAPIWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      if (response.status === 429) {
        // Rate limited - wait and retry
        const delay = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Future Rate Limiting (Planned)

- Per-IP rate limiting: 100 requests/minute
- Per-user rate limiting: 1000 requests/hour
- Burst allowance: 20 requests/second
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Code Examples

### JavaScript/TypeScript (Fetch API)

#### Submit Triage Report

```javascript
async function submitTriageReport(ticketData) {
  try {
    const response = await fetch(
      'https://your-domain.vercel.app/api/triage-report',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': generateSessionId(), // Optional
        },
        body: JSON.stringify({
          customerName: ticketData.name,
          ticketSubject: ticketData.subject,
          issueDescription: ticketData.description,
          customerTone: ticketData.tone, // calm|frustrated|angry|confused|urgent
          csrAgent: ticketData.assignedTo, // Optional
          timestamp: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Report created:', result.reportId);
    console.log('Priority:', result.priority);
    console.log('Confidence:', result.confidence);
    console.log('Talking Points:', result.talkingPoints);

    return result;
  } catch (error) {
    console.error('Failed to submit triage report:', error);
    throw error;
  }
}

// Example usage
const ticket = {
  name: 'Jane Doe',
  subject: 'Cannot access my account',
  description:
    'I have been locked out of my account after multiple failed login attempts.',
  tone: 'frustrated',
  assignedTo: 'Sarah Johnson',
};

const report = await submitTriageReport(ticket);
```

#### Check System Health

```javascript
async function checkSystemHealth() {
  try {
    const response = await fetch(
      'https://your-domain.vercel.app/api/health-check'
    );

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    const health = await response.json();

    console.log('System Status:', health.status);
    console.log('Database:', health.checks.database);
    console.log('RLS Status:', health.checks.rls);
    console.log('Cached:', health.cached);

    if (health.status !== 'healthy') {
      console.warn('System degraded:', health.warnings);
    }

    return health;
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}

// Poll health every 30 seconds
setInterval(async () => {
  const health = await checkSystemHealth();
  updateStatusIndicator(health.status);
}, 30000);
```

### cURL Examples

#### Submit Triage Report

```bash
curl -X POST https://your-domain.vercel.app/api/triage-report \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: session-12345" \
  -d '{
    "customerName": "John Smith",
    "ticketSubject": "Website down",
    "issueDescription": "The website has been down for the past 30 minutes. This is affecting our business operations.",
    "customerTone": "urgent",
    "csrAgent": "Sarah Johnson",
    "timestamp": "2025-10-16T14:30:00Z"
  }'
```

#### Check System Health

```bash
curl -X GET https://your-domain.vercel.app/api/health-check
```

### Python (Requests Library)

#### Submit Triage Report

```python
import requests
from datetime import datetime

def submit_triage_report(ticket_data):
    url = "https://your-domain.vercel.app/api/triage-report"

    payload = {
        "customerName": ticket_data["name"],
        "ticketSubject": ticket_data["subject"],
        "issueDescription": ticket_data["description"],
        "customerTone": ticket_data["tone"],
        "csrAgent": ticket_data.get("assigned_to"),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    headers = {
        "Content-Type": "application/json",
        "X-Session-ID": generate_session_id()  # Optional
    }

    response = requests.post(url, json=payload, headers=headers)

    if response.status_code == 200:
        result = response.json()
        print(f"Report created: {result['reportId']}")
        print(f"Priority: {result['priority']}")
        print(f"Confidence: {result['confidence']}")
        return result
    else:
        error = response.json()
        raise Exception(f"API Error: {error['message']}")

# Example usage
ticket = {
    "name": "Jane Doe",
    "subject": "Billing issue",
    "description": "I was charged twice for my subscription this month.",
    "tone": "frustrated",
    "assigned_to": "Mike Chen"
}

report = submit_triage_report(ticket)
```

#### Check System Health

```python
import requests
import time

def check_health():
    url = "https://your-domain.vercel.app/api/health-check"

    try:
        response = requests.get(url, timeout=5)
        health = response.json()

        print(f"Status: {health['status']}")
        print(f"Database: {health['checks']['database']}")
        print(f"RLS: {health['checks']['rls']}")
        print(f"Cached: {health.get('cached', False)}")

        return health
    except requests.exceptions.Timeout:
        print("Health check timeout")
        return {"status": "timeout"}
    except Exception as e:
        print(f"Health check error: {e}")
        return {"status": "error"}

# Monitor health
while True:
    health = check_health()
    if health["status"] != "healthy":
        send_alert(f"System degraded: {health.get('warnings')}")
    time.sleep(30)  # Check every 30 seconds
```

---

## API Changelog

### Version 1.0.0 (2025-10-16)

- Initial API release
- POST /api/triage-report endpoint
- GET /api/health-check endpoint
- Row Level Security (RLS) enforcement
- Comprehensive audit logging
- 10-second health check caching
- Security headers on all responses

### Planned Enhancements

- **v1.1.0**: Rate limiting headers
- **v1.2.0**: JWT authentication for CSR login
- **v1.3.0**: WebSocket real-time notifications
- **v2.0.0**: GraphQL API support

---

## Support

### API Issues

- GitHub Issues: https://github.com/your-org/int-smart-triage/issues
- Email: api-support@your-domain.com

### Status Page

- System Status: https://status.your-domain.com
- Incident History: https://status.your-domain.com/history

### Documentation

- Architecture: `/docs/ARCHITECTURE.md`
- Service Modules: `/docs/SERVICES.md`
- Data Models: `/docs/DATA_MODELS.md`

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-16
**API Version**: v1
**Maintained By**: API Team
