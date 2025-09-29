/**
 * Integration tests for API endpoints with security middleware
 */

const request = require('supertest');
const express = require('express');

// Helper to clear rate limit cache
function clearRateLimit() {
  // Access the internal rate limit storage and clear it
  const security = require('../lib/security');
  if (security.__rateLimitStorage) {
    security.__rateLimitStorage.clear();
  }
}

// Mock Vercel serverless function for testing
function createTestApp() {
  const app = express();
  app.use(express.json({ limit: '50mb' })); // Higher limit for testing
  
  // Import handlers fresh for each test
  delete require.cache[require.resolve('../api/triage')];
  delete require.cache[require.resolve('../api/health')];
  delete require.cache[require.resolve('../lib/security')];
  
  const triageHandler = require('../api/triage');
  const healthHandler = require('../api/health');
  
  app.all('/api/triage', triageHandler);
  app.all('/api/health', healthHandler);
  
  return app;
}

describe('API Integration Tests', () => {
  let app;
  
  beforeEach(() => {
    // Clear rate limit storage before each test
    clearRateLimit();
    app = createTestApp();
  });
  
  afterEach(() => {
    // Clear rate limit storage after each test
    clearRateLimit();
  });

  describe('Security Headers', () => {
    test('should include security headers in all responses', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-Forwarded-For', '10.0.0.1') // Unique IP
        .expect(200);
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests within rate limit', async () => {
      const ip = '10.0.0.2';
      
      // Make 5 requests (should all succeed)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/api/health')
          .set('X-Forwarded-For', ip)
          .expect(200);
      }
    });

    test('should block requests exceeding rate limit', async () => {
      const ip = '10.0.0.3';
      
      // Make 5 requests (should all succeed)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/api/health')
          .set('X-Forwarded-For', ip)
          .expect(200);
      }
      
      // 6th request should be blocked
      const response = await request(app)
        .get('/api/health')
        .set('X-Forwarded-For', ip)
        .expect(429);
      
      expect(response.body.error).toBe('Too Many Requests');
      expect(response.body.code).toBe(429);
    });
  });

  describe('Body Size Limiting', () => {
    test('should accept requests within size limit', async () => {
      const smallPayload = {
        ticketContent: 'Small ticket content',
        priority: 'medium'
      };
      
      await request(app)
        .post('/api/triage')
        .set('X-Forwarded-For', '10.0.0.4') // Unique IP
        .send(smallPayload)
        .expect(200);
    });

    test('should reject requests exceeding size limit', async () => {
      // Create a payload larger than 32KB
      const largeContent = 'x'.repeat(33 * 1024);
      const largePayload = {
        ticketContent: largeContent,
        priority: 'high'
      };
      
      const response = await request(app)
        .post('/api/triage')
        .set('X-Forwarded-For', '10.0.0.5') // Unique IP
        .send(largePayload)
        .expect(413);
      
      expect(response.body.error).toBe('Payload Too Large');
      expect(response.body.code).toBe(413);
    });
  });

  describe('Triage Endpoint', () => {
    test('should handle GET requests (health check)', async () => {
      const response = await request(app)
        .get('/api/triage')
        .set('X-Forwarded-For', '10.0.0.6') // Unique IP
        .expect(200);
      
      expect(response.body.message).toContain('INT Smart Triage AI 2.0');
      expect(response.body.security).toBeDefined();
    });

    test('should handle POST requests (triage)', async () => {
      const payload = {
        ticketContent: 'Customer is having login issues',
        priority: 'high'
      };
      
      const response = await request(app)
        .post('/api/triage')
        .set('X-Forwarded-For', '10.0.0.7') // Unique IP
        .send(payload)
        .expect(200);
      
      expect(response.body.message).toBe('Ticket triaged successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.ticketContent).toBe(payload.ticketContent);
    });

    test('should reject POST requests without ticketContent', async () => {
      const payload = {
        priority: 'high'
      };
      
      const response = await request(app)
        .post('/api/triage')
        .set('X-Forwarded-For', '10.0.0.8') // Unique IP
        .send(payload)
        .expect(400);
      
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('ticketContent is required');
    });

    test('should reject unsupported methods', async () => {
      const response = await request(app)
        .put('/api/triage')
        .set('X-Forwarded-For', '10.0.0.9') // Unique IP
        .expect(405);
      
      expect(response.body.error).toBe('Method Not Allowed');
    });
  });

  describe('Health Endpoint', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-Forwarded-For', '10.0.0.10') // Unique IP
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('INT Smart Triage AI 2.0');
      expect(response.body.security).toBeDefined();
    });

    test('should reject non-GET methods', async () => {
      await request(app)
        .post('/api/health')
        .set('X-Forwarded-For', '10.0.0.11') // Unique IP
        .expect(405);
    });
  });
});