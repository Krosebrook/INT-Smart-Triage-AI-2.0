# INT-Smart-Triage-AI-2.0
Secure, production-ready AI Triage Tool for INT Inc. Client Success. It instantly triages client tickets, provides CSRs with empathetic talking points, suggests Knowledge Base articles, and securely logs all activity to Supabase using Vercel Serverless Functions. This system ensures low response times, data persistence, and full security

## Features

- **AI-Powered Triage**: Uses Google Gemini AI for intelligent analysis
- **Low Latency**: Immediate response with background audit logging
- **Structured Output**: Consistent JSON responses with severity, category, and recommendations
- **Fallback Support**: Continues working even when AI services are unavailable
- **Secure Logging**: Privacy-conscious audit trail in Supabase
- **Input Validation**: Comprehensive request validation and error handling

## Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Required environment variables:
- `GEMINI_API_KEY`: Your Google Gemini AI API key
- `SUPABASE_URL`: Your Supabase project URL  
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### 3. Test the API
```bash
# Test endpoint functionality
npm test

# Test input validation
npm run test:validation

# Test multiple scenarios
node test-scenarios.js
```

### 4. Deploy to Vercel
```bash
vercel deploy
```

## API Usage

### POST /api/triage-report
```javascript
const response = await fetch('/api/triage-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    domain: "e-commerce",
    persona: "frustrated customer", 
    inquiry: "My order is late and tracking isn't updating",
    userId: "user123"
  })
});

const result = await response.json();
console.log(result.report); // Structured triage analysis
```

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## Architecture

- **Endpoint**: Vercel serverless function
- **AI Service**: Google Gemini 1.5 Flash with structured JSON
- **Database**: Supabase for audit logging
- **Deployment**: Zero-config Vercel deployment
- **Testing**: Comprehensive validation and scenario tests

## Development

```bash
# Run tests
npm test
npm run test:validation

# Local development (requires Vercel CLI)
npm run dev
```
