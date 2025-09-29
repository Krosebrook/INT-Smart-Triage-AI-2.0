/**
 * Security Middleware for INT Smart Triage AI 2.0
 * 
 * This middleware implements security hardening measures including:
 * - IP-based rate limiting (5 requests per second per IP)
 * - Request body size limiting (32 KB maximum)
 * - Security headers (CSP, X-Content-Type-Options, X-Frame-Options)
 * 
 * Addresses OWASP API Security Top 10:
 * - API4:2023 Unrestricted Resource Consumption
 * - API8:2023 Security Misconfiguration
 * - API10:2023 Unsafe Consumption of APIs
 */

// In-memory rate limiting storage
const rateLimitStorage = new Map();

/**
 * Clean up old rate limit entries (older than 1 second)
 */
function cleanupRateLimit() {
  const now = Date.now();
  for (const [ip, data] of rateLimitStorage.entries()) {
    if (now - data.windowStart > 1000) {
      rateLimitStorage.delete(ip);
    }
  }
}

/**
 * Check if IP is within rate limit (5 requests per second)
 * @param {string} ip - Client IP address
 * @returns {boolean} - True if within limit, false if exceeded
 */
function checkRateLimit(ip) {
  const now = Date.now();
  
  // Clean up old entries periodically
  if (Math.random() < 0.1) {
    cleanupRateLimit();
  }
  
  if (!rateLimitStorage.has(ip)) {
    rateLimitStorage.set(ip, {
      count: 1,
      windowStart: now
    });
    return true;
  }
  
  const data = rateLimitStorage.get(ip);
  
  // Reset window if more than 1 second has passed
  if (now - data.windowStart > 1000) {
    data.count = 1;
    data.windowStart = now;
    return true;
  }
  
  // Increment counter
  data.count++;
  
  // Check if limit exceeded (5 requests per second)
  return data.count <= 5;
}

/**
 * Get client IP address from request
 * @param {Object} req - Request object
 * @returns {string} - Client IP address
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         '127.0.0.1';
}

/**
 * Check request body size limit (32 KB)
 * @param {Object} req - Request object
 * @returns {boolean} - True if within limit, false if exceeded
 */
function checkBodySizeLimit(req) {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 32 * 1024; // 32 KB
  return contentLength <= maxSize;
}

/**
 * Set security headers on response
 * @param {Object} res - Response object
 */
function setSecurityHeaders(res) {
  // Content Security Policy - Restrict resource loading
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self'; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent page from being embedded in frames/iframes
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Additional security headers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

/**
 * Security middleware wrapper for Vercel serverless functions
 * @param {Function} handler - The actual API handler function
 * @returns {Function} - Wrapped handler with security checks
 */
function withSecurity(handler) {
  return async (req, res) => {
    try {
      // Set security headers
      setSecurityHeaders(res);
      
      // Check request body size limit
      if (!checkBodySizeLimit(req)) {
        res.status(413).json({
          error: 'Payload Too Large',
          message: 'Request body exceeds 32 KB limit',
          code: 413
        });
        return;
      }
      
      // Check rate limiting
      const clientIP = getClientIP(req);
      if (!checkRateLimit(clientIP)) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Maximum 5 requests per second per IP.',
          code: 429,
          retryAfter: 1
        });
        return;
      }
      
      // Call the original handler
      return await handler(req, res);
      
    } catch (error) {
      console.error('Security middleware error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        code: 500
      });
    }
  };
}

module.exports = {
  withSecurity,
  checkRateLimit,
  checkBodySizeLimit,
  setSecurityHeaders,
  getClientIP,
  // Export for testing
  __rateLimitStorage: rateLimitStorage
};