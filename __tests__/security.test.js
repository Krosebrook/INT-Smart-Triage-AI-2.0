/**
 * Security middleware tests
 * Tests for rate limiting, body size limits, and security headers
 */

const { checkRateLimit, checkBodySizeLimit, setSecurityHeaders, getClientIP } = require('../lib/security');

describe('Security Middleware', () => {
  beforeEach(() => {
    // Clear rate limit storage before each test
    const rateLimitStorage = require('../lib/security').__rateLimitStorage;
    if (rateLimitStorage) {
      rateLimitStorage.clear();
    }
  });

  describe('Rate Limiting', () => {
    test('should allow requests within rate limit', () => {
      const ip = '192.168.1.1';
      
      // First 5 requests should be allowed
      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit(ip)).toBe(true);
      }
    });

    test('should block requests exceeding rate limit', () => {
      const ip = '192.168.1.2';
      
      // First 5 requests should be allowed
      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit(ip)).toBe(true);
      }
      
      // 6th request should be blocked
      expect(checkRateLimit(ip)).toBe(false);
    });

    test('should reset rate limit after time window', async () => {
      const ip = '192.168.1.3';
      
      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip);
      }
      expect(checkRateLimit(ip)).toBe(false);
      
      // Wait for window to reset (simulate by manipulating time)
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be allowed again
      expect(checkRateLimit(ip)).toBe(true);
    });

    test('should handle multiple IPs independently', () => {
      const ip1 = '192.168.1.4';
      const ip2 = '192.168.1.5';
      
      // Exhaust rate limit for ip1
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip1);
      }
      expect(checkRateLimit(ip1)).toBe(false);
      
      // ip2 should still be allowed
      expect(checkRateLimit(ip2)).toBe(true);
    });
  });

  describe('Body Size Limiting', () => {
    test('should allow requests within size limit', () => {
      const req = {
        headers: {
          'content-length': '1024' // 1 KB
        }
      };
      
      expect(checkBodySizeLimit(req)).toBe(true);
    });

    test('should block requests exceeding size limit', () => {
      const req = {
        headers: {
          'content-length': String(33 * 1024) // 33 KB
        }
      };
      
      expect(checkBodySizeLimit(req)).toBe(false);
    });

    test('should allow requests at exact size limit', () => {
      const req = {
        headers: {
          'content-length': String(32 * 1024) // Exactly 32 KB
        }
      };
      
      expect(checkBodySizeLimit(req)).toBe(true);
    });

    test('should handle missing content-length header', () => {
      const req = {
        headers: {}
      };
      
      expect(checkBodySizeLimit(req)).toBe(true);
    });
  });

  describe('Security Headers', () => {
    test('should set all required security headers', () => {
      const res = {
        headers: {},
        setHeader: jest.fn((key, value) => {
          res.headers[key] = value;
        })
      };
      
      setSecurityHeaders(res);
      
      expect(res.setHeader).toHaveBeenCalledWith('Content-Security-Policy', expect.any(String));
      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
    });

    test('should set proper CSP header', () => {
      const res = {
        headers: {},
        setHeader: jest.fn((key, value) => {
          res.headers[key] = value;
        })
      };
      
      setSecurityHeaders(res);
      
      const cspCall = res.setHeader.mock.calls.find(call => call[0] === 'Content-Security-Policy');
      expect(cspCall).toBeDefined();
      expect(cspCall[1]).toContain("default-src 'self'");
      expect(cspCall[1]).toContain("object-src 'none'");
    });
  });

  describe('Client IP Detection', () => {
    test('should extract IP from x-forwarded-for header', () => {
      const req = {
        headers: {
          'x-forwarded-for': '192.168.1.100'
        }
      };
      
      expect(getClientIP(req)).toBe('192.168.1.100');
    });

    test('should extract IP from x-real-ip header', () => {
      const req = {
        headers: {
          'x-real-ip': '192.168.1.101'
        }
      };
      
      expect(getClientIP(req)).toBe('192.168.1.101');
    });

    test('should fallback to connection remoteAddress', () => {
      const req = {
        headers: {},
        connection: {
          remoteAddress: '192.168.1.102'
        }
      };
      
      expect(getClientIP(req)).toBe('192.168.1.102');
    });

    test('should fallback to localhost when no IP found', () => {
      const req = {
        headers: {}
      };
      
      expect(getClientIP(req)).toBe('127.0.0.1');
    });
  });
});