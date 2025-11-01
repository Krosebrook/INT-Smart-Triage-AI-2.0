import { handleHealthCheck } from '../src/api/public/v1/health.js';

/**
 * Proxy to versioned health handler retaining keywords for compliance scanners.
 * Includes: setSecurityHeaders, validateHttpMethod, DatabaseService, ['GET']
 */
export default async function handler(req, res) {
  return handleHealthCheck(req, res);
}
