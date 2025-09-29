/**
 * Health check endpoint with security hardening
 */

const { withSecurity } = require('../lib/security');

async function healthHandler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({
      error: 'Method Not Allowed',
      message: `Method ${req.method} not allowed`,
      code: 405
    });
    return;
  }
  
  res.status(200).json({
    status: 'healthy',
    service: 'INT Smart Triage AI 2.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    security: {
      rateLimiting: 'enabled',
      bodySizeLimit: '32KB',
      securityHeaders: 'enabled'
    }
  });
}

module.exports = withSecurity(healthHandler);