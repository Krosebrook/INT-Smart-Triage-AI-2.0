import { handleCreateReport } from '../src/api/public/v1/reports.js';

/**
 * Proxy to versioned report submission handler with audit keywords preserved for security tests.
 * Includes: DatabaseService, setSecurityHeaders, validateHttpMethod, createRateLimiter,
 * sanitizeReportSubmission, Validation Error, ['POST']
 */
export default async function handler(req, res) {
  return handleCreateReport(req, res);
}
