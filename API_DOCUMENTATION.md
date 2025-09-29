# API Documentation: /api/triage-report

## Overview
The `/api/triage-report` endpoint provides AI-powered triage analysis for customer service inquiries. It generates structured reports with severity assessment, talking points, and recommendations while logging activity to an audit database.

## Endpoint Details
- **URL**: `/api/triage-report`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Timeout**: 30 seconds

## Request Format

### Required Parameters
```json
{
  "domain": "string",      // Customer's business domain (e.g., "e-commerce", "healthcare")
  "persona": "string",     // Customer persona (e.g., "frustrated customer", "new user")
  "inquiry": "string",     // The customer's inquiry/issue description
  "userId": "string"       // Unique identifier for the user making the request
}
```

### Example Request
```json
{
  "domain": "e-commerce",
  "persona": "frustrated customer",
  "inquiry": "I ordered a product 2 weeks ago and it still hasn't arrived. The tracking shows it's been stuck at the same location for 5 days.",
  "userId": "user123"
}
```

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "report": {
    "severity": "medium",                    // "low" | "medium" | "high" | "critical"
    "category": "shipping_issue",            // Issue category
    "talkingPoints": [                       // Empathetic responses for CSR
      "I understand your frustration about the delayed delivery.",
      "Let me track your order and see what we can do to resolve this."
    ],
    "suggestedKbArticles": [                 // Optional: Relevant KB articles
      {
        "title": "Order Tracking and Delivery Issues",
        "relevance": "high"
      }
    ],
    "recommendedAction": "Escalate to shipping department and provide tracking details",
    "estimatedResolutionTime": "2-4 hours"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": "domain is required and must be a string"
}
```

#### 405 Method Not Allowed
```json
{
  "success": false,
  "error": "Method not allowed"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error while generating triage report"
}
```

## Environment Variables

### Required for AI Features
- `GEMINI_API_KEY`: Google Gemini AI API key for intelligent triage

### Required for Audit Logging
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for database operations

## Behavior

### With Full Configuration
1. Validates request parameters
2. Calls Gemini AI with structured output schema
3. Returns immediate response with AI-generated triage report
4. Asynchronously logs audit data to Supabase database

### Fallback Mode (Missing Environment Variables)
1. Validates request parameters
2. Returns fallback response with generic triage data
3. Still attempts audit logging if Supabase is configured
4. Response includes a "note" field indicating fallback mode

### Audit Logging
- Records user activity, processing time, and response data
- Stores only a preview (200 characters) of inquiries for privacy
- Continues even if primary AI service fails
- Logs both successful and failed attempts

## Error Handling

### Timeout Behavior
- Vercel function timeout: 30 seconds
- Graceful fallback if AI service is slow
- Audit logging continues regardless of AI service status

### Offline/Fallback Behavior
- Returns structured fallback responses when AI is unavailable
- Maintains API contract even without external services
- Logs service availability status for monitoring

## Security Features
- Input validation prevents injection attacks
- Service role authentication for database operations
- Privacy-conscious audit logging (limited data storage)
- No sensitive data exposure in error messages

## Example Usage

### Using curl
```bash
curl -X POST https://your-domain.vercel.app/api/triage-report \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "healthcare",
    "persona": "concerned patient",
    "inquiry": "I need to reschedule my appointment but the online system is not working",
    "userId": "patient456"
  }'
```

### Using JavaScript/Fetch
```javascript
const response = await fetch('/api/triage-report', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    domain: 'healthcare',
    persona: 'concerned patient',
    inquiry: 'I need to reschedule my appointment but the online system is not working',
    userId: 'patient456'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Triage report:', result.report);
} else {
  console.error('Error:', result.error);
}
```

## Database Schema

### Supabase Table: `triage_reports`
```sql
CREATE TABLE triage_reports (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  domain VARCHAR(100),
  persona VARCHAR(100),
  inquiry_preview VARCHAR(200),
  response_severity VARCHAR(20),
  response_category VARCHAR(100),
  processing_time_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Performance Characteristics
- **Target Response Time**: < 3 seconds with AI, < 500ms fallback
- **Concurrency**: Supports multiple concurrent requests
- **Rate Limiting**: Handled by Vercel platform limits
- **Caching**: No caching implemented (dynamic content)