/**
 * Sample Triage API endpoint with security hardening
 * Demonstrates the security middleware in action
 */

const { withSecurity } = require('../lib/security');

async function triageHandler(req, res) {
  if (req.method === 'GET') {
    // Health check endpoint
    res.status(200).json({
      message: 'INT Smart Triage AI 2.0 - Security Hardened',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      security: {
        rateLimit: '5 req/s per IP',
        bodyLimit: '32 KB',
        headers: ['CSP', 'X-Content-Type-Options', 'X-Frame-Options']
      }
    });
    return;
  }
  
  if (req.method === 'POST') {
    // Example triage endpoint
    const { ticketContent, priority } = req.body || {};
    
    if (!ticketContent) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'ticketContent is required',
        code: 400
      });
      return;
    }
    
    // Simulate AI triage processing
    const triageResult = {
      id: Math.random().toString(36).substr(2, 9),
      ticketContent,
      priority: priority || 'medium',
      suggestedResponse: 'Thank you for contacting us. We understand your concern and will address it promptly.',
      knowledgeBaseArticles: [
        { id: 'kb001', title: 'Common Issues Resolution', url: '/kb/001' },
        { id: 'kb002', title: 'Support Process Guide', url: '/kb/002' }
      ],
      processedAt: new Date().toISOString()
    };
    
    res.status(200).json({
      message: 'Ticket triaged successfully',
      data: triageResult
    });
    return;
  }
  
  // Method not allowed
  res.status(405).json({
    error: 'Method Not Allowed',
    message: `Method ${req.method} not allowed`,
    code: 405
  });
}

// Export the handler wrapped with security middleware
module.exports = withSecurity(triageHandler);