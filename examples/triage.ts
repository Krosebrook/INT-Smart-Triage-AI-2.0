import { logger } from '../lib/log';

/**
 * Mock triage request interface
 */
interface TriageRequest {
  userId: string;
  inquiry: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  headers?: Record<string, string>;
}

/**
 * Mock triage response interface
 */
interface TriageResponse {
  ticketId: string;
  priority: string;
  category: string;
  suggestedResponse: string;
  kbArticles: string[];
  confidence: number;
}

/**
 * Triage endpoint example
 * Demonstrates logging with sensitive data redaction
 */
export function triageInquiry(request: TriageRequest): TriageResponse {
  const startTime = Date.now();
  const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('triage.started', {
    ticketId,
    userId: request.userId, // This will be redacted
    inquiryLength: request.inquiry?.length,
    priority: request.priority,
    headers: request.headers // Headers will be redacted appropriately
  });
  
  try {
    // Simulate AI processing
    const processingTime = Math.random() * 1000 + 500; // 500-1500ms
    
    // Mock triage logic
    const mockResponse: TriageResponse = {
      ticketId,
      priority: request.priority || 'medium',
      category: 'technical_support',
      suggestedResponse: 'Thank you for contacting us. I understand your concern and will help resolve this issue.',
      kbArticles: ['KB-001', 'KB-045', 'KB-102'],
      confidence: Math.random() * 0.3 + 0.7 // 70-100%
    };
    
    logger.info('triage.completed', {
      ticketId,
      duration: Date.now() - startTime,
      processingTime,
      priority: mockResponse.priority,
      category: mockResponse.category,
      confidence: mockResponse.confidence,
      kbArticleCount: mockResponse.kbArticles.length,
      // Note: inquiry content is intentionally not logged to avoid sensitive data exposure
    });
    
    return mockResponse;
    
  } catch (error) {
    logger.error('triage.failed', {
      ticketId,
      userId: request.userId, // This will be redacted
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
      // Inquiry content is not logged even in error cases
    });
    
    throw new Error('Triage processing failed');
  }
}

/**
 * Example with sensitive data that should be redacted
 */
export function triageWithSensitiveData(): void {
  const mockRequest: TriageRequest = {
    userId: 'user123456',
    inquiry: 'I am having trouble accessing my account. My password is not working and I cannot reset it. This is very urgent as I need to access important client data for a meeting tomorrow.',
    priority: 'urgent',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'x-api-key': 'sk-1234567890abcdef',
      'user-agent': 'Mozilla/5.0...',
      'content-type': 'application/json'
    }
  };
  
  logger.info('triage.sensitive.data.example', {
    request: mockRequest, // This entire object will be redacted appropriately
    timestamp: new Date().toISOString()
  });
  
  try {
    const result = triageInquiry(mockRequest);
    logger.info('triage.sensitive.data.success', {
      ticketId: result.ticketId,
      hasResult: !!result
    });
  } catch (error) {
    logger.error('triage.sensitive.data.error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Example usage
if (require.main === module) {
  console.log('Running triage examples...');
  
  // Example 1: Normal triage
  const normalRequest: TriageRequest = {
    userId: 'user789',
    inquiry: 'How do I reset my password?',
    priority: 'low'
  };
  
  try {
    const result = triageInquiry(normalRequest);
    console.log('Normal triage result:', { ticketId: result.ticketId, priority: result.priority });
  } catch (error) {
    console.error('Normal triage failed:', error);
  }
  
  // Example 2: Sensitive data example
  console.log('\nRunning sensitive data example...');
  triageWithSensitiveData();
}