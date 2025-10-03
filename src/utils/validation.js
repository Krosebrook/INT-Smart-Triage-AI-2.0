/**
 * Input validation utilities
 */

export function validateTriageRequest(data) {
  const errors = [];
  
  if (!data.customerName || typeof data.customerName !== 'string') {
    errors.push('Customer name is required and must be a string');
  } else if (data.customerName.length > 100) {
    errors.push('Customer name must be 100 characters or less');
  }
  
  if (!data.ticketSubject || typeof data.ticketSubject !== 'string') {
    errors.push('Ticket subject is required and must be a string');
  } else if (data.ticketSubject.length > 200) {
    errors.push('Ticket subject must be 200 characters or less');
  }
  
  if (!data.issueDescription || typeof data.issueDescription !== 'string') {
    errors.push('Issue description is required and must be a string');
  } else if (data.issueDescription.length > 2000) {
    errors.push('Issue description must be 2000 characters or less');
  }
  
  const validTones = ['calm', 'frustrated', 'angry', 'confused', 'urgent'];
  if (!data.customerTone || !validTones.includes(data.customerTone.toLowerCase())) {
    errors.push(`Customer tone must be one of: ${validTones.join(', ')}`);
  }
  
  if (data.csrAgent && (typeof data.csrAgent !== 'string' || data.csrAgent.length > 50)) {
    errors.push('CSR agent must be a string of 50 characters or less');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}

export function sanitizeTriageData(data) {
  return {
    customerName: sanitizeInput(data.customerName)?.substring(0, 100),
    ticketSubject: sanitizeInput(data.ticketSubject)?.substring(0, 200),
    issueDescription: sanitizeInput(data.issueDescription)?.substring(0, 2000),
    customerTone: sanitizeInput(data.customerTone)?.toLowerCase(),
    csrAgent: data.csrAgent ? sanitizeInput(data.csrAgent)?.substring(0, 50) : 'SYSTEM',
    timestamp: data.timestamp || new Date().toISOString()
  };
}