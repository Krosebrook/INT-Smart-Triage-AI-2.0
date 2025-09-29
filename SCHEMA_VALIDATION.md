# JSON Schema Validation and Fallback System

This system provides robust JSON schema validation for LLM outputs with automatic fallback to conservative defaults, ensuring that the application never returns malformed data.

## Overview

The schema validation system uses [Zod](https://zod.dev/) to validate LLM responses and automatically provides safe fallback values when validation fails. All validation errors are logged (with redacted content for security) while ensuring the system continues to function reliably.

## Schema Structure

The system validates responses against this exact structure:

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

## Usage

### Basic Usage

```typescript
import { validateTriageResponse } from './lib/schema';

// Example 1: Valid LLM output
const llmOutput = {
  recommended_routing: "Technical Support",
  kb_suggestion: "Check troubleshooting guide KB-001",
  actionable_talking_points: [
    "Thank you for contacting support",
    "Let me help you resolve this issue"
  ],
  management_summary: "Customer experiencing connectivity issues",
  upsell_opportunity: "Yes",
  upsell_reason: "Customer could benefit from premium support"
};

const validatedResponse = validateTriageResponse(llmOutput);
// Returns the validated response object
```

### Handling Malformed Input

```typescript
// Example 2: Malformed JSON string
const malformedJson = '{"recommended_routing": "Support", invalid_json...}';
const response = validateTriageResponse(malformedJson);
// Returns DEFAULT_TRIAGE_RESPONSE with conservative defaults

// Example 3: Missing fields
const incompleteOutput = {
  recommended_routing: "Support"
  // Missing other required fields
};
const response = validateTriageResponse(incompleteOutput);
// Returns DEFAULT_TRIAGE_RESPONSE with conservative defaults
```

## Conservative Default Values

When validation fails, the system returns these safe defaults:

```typescript
{
  recommended_routing: "General Support",
  kb_suggestion: "No specific knowledge base article found. Please consult general documentation.",
  actionable_talking_points: [
    "Thank you for contacting our support team.",
    "We will review your request carefully.",
    "Please provide any additional details that might help us assist you better."
  ],
  management_summary: "Customer inquiry received. Standard triage applied due to processing limitations.",
  upsell_opportunity: "No",
  upsell_reason: "Insufficient information to determine upsell opportunities."
}
```

## Error Logging

Validation errors are automatically logged with redacted content for security:

```typescript
// JSON parsing errors
[SCHEMA_VALIDATION] JSON parsing failed: {
  error: 'Invalid JSON format',
  contentLength: 59  // Only length is logged, not content
}

// Schema validation errors
[SCHEMA_VALIDATION] Validation failed: {
  error: 'Schema validation failed',
  issues: [
    {
      path: 'upsell_opportunity',
      code: 'invalid_enum_value',
      message: "Invalid enum value. Expected 'Yes' | 'No', received 'Maybe'"
    }
  ],
  inputType: 'object'  // Only type is logged, not actual content
}
```

## API Reference

### `validateTriageResponse(llmOutput: unknown): TriageResponse`

**Purpose**: Validates LLM output and provides fallback to conservative defaults.

**Parameters**:
- `llmOutput` - Raw output from the LLM (can be string, object, or any type)

**Returns**: 
- Always returns a valid `TriageResponse` object
- Returns validated input if valid
- Returns `DEFAULT_TRIAGE_RESPONSE` if validation fails

**Behavior**:
- Automatically parses JSON strings
- Validates against strict schema
- Logs validation errors (redacted for security)
- Never throws exceptions
- Always returns valid response shape

### `TriageResponseSchema`

Zod schema object for manual validation if needed.

### `DEFAULT_TRIAGE_RESPONSE`

Conservative default values used as fallback.

### Helper Functions

#### `isValidUpsellOpportunity(value: unknown): value is 'Yes' | 'No'`
Type guard for upsell opportunity validation.

#### `isValidTalkingPoints(value: unknown): value is string[]`
Type guard for talking points array validation.

## Integration Examples

### Vercel Serverless Function

```typescript
import { validateTriageResponse } from '../lib/schema';

export default function handler(req, res) {
  // Get LLM response
  const llmResponse = await callLLMService(req.body);
  
  // Always get valid response, even if LLM output is malformed
  const validatedResponse = validateTriageResponse(llmResponse);
  
  // Safe to use - guaranteed valid structure
  res.status(200).json(validatedResponse);
}
```

### With Error Monitoring

```typescript
import { validateTriageResponse } from '../lib/schema';

function processTriageRequest(userInput: string) {
  const llmOutput = await getLLMResponse(userInput);
  
  // Validation with monitoring
  const validatedResponse = validateTriageResponse(llmOutput);
  
  // Check if we got defaults (indicates LLM failure)
  const usedDefaults = JSON.stringify(validatedResponse) === JSON.stringify(DEFAULT_TRIAGE_RESPONSE);
  
  if (usedDefaults) {
    // Optional: Additional monitoring/alerting
    console.warn('LLM output validation failed, using defaults');
  }
  
  return validatedResponse;
}
```

## Testing

The system includes comprehensive unit tests that verify:

- ✅ Valid LLM output passes through unchanged
- ✅ JSON string inputs are parsed and validated
- ✅ Malformed JSON returns defaults
- ✅ Missing fields return defaults
- ✅ Incorrect field types return defaults
- ✅ Invalid enum values return defaults
- ✅ Edge cases (null, undefined, arrays, primitives) return defaults
- ✅ Conservative defaults are always valid
- ✅ Error logging works correctly (redacted)

Run tests with:
```bash
npm test
```

## Security Features

1. **Content Redaction**: Actual LLM output content is never logged, only metadata
2. **Input Sanitization**: All inputs are validated before processing
3. **Safe Defaults**: Conservative fallback values ensure no sensitive operations
4. **No Exceptions**: System never crashes due to malformed input
5. **Type Safety**: Full TypeScript support with strict typing

## Performance

- **Fast Validation**: Zod provides efficient schema validation
- **Minimal Overhead**: Only validates when needed
- **No External Dependencies**: Self-contained validation logic
- **Memory Efficient**: Conservative defaults are pre-defined constants