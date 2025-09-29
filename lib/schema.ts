import { z } from 'zod';

/**
 * Zod schema for AI Triage response validation
 * Defines the exact structure expected from LLM output
 */
export const TriageResponseSchema = z.object({
  recommended_routing: z.string(),
  kb_suggestion: z.string(),
  actionable_talking_points: z.array(z.string()),
  management_summary: z.string(),
  upsell_opportunity: z.enum(['Yes', 'No']),
  upsell_reason: z.string(),
});

export type TriageResponse = z.infer<typeof TriageResponseSchema>;

/**
 * Conservative default values used when LLM output fails validation
 */
export const DEFAULT_TRIAGE_RESPONSE: TriageResponse = {
  recommended_routing: 'General Support',
  kb_suggestion: 'No specific knowledge base article found. Please consult general documentation.',
  actionable_talking_points: [
    'Thank you for contacting our support team.',
    'We will review your request carefully.',
    'Please provide any additional details that might help us assist you better.',
  ],
  management_summary: 'Customer inquiry received. Standard triage applied due to processing limitations.',
  upsell_opportunity: 'No',
  upsell_reason: 'Insufficient information to determine upsell opportunities.',
};

/**
 * Validates LLM output and provides fallback to conservative defaults
 * @param llmOutput - Raw output from the LLM that needs validation
 * @returns Valid TriageResponse object
 */
export function validateTriageResponse(llmOutput: unknown): TriageResponse {
  try {
    // First, try to parse the LLM output
    let parsedOutput: unknown;
    
    if (typeof llmOutput === 'string') {
      try {
        parsedOutput = JSON.parse(llmOutput);
      } catch (parseError) {
        console.error('[SCHEMA_VALIDATION] JSON parsing failed:', {
          error: 'Invalid JSON format',
          // Redacted: actual content not logged for security
          contentLength: llmOutput.length,
        });
        return DEFAULT_TRIAGE_RESPONSE;
      }
    } else {
      parsedOutput = llmOutput;
    }

    // Validate against schema
    const validatedResponse = TriageResponseSchema.parse(parsedOutput);
    return validatedResponse;

  } catch (validationError) {
    // Log validation errors (redacted for security)
    if (validationError instanceof z.ZodError) {
      console.error('[SCHEMA_VALIDATION] Validation failed:', {
        error: 'Schema validation failed',
        issues: validationError.issues.map(issue => ({
          path: issue.path.join('.'),
          code: issue.code,
          message: issue.message,
        })),
        // Redacted: actual LLM output not logged for security
        inputType: typeof llmOutput,
      });
    } else {
      console.error('[SCHEMA_VALIDATION] Unexpected validation error:', {
        error: 'Unknown validation error',
        errorType: validationError?.constructor?.name || 'Unknown',
        // Redacted: actual error details not logged for security
      });
    }

    // Return conservative defaults on any validation failure
    return DEFAULT_TRIAGE_RESPONSE;
  }
}

/**
 * Validates that a value is a valid upsell opportunity
 * @param value - Value to validate
 * @returns true if valid, false otherwise
 */
export function isValidUpsellOpportunity(value: unknown): value is 'Yes' | 'No' {
  return value === 'Yes' || value === 'No';
}

/**
 * Validates that talking points array is valid
 * @param value - Value to validate
 * @returns true if valid, false otherwise
 */
export function isValidTalkingPoints(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}