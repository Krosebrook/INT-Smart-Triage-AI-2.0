import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { TriageEngine } from '../src/services/triageEngine.js';
import { validateTriageRequest, sanitizeTriageData } from '../src/utils/validation.js';
import { setSecurityHeaders, extractClientInfo, validateHttpMethod } from '../src/utils/security.js';

describe('Triage Engine', () => {
  const engine = new TriageEngine();

  it('should process a high priority urgent issue', () => {
    const input = {
      customerName: 'Test User',
      ticketSubject: 'System Down',
      issueDescription: 'The entire system is down and not working',
      customerTone: 'urgent',
      csrAgent: 'CSR_TEST'
    };

    const result = engine.processTriageRequest(input);
    
    assert.strictEqual(result.priority, 'high');
    assert.ok(result.confidence);
    assert.ok(result.responseApproach);
    assert.ok(Array.isArray(result.talkingPoints));
    assert.ok(Array.isArray(result.knowledgeBase));
  });

  it('should process a medium priority frustrated issue', () => {
    const input = {
      customerName: 'Test User',
      ticketSubject: 'Login Issue',
      issueDescription: 'Cannot login to the system',
      customerTone: 'frustrated',
      csrAgent: 'CSR_TEST'
    };

    const result = engine.processTriageRequest(input);
    
    assert.strictEqual(result.priority, 'medium');
    assert.ok(result.category);
    assert.ok(result.metadata);
  });

  it('should categorize authentication issues correctly', () => {
    const input = {
      customerName: 'Test User',
      ticketSubject: 'Password Reset',
      issueDescription: 'I need help with password authentication',
      customerTone: 'calm',
      csrAgent: 'CSR_TEST'
    };

    const result = engine.processTriageRequest(input);
    
    assert.strictEqual(result.category, 'authentication');
  });
});

describe('Validation Utils', () => {
  it('should validate correct triage request', () => {
    const data = {
      customerName: 'Test User',
      ticketSubject: 'Test Subject',
      issueDescription: 'Test description',
      customerTone: 'calm',
      csrAgent: 'CSR_TEST'
    };

    const result = validateTriageRequest(data);
    
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('should reject invalid customer tone', () => {
    const data = {
      customerName: 'Test User',
      ticketSubject: 'Test Subject',
      issueDescription: 'Test description',
      customerTone: 'invalid_tone',
      csrAgent: 'CSR_TEST'
    };

    const result = validateTriageRequest(data);
    
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.length > 0);
  });

  it('should sanitize input data correctly', () => {
    const data = {
      customerName: '  <script>alert("xss")</script>Test User  ',
      ticketSubject: 'Test<>Subject',
      issueDescription: 'Test\x00description\x1F',
      customerTone: '  CALM  ',
      csrAgent: 'CSR_TEST'
    };

    const result = sanitizeTriageData(data);
    
    assert.strictEqual(result.customerName, 'scriptalert("xss")/scriptTest User');
    assert.ok(!result.ticketSubject.includes('<'));
    assert.ok(!result.ticketSubject.includes('>'));
    assert.strictEqual(result.customerTone, 'calm');
  });
});

describe('Security Utils', () => {
  it('should set all required security headers', () => {
    const mockRes = {
      headers: {},
      setHeader(name, value) {
        this.headers[name] = value;
      }
    };

    setSecurityHeaders(mockRes);
    
    assert.ok(mockRes.headers['X-Content-Type-Options']);
    assert.ok(mockRes.headers['X-Frame-Options']);
    assert.ok(mockRes.headers['X-XSS-Protection']);
    assert.ok(mockRes.headers['Strict-Transport-Security']);
    assert.ok(mockRes.headers['Content-Security-Policy']);
  });

  it('should extract client info from request', () => {
    const mockReq = {
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'TestAgent/1.0',
        'x-session-id': 'test-session-123'
      }
    };

    const result = extractClientInfo(mockReq);
    
    assert.strictEqual(result.ipAddress, '192.168.1.1');
    assert.strictEqual(result.userAgent, 'TestAgent/1.0');
    assert.strictEqual(result.sessionId, 'test-session-123');
    assert.ok(result.timestamp);
  });

  it('should validate HTTP methods correctly', () => {
    const mockReq = { method: 'POST' };
    const mockRes = {
      statusCode: 200,
      response: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.response = data;
        return this;
      }
    };

    const result = validateHttpMethod(mockReq, mockRes, ['POST', 'GET']);
    assert.strictEqual(result, true);

    const invalidResult = validateHttpMethod(mockReq, mockRes, ['GET', 'DELETE']);
    assert.strictEqual(invalidResult, false);
    assert.strictEqual(mockRes.statusCode, 405);
  });
});
