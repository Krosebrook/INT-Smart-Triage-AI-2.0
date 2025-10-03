import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Integration Tests', () => {
  it('should simulate a complete triage request flow', async () => {
    // Import services
    const { TriageEngine } = await import('../src/services/triageEngine.js');
    const { validateTriageRequest, sanitizeTriageData } = await import('../src/utils/validation.js');
    
    // Simulate incoming request
    const requestData = {
      customerName: 'Test Customer',
      ticketSubject: 'Login Issue',
      issueDescription: 'Cannot login to the system, getting error messages',
      customerTone: 'frustrated',
      csrAgent: 'CSR_TEST'
    };
    
    // Step 1: Validate request
    const validation = validateTriageRequest(requestData);
    assert.strictEqual(validation.isValid, true, 'Request should be valid');
    
    // Step 2: Sanitize data
    const sanitizedData = sanitizeTriageData(requestData);
    assert.ok(sanitizedData.customerName, 'Customer name should be sanitized');
    assert.ok(sanitizedData.ticketSubject, 'Ticket subject should be sanitized');
    
    // Step 3: Process triage
    const triageEngine = new TriageEngine();
    const triageResults = triageEngine.processTriageRequest(sanitizedData);
    
    // Verify triage results structure
    assert.ok(triageResults.priority, 'Should have priority');
    assert.ok(triageResults.category, 'Should have category');
    assert.ok(triageResults.confidence, 'Should have confidence');
    assert.ok(triageResults.responseApproach, 'Should have response approach');
    assert.ok(Array.isArray(triageResults.talkingPoints), 'Should have talking points array');
    assert.ok(Array.isArray(triageResults.knowledgeBase), 'Should have knowledge base array');
    assert.ok(triageResults.processedAt, 'Should have processed timestamp');
    assert.ok(triageResults.metadata, 'Should have metadata');
    
    // Verify metadata structure
    assert.ok(Array.isArray(triageResults.metadata.detectedKeywords), 'Metadata should have keywords');
    assert.ok(typeof triageResults.metadata.sentimentScore === 'number', 'Metadata should have sentiment score');
    
    console.log('✓ Complete triage flow executed successfully');
    console.log(`  Priority: ${triageResults.priority}`);
    console.log(`  Category: ${triageResults.category}`);
    console.log(`  Confidence: ${triageResults.confidence}`);
  });

  it('should handle invalid requests properly', async () => {
    const { validateTriageRequest } = await import('../src/utils/validation.js');
    
    const invalidRequest = {
      customerName: 'Test',
      ticketSubject: 'Test',
      // Missing issueDescription
      customerTone: 'invalid_tone'
    };
    
    const validation = validateTriageRequest(invalidRequest);
    assert.strictEqual(validation.isValid, false, 'Invalid request should be rejected');
    assert.ok(validation.errors.length > 0, 'Should have validation errors');
    
    console.log('✓ Invalid request properly rejected');
    console.log(`  Errors: ${validation.errors.join(', ')}`);
  });

  it('should handle XSS attempts in sanitization', async () => {
    const { sanitizeTriageData } = await import('../src/utils/validation.js');
    
    const maliciousData = {
      customerName: '<script>alert("XSS")</script>Test User',
      ticketSubject: '<img src=x onerror=alert(1)>Subject',
      issueDescription: 'Normal text with <iframe> injection',
      customerTone: 'calm',
      csrAgent: 'CSR_TEST'
    };
    
    const sanitized = sanitizeTriageData(maliciousData);
    
    assert.ok(!sanitized.customerName.includes('<script>'), 'Should remove script tags');
    assert.ok(!sanitized.ticketSubject.includes('<img'), 'Should remove img tags');
    assert.ok(!sanitized.issueDescription.includes('<iframe>'), 'Should remove iframe tags');
    
    console.log('✓ XSS attempts properly sanitized');
  });

  it('should generate appropriate response for high priority issues', async () => {
    const { TriageEngine } = await import('../src/services/triageEngine.js');
    
    const engine = new TriageEngine();
    const criticalIssue = {
      customerName: 'VIP Customer',
      ticketSubject: 'System Outage',
      issueDescription: 'Critical system down, production environment not working, urgent help needed',
      customerTone: 'angry',
      csrAgent: 'CSR_SENIOR'
    };
    
    const result = engine.processTriageRequest(criticalIssue);
    
    assert.strictEqual(result.priority, 'high', 'Should be high priority');
    assert.ok(result.talkingPoints.length > 0, 'Should have talking points');
    assert.ok(result.responseApproach.toLowerCase().includes('escalat'), 'Should mention escalation');
    
    console.log('✓ High priority response generated correctly');
    console.log(`  Response: ${result.responseApproach.substring(0, 80)}...`);
  });
});
