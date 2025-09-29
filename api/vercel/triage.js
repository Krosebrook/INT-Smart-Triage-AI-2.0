// Vercel Serverless Function for Triage API
import { processTriage } from '../triage.js';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Rate limiting (simple in-memory store for demo)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute

function isRateLimited(ip) {
  const now = Date.now();
  const key = `${ip}-${Math.floor(now / RATE_LIMIT_WINDOW)}`;
  
  const count = requestCounts.get(key) || 0;
  requestCounts.set(key, count + 1);
  
  // Clean up old entries
  for (const [k] of requestCounts) {
    const windowStart = parseInt(k.split('-')[1]) * RATE_LIMIT_WINDOW;
    if (now - windowStart > RATE_LIMIT_WINDOW * 2) {
      requestCounts.delete(k);
    }
  }
  
  return count >= RATE_LIMIT_MAX_REQUESTS;
}

export default async function handler(req, res) {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests for triage
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST to submit triage requests.',
      allowed_methods: ['POST']
    });
  }

  try {
    // Rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    if (isRateLimited(clientIP)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait before making more requests.',
        retry_after: 60
      });
    }

    // Validate request body
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: 'Request body is required',
        expected_fields: ['ticket', 'domain', 'persona']
      });
    }

    const { ticket, domain, persona } = req.body;

    // Input validation
    if (!ticket || typeof ticket !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid ticket content',
        details: 'Ticket must be a non-empty string'
      });
    }

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid domain',
        valid_domains: ['technical', 'billing', 'general', 'sales']
      });
    }

    if (!persona || !persona.id) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid persona',
        details: 'Persona object with id field is required'
      });
    }

    // Content length validation
    if (ticket.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Ticket content too short',
        details: 'Minimum 10 characters required'
      });
    }

    if (ticket.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Ticket content too long',
        details: 'Maximum 5000 characters allowed'
      });
    }

    // Process the triage request
    const result = await processTriage({
      ticket: ticket.trim(),
      domain,
      persona,
      metadata: {
        timestamp: new Date().toISOString(),
        client_ip: clientIP,
        user_agent: req.headers['user-agent'] || 'unknown',
        request_id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    });

    // Add API metadata
    result.api_metadata = {
      version: '2.0',
      processed_at: new Date().toISOString(),
      request_id: result.metadata?.request_id,
      environment: process.env.NODE_ENV || 'development'
    };

    // Log successful request (in production, this would go to a proper logging service)
    console.log(`[TRIAGE] ${result.ticket_id} - ${result.priority} priority ${result.category} processed in ${result.processing_metrics.processing_time_ms}ms`); // eslint-disable-line no-console

    return res.status(200).json(result);

  } catch (error) {
    console.error('Triage API error:', error); // eslint-disable-line no-console

    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: isDevelopment ? error.message : 'An error occurred while processing your request',
      details: isDevelopment ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}

// Export for testing
export { isRateLimited };