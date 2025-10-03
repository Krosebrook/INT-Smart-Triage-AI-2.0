/**
 * Triage Report API Endpoint
 * Processes triage requests and securely logs to Supabase with RLS enforcement
 */

import crypto from 'crypto';
import { TriageEngine } from '../src/services/triageEngine.js';
import { DatabaseService } from '../src/services/database.js';
import { validateTriageRequest, sanitizeTriageData } from '../src/utils/validation.js';
import { setSecurityHeaders, validateHttpMethod, extractClientInfo, createRateLimiter } from '../src/utils/security.js';

// Initialize services
const triageEngine = new TriageEngine();
const dbService = new DatabaseService();
const rateLimiter = createRateLimiter(60000, 50); // 50 requests per minute

export default async function handler(req, res) {
    // Set security headers
    setSecurityHeaders(res);

    // Validate HTTP method
    if (!validateHttpMethod(req, res, ['POST'])) {
        return;
    }

    // Apply rate limiting
    if (!rateLimiter(req, res)) {
        return;
    }

    // Verify database service
    if (!dbService.isInitialized) {
        console.error('Database service not configured');
        return res.status(500).json({
            error: 'Service Configuration Error',
            message: 'Database service not properly configured'
        });
    }

    try {
        // Extract and validate request data
        const requestData = req.body;
        const validation = validateTriageRequest(requestData);
        
        if (!validation.isValid) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid request data',
                details: validation.errors
            });
        }

        // Sanitize input data
        const sanitizedData = sanitizeTriageData(requestData);
        
        // Extract client information for audit
        const clientInfo = extractClientInfo(req);

        // Process triage request using AI logic
        const triageResults = triageEngine.processTriageRequest(sanitizedData);

        // Validate LLM JSON response structure as required
        if (!triageResults || typeof triageResults !== 'object') {
            throw new Error('Invalid triage results structure');
        }
        
        // Ensure required JSON fields are valid
        const requiredFields = ['priority', 'confidence', 'responseApproach', 'talkingPoints', 'knowledgeBase', 'category'];
        for (const field of requiredFields) {
            if (!triageResults[field]) {
                throw new Error(`Missing or invalid field in LLM response: ${field}`);
            }
        }

        // Validate JSON arrays
        if (!Array.isArray(triageResults.talkingPoints) || !Array.isArray(triageResults.knowledgeBase)) {
            throw new Error('Invalid JSON array structure in LLM response');
        }

        // Generate unique report ID
        const reportId = `TR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // Prepare data for secure database insertion
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
            processed_at: triageResults.processedAt,
            // Security and audit fields
            ip_address: clientInfo.ipAddress,
            user_agent: clientInfo.userAgent,
            session_id: clientInfo.sessionId,
            metadata: triageResults.metadata
        };

        // Attempt secure database write with RLS enforcement
        const insertResult = await dbService.insertReport(reportData);

        // Simulated CRM Forwarding - Placeholder for cross-functional workflow
        // In production, this would forward high-priority tickets to CRM system
        if (triageResults.priority === 'high') {
            console.log(`[CRM_FORWARDING] High-priority ticket ${reportId} marked for CRM escalation`);
            // Future implementation: await crmService.forwardTicket(reportData);
        }

        // Return successful response
        return res.status(200).json({
            success: true,
            reportId: insertResult.report_id,
            timestamp: insertResult.created_at,
            priority: triageResults.priority,
            category: triageResults.category,
            confidence: triageResults.confidence,
            responseApproach: triageResults.responseApproach,
            talkingPoints: triageResults.talkingPoints,
            knowledgeBase: triageResults.knowledgeBase,
            metadata: triageResults.metadata,
            security: {
                rlsEnforced: true,
                auditLogged: true,
                serverAuthorized: true
            }
        });

    } catch (error) {
        console.error('Triage report processing error:', error);
        
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to process triage request',
            reportId: null,
            timestamp: new Date().toISOString(),
            // Don't expose internal error details in production
            details: process.env.NODE_ENV === 'development' ? error.message : 'Contact system administrator'
        });
    }
}