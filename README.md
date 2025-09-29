# INT-Smart-Triage-AI-2.0

Secure, production-ready AI Triage Tool for INT Inc. Client Success. It instantly triages client tickets, provides CSRs with empathetic talking points, suggests Knowledge Base articles, and securely logs all activity to Supabase using Vercel Serverless Functions. This system ensures low response times, data persistence, and full security

## Features

✅ **Robust Schema Validation**: Strict JSON schema validation with Zod ensures LLM outputs never cause system failures  
✅ **Automatic Fallback**: Conservative defaults are applied when LLM output is malformed  
✅ **Security-First Logging**: Validation errors are logged with redacted content for privacy  
✅ **Type Safety**: Full TypeScript support with strict typing  
✅ **Never Fails**: System continues to operate even with completely invalid inputs  

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# See the validation system in action
node examples/demo.js
```

## Schema Validation System

This project implements a robust JSON schema validation system that ensures reliable operation even when LLM outputs are malformed or invalid. The system validates all responses against this structure:

```typescript
{
  recommended_routing: string,
  kb_suggestion: string,
  actionable_talking_points: string[],
  management_summary: string,
  upsell_opportunity: "Yes" | "No",
  upsell_reason: string
}
```

When validation fails, the system automatically returns conservative defaults instead of crashing. See [SCHEMA_VALIDATION.md](./SCHEMA_VALIDATION.md) for complete documentation.
