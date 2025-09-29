/**
 * Simple test server to demonstrate security features
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON with size limit
app.use(express.json({ limit: '50mb' }));

// Import API handlers
const triageHandler = require('./api/triage');
const healthHandler = require('./api/health');

// Route handlers
app.all('/api/triage', triageHandler);
app.all('/api/health', healthHandler);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'INT Smart Triage AI 2.0 - Security Hardened',
    endpoints: {
      health: '/api/health',
      triage: '/api/triage'
    },
    security: {
      rateLimit: '5 req/s per IP',
      bodyLimit: '32 KB',
      headers: ['CSP', 'X-Content-Type-Options', 'X-Frame-Options', 'X-XSS-Protection']
    },
    testing: {
      manual: 'node test-security.js',
      automated: 'npm test'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Triage API: http://localhost:${PORT}/api/triage`);
  console.log(`🧪 Run security tests: node test-security.js`);
});

module.exports = app;