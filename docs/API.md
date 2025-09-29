# INT Smart Triage AI 2.0 - API Documentation

## Overview

The INT Smart Triage AI 2.0 API provides intelligent ticket triage capabilities with advanced sentiment analysis, priority scoring, and persona-based response generation.

## Base URL

- **Production**: `https://your-vercel-deployment.vercel.app/api`
- **Development**: `http://localhost:3000/api`

## Authentication

Currently, the API is public for demonstration purposes. In production, implement proper authentication using JWT tokens or API keys.

## Rate Limiting

- **Limit**: 20 requests per minute per IP address
- **Window**: 60 seconds
- **Response**: HTTP 429 when exceeded

## Endpoints

### POST /api/triage

Processes a customer support ticket and provides triage analysis.

#### Request Body

```json
{
  "ticket": "string (required, 10-5000 characters)",
  "domain": "string (required)",
  "persona": {
    "id": "string (required)"
  }
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticket` | string | Yes | The customer ticket content (10-5000 characters) |
| `domain` | string | Yes | Ticket category: `technical`, `billing`, `general`, `sales` |
| `persona.id` | string | Yes | ID of the assigned support persona |

#### Valid Domain Values

- `technical` - Technical support issues
- `billing` - Billing and payment inquiries
- `general` - General support questions
- `sales` - Sales and pre-sales inquiries

#### Valid Persona IDs

- `tech_support_lead` - Alex Thompson (Technical Support Lead)
- `billing_specialist` - Sarah Chen (Billing Specialist)
- `general_support` - Mike Rodriguez (Customer Success Representative)
- `sales_consultant` - Jennifer Walsh (Senior Sales Consultant)
- `enterprise_support` - Robert Kim (Enterprise Support Manager)

#### Response Format

```json
{
  "success": true,
  "ticket_id": "TKT-1759138572699-ABC123",
  "timestamp": "2025-09-29T09:36:12.699Z",
  "priority": "high",
  "category": "Technical Issue",
  "sentiment": "negative",
  "sentiment_confidence": 85,
  "suggested_response": "Response template text...",
  "kb_articles": [
    {
      "id": "kb001",
      "title": "API Authentication and Security",
      "category": "technical",
      "summary": "Comprehensive guide to API authentication methods",
      "url": "/kb/api-authentication-security",
      "popularity_score": 95,
      "helpful_votes": 142,
      "relevanceScore": 25.5
    }
  ],
  "persona_context": {
    "id": "tech_support_lead",
    "name": "Alex Thompson",
    "role": "Technical Support Lead",
    "department": "Technical Support"
  },
  "processing_metrics": {
    "processing_time_ms": 234,
    "word_count": 54,
    "kb_articles_matched": 3,
    "sentiment_scores": {
      "positive": 0,
      "negative": 2,
      "urgency": 3
    }
  },
  "analytics": {
    "urgency_indicators": 3,
    "business_impact_score": 40,
    "estimated_resolution_time": 2.5,
    "escalation_recommended": true
  },
  "api_metadata": {
    "version": "2.0",
    "processed_at": "2025-09-29T09:36:12.850Z",
    "request_id": "req-1759138572699-abc123def",
    "environment": "production"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the request was processed successfully |
| `ticket_id` | string | Unique identifier for the ticket |
| `timestamp` | string | ISO timestamp when ticket was processed |
| `priority` | string | Assigned priority: `low`, `medium`, `high`, `critical` |
| `category` | string | Categorized ticket type |
| `sentiment` | string | Detected sentiment: `positive`, `negative`, `neutral` |
| `sentiment_confidence` | number | Confidence score (0-100) for sentiment analysis |
| `suggested_response` | string | AI-generated response template |
| `kb_articles` | array | Relevant knowledge base articles |
| `persona_context` | object | Information about assigned support persona |
| `processing_metrics` | object | Performance and analysis metrics |
| `analytics` | object | Advanced analytics and recommendations |
| `api_metadata` | object | API version and request information |

#### Priority Levels

- **Critical**: Production outages, security issues, revenue-impacting problems
- **High**: Urgent issues affecting business operations
- **Medium**: Standard issues requiring attention
- **Low**: General inquiries, documentation requests

#### Sentiment Analysis

The API uses advanced natural language processing to analyze:
- **Positive sentiment**: Gratitude, satisfaction, politeness indicators
- **Negative sentiment**: Frustration, anger, dissatisfaction indicators
- **Urgency detection**: Time-sensitive language, emergency keywords
- **Business impact**: Revenue, customer, production-related terms

#### Knowledge Base Matching

Articles are ranked by relevance using:
- Domain category matching
- Tag-based keyword matching
- Title and content similarity
- Popularity and helpfulness scores

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Missing or invalid ticket content",
  "details": "Ticket must be a non-empty string",
  "expected_fields": ["ticket", "domain", "persona"]
}
```

### 429 Rate Limit Exceeded

```json
{
  "success": false,
  "error": "Rate limit exceeded. Please wait before making more requests.",
  "retry_after": 60
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An error occurred while processing your request",
  "timestamp": "2025-09-29T09:36:12.699Z"
}
```

## Example Usage

### cURL

```bash
curl -X POST https://your-deployment.vercel.app/api/triage \
  -H "Content-Type: application/json" \
  -d '{
    "ticket": "My API integration is failing with 401 errors. This is urgent as it affects our production system.",
    "domain": "technical",
    "persona": {
      "id": "tech_support_lead"
    }
  }'
```

### JavaScript/Node.js

```javascript
const response = await fetch('https://your-deployment.vercel.app/api/triage', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    ticket: 'My payment failed and I cannot access premium features. Please help resolve this quickly.',
    domain: 'billing',
    persona: {
      id: 'billing_specialist'
    }
  })
});

const result = await response.json();
console.log('Triage Result:', result);
```

### Python

```python
import requests

url = "https://your-deployment.vercel.app/api/triage"
payload = {
    "ticket": "I need help setting up my account and understanding the features available.",
    "domain": "general",
    "persona": {
        "id": "general_support"
    }
}

response = requests.post(url, json=payload)
result = response.json()
print("Triage Result:", result)
```

## SDK Libraries

### Node.js/JavaScript

```javascript
import { TriageClient } from '@int/triage-sdk';

const client = new TriageClient({
  baseUrl: 'https://your-deployment.vercel.app/api',
  // apiKey: 'your-api-key' // When authentication is implemented
});

const result = await client.triage({
  ticket: 'Customer ticket content...',
  domain: 'technical',
  persona: { id: 'tech_support_lead' }
});
```

## Webhooks (Future Feature)

Configure webhooks to receive real-time notifications when tickets are processed:

```json
{
  "webhook_url": "https://your-app.com/webhooks/triage",
  "events": ["ticket.processed", "ticket.escalated"],
  "secret": "your-webhook-secret"
}
```

## Best Practices

1. **Input Validation**: Always validate ticket content before sending
2. **Error Handling**: Implement proper error handling for all API responses
3. **Rate Limiting**: Respect rate limits and implement exponential backoff
4. **Caching**: Cache persona and domain data to reduce API calls
5. **Monitoring**: Monitor API response times and error rates
6. **Security**: Validate all user input and sanitize content

## Support

For API support and questions:
- **Documentation**: [Link to full documentation]
- **Email**: support@int-company.com
- **GitHub Issues**: [Repository issues page]
- **Status Page**: [API status monitoring page]