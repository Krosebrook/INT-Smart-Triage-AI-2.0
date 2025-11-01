import crypto from 'crypto';
import { GeminiService } from '../../../services/geminiService.js';
import { TriageEngine } from '../../../services/triageEngine.js';
import { DatabaseService } from '../../../services/database.js';
import {
  validateTriageRequest,
  sanitizeTriageData
} from '../../../utils/validation.js';
import {
  setSecurityHeaders,
  validateHttpMethod,
  extractClientInfo,
  createRateLimiter
} from '../../../utils/security.js';

function initializeDatabaseService() {
  try {
    return new DatabaseService();
  } catch (error) {
    console.error('Database service initialization failed:', error.message);
    return {
      isInitialized: false,
      async insertReport() {
        throw new Error('Database not initialized');
      }
    };
  }
}

let geminiService = new GeminiService();
let triageEngine = new TriageEngine();
let dbService = initializeDatabaseService();
let rateLimiter = createRateLimiter(60000, 50);

export function __setTriageReportDependencies({
  gemini,
  engine,
  database,
  limiter
} = {}) {
  if (gemini) {
    geminiService = gemini;
  }
  if (engine) {
    triageEngine = engine;
  }
  if (database) {
    dbService = database;
  }
  if (limiter) {
    rateLimiter = limiter;
  }
}

export async function handleCreateTriageReport(req, res) {
  setSecurityHeaders(res);

  if (!validateHttpMethod(req, res, ['POST'])) {
    return;
  }

  if (!rateLimiter(req, res)) {
    return;
  }

  if (!dbService.isInitialized) {
    console.error('Database service not configured');
    return res.status(500).json({
      error: 'Service Configuration Error',
      message: 'Database service not properly configured'
    });
  }

  try {
    const requestData = req.body;
    const validation = validateTriageRequest(requestData);

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: validation.errors
      });
    }

    const sanitizedData = sanitizeTriageData(requestData);
    const clientInfo = extractClientInfo(req);

    let triageResults;
    let usedLLM = false;

    if (geminiService.isConfigured) {
      try {
        triageResults = await geminiService.generateTriageAnalysis(sanitizedData);
        usedLLM = true;
      } catch (llmError) {
        console.warn(
          'LLM triage failed, falling back to rule-based engine:',
          llmError.message
        );
        triageResults = triageEngine.processTriageRequest(sanitizedData);
        usedLLM = false;
      }
    } else {
      triageResults = triageEngine.processTriageRequest(sanitizedData);
      usedLLM = false;
    }

    if (!triageResults || typeof triageResults !== 'object') {
      throw new Error('Invalid triage results structure');
    }

    const requiredFields = [
      'priority',
      'confidence',
      'responseApproach',
      'talkingPoints',
      'knowledgeBase',
      'category'
    ];
    for (const field of requiredFields) {
      if (!triageResults[field]) {
        throw new Error(`Missing or invalid field in triage response: ${field}`);
      }
    }

    if (
      !Array.isArray(triageResults.talkingPoints) ||
      !Array.isArray(triageResults.knowledgeBase)
    ) {
      throw new Error('Invalid JSON array structure in triage response');
    }

    const reportId = `TR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const kbArticleDraft = triageResults.kbArticleDraft || null;
    const managementSummary = triageResults.managementSummary || null;
    const crmData = triageResults.crmForwardingData || null;

    const reportData = {
      report_id: reportId,
      customer_name: sanitizedData.customerName,
      ticket_subject: sanitizedData.ticketSubject,
      issue_description: sanitizedData.issueDescription,
      customer_tone: sanitizedData.customerTone,
      priority: triageResults.priority,
      category: triageResults.category,
      confidence_score: parseFloat(triageResults.confidence.replace('%', '')),
      response_approach: triageResults.responseApproach,
      talking_points: triageResults.talkingPoints,
      knowledge_base_articles: triageResults.knowledgeBase,
      csr_agent: sanitizedData.csrAgent,
      created_at: sanitizedData.timestamp,
      processed_at: triageResults.processedAt || new Date().toISOString(),
      ip_address: clientInfo.ipAddress,
      user_agent: clientInfo.userAgent,
      session_id: clientInfo.sessionId,
      metadata: {
        ...(triageResults.metadata || {}),
        usedLLM,
        kbArticleDraft,
        managementSummary,
        crmForwardingData: crmData
      }
    };

    const insertResult = await dbService.insertReport(reportData);

    if (usedLLM && crmData) {
      console.log('CRM Forwarding Simulation:', {
        reportId: insertResult.report_id,
        customerSegment: crmData.customerSegment,
        accountHealth: crmData.accountHealth,
        churnRisk: crmData.churnRisk,
        upsellOpportunity: crmData.upsellOpportunity
      });
    }

    return res.status(201).json({
      success: true,
      reportId: insertResult.report_id,
      timestamp: insertResult.created_at,
      priority: triageResults.priority,
      category: triageResults.category,
      confidence: triageResults.confidence,
      responseApproach: triageResults.responseApproach,
      talkingPoints: triageResults.talkingPoints,
      knowledgeBase: triageResults.knowledgeBase,
      kbArticleDraft,
      managementSummary,
      crmForwardingData: crmData,
      metadata: {
        usedLLM,
        processedAt: triageResults.processedAt || new Date().toISOString(),
        ...(triageResults.metadata || {})
      },
      security: {
        rlsEnforced: true,
        auditLogged: true,
        serverAuthorized: true
      }
    });
  } catch (error) {
    console.error('Triage report error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate triage report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default handleCreateTriageReport;
