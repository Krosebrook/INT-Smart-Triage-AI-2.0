/**
 * Public report submission endpoint
 * Validates unauthenticated submissions and persists them using the service role.
 */

import { DatabaseService } from '../src/services/database.js';
import {
  setSecurityHeaders,
  validateHttpMethod,
  extractClientInfo,
  createRateLimiter
} from '../src/utils/security.js';
import {
  validateReportSubmission,
  sanitizeReportSubmission
} from '../src/utils/validation.js';

const dbService = new DatabaseService();
const rateLimiter = createRateLimiter(60000, 20);

function parseRequestBody(req) {
  if (!req.body) {
    return null;
  }

  if (typeof req.body === 'object') {
    return req.body;
  }

  try {
    return JSON.parse(req.body);
  } catch (error) {
    console.error('Failed to parse JSON body for report submission:', error.message);
    return null;
  }
}

export default async function handler(req, res) {
  setSecurityHeaders(res);

  if (!validateHttpMethod(req, res, ['POST'])) {
    return;
  }

  if (!rateLimiter(req, res)) {
    return;
  }

  if (!dbService.isInitialized) {
    console.error('Database service not configured for report submission');
    return res.status(500).json({
      error: 'Service Configuration Error',
      message: 'Database service not properly configured'
    });
  }

  const body = parseRequestBody(req);

  if (!body) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid or missing request body'
    });
  }

  const submission = body.report || body;

  const validation = validateReportSubmission(submission);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid report submission',
      details: validation.errors
    });
  }

  const sanitized = sanitizeReportSubmission(submission);
  const clientInfo = extractClientInfo(req);

  try {
    const reportRecord = {
      report_id: sanitized.reportId,
      customer_name: sanitized.customerName,
      ticket_subject: sanitized.ticketSubject,
      issue_description: sanitized.issueDescription,
      customer_tone: sanitized.customerTone,
      priority: sanitized.priority,
      category: sanitized.category,
      confidence_score: sanitized.confidenceScore,
      response_approach: sanitized.responseApproach,
      talking_points: sanitized.talkingPoints,
      knowledge_base_articles: sanitized.knowledgeBase,
      csr_agent: sanitized.csrAgent,
      created_at: sanitized.createdAt,
      processed_at: sanitized.processedAt,
      ip_address: clientInfo.ipAddress,
      user_agent: clientInfo.userAgent,
      session_id: clientInfo.sessionId,
      metadata: {
        ...sanitized.metadata,
        submissionClient: {
          ip: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          receivedAt: clientInfo.timestamp
        }
      }
    };

    const insertResult = await dbService.insertReport(reportRecord);

    return res.status(201).json({
      success: true,
      reportId: insertResult.report_id,
      createdAt: insertResult.created_at,
      priority: insertResult.priority,
      category: insertResult.category,
      confidenceScore: insertResult.confidence_score
    });
  } catch (error) {
    console.error('Report submission error:', error);

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to submit report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
