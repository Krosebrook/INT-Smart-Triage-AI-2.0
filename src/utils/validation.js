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
    .replace(/[\x00-\x1F\x7F]/g, ''); // eslint-disable-line no-control-regex -- Remove control characters
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

export function validateReportSubmission(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Report payload must be an object']
    };
  }

  if (!data.reportId || typeof data.reportId !== 'string') {
    errors.push('Report ID is required and must be a string');
  } else if (data.reportId.length > 50) {
    errors.push('Report ID must be 50 characters or less');
  }

  const baseValidation = validateTriageRequest(data);
  if (!baseValidation.isValid) {
    errors.push(...baseValidation.errors);
  }

  const validPriorities = ['low', 'medium', 'high'];
  if (!data.priority || typeof data.priority !== 'string' || !validPriorities.includes(data.priority.toLowerCase())) {
    errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
  }

  if (!data.responseApproach || typeof data.responseApproach !== 'string') {
    errors.push('Response approach is required and must be a string');
  }

  if (!Array.isArray(data.talkingPoints) || data.talkingPoints.length === 0) {
    errors.push('Talking points are required and must be a non-empty array');
  }

  if (Array.isArray(data.talkingPoints)) {
    for (const point of data.talkingPoints) {
      if (typeof point !== 'string') {
        errors.push('Talking points must contain only strings');
        break;
      }
    }
  }

  if (!Array.isArray(data.knowledgeBase)) {
    errors.push('Knowledge base entries must be provided as an array');
  } else {
    for (const article of data.knowledgeBase) {
      if (typeof article !== 'string') {
        errors.push('Knowledge base entries must be strings');
        break;
      }
    }
  }

  if (data.confidence !== undefined) {
    const confidenceValue = typeof data.confidence === 'number'
      ? data.confidence
      : parseFloat(String(data.confidence).replace('%', ''));

    if (Number.isNaN(confidenceValue) || confidenceValue < 0 || confidenceValue > 100) {
      errors.push('Confidence must be a number between 0 and 100');
    }
  }

  if (data.metadata && typeof data.metadata !== 'object') {
    errors.push('Metadata must be a valid object');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeReportSubmission(data) {
  const base = sanitizeTriageData(data);

  const confidenceValue = typeof data.confidence === 'number'
    ? data.confidence
    : parseFloat(String(data.confidence ?? '').replace('%', ''));

  const confidenceScore = Number.isFinite(confidenceValue)
    ? Math.max(0, Math.min(100, confidenceValue))
    : null;

  const sanitizeArray = (items = [], maxLength = 500) =>
    Array.isArray(items)
      ? items
          .map(item => typeof item === 'string' ? sanitizeInput(item)?.substring(0, maxLength) : null)
          .filter(Boolean)
      : [];

  const processedAt = data.processedAt && !Number.isNaN(Date.parse(data.processedAt))
    ? new Date(data.processedAt).toISOString()
    : base.timestamp;

  const metadata = data.metadata && typeof data.metadata === 'object'
    ? data.metadata
    : {};

  if (data.analysis && typeof data.analysis === 'object') {
    metadata.analysis = data.analysis;
  }

  if (data.department) {
    metadata.department = sanitizeInput(data.department)?.substring(0, 100) || data.department;
  }

  metadata.source = metadata.source || 'public-report-submit';

  return {
    reportId: sanitizeInput(data.reportId)?.substring(0, 50),
    customerName: base.customerName,
    ticketSubject: base.ticketSubject,
    issueDescription: base.issueDescription,
    customerTone: base.customerTone,
    csrAgent: base.csrAgent,
    createdAt: base.timestamp,
    priority: sanitizeInput(data.priority)?.toLowerCase(),
    category: sanitizeInput(data.category || 'general')?.toLowerCase(),
    responseApproach: sanitizeInput(data.responseApproach)?.substring(0, 4000),
    talkingPoints: sanitizeArray(data.talkingPoints, 500),
    knowledgeBase: sanitizeArray(data.knowledgeBase, 200),
    confidenceScore,
    processedAt,
    metadata
  };
}