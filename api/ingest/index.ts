import type { IncomingMessage, ServerResponse } from 'node:http';
import { DatabaseService } from '../../src/services/database.js';
import { normalizeTranscript, createStoragePayload } from '../../src/ingest/normalizer.js';
import { redactTranscriptRecord } from '../../src/middleware/redaction.js';
import { setSecurityHeaders, validateHttpMethod, extractClientInfo, createRateLimiter } from '../../src/utils/security.js';
import { sanitizeInput } from '../../src/utils/validation.js';
import { AiAssistant, type TranscriptAnalysis } from '../../src/services/aiAssistant.ts';

interface IngestRequest extends IncomingMessage {
  body?: unknown;
  method?: string;
  headers: Record<string, string>;
}

interface JsonResponse extends ServerResponse {
  status: (code: number) => JsonResponse;
  json: (payload: unknown) => void;
}

interface IngestRequestBody {
  source: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface ClientInfo {
  ipAddress: string;
  userAgent: string;
  sessionId: string | null;
  timestamp: string;
}

const databaseService = new DatabaseService();
const rateLimiter = createRateLimiter(60000, 40);

let aiAssistant: AiAssistant | null = null;
try {
  aiAssistant = new AiAssistant({
    endpoint: process.env.AI_ASSISTANT_URL || '',
    apiKey: process.env.AI_ASSISTANT_API_KEY || '',
    model: process.env.AI_ASSISTANT_MODEL || 'gpt-4.1-mini',
    requestTimeoutMs: Number(process.env.AI_ASSISTANT_TIMEOUT_MS || 10000),
    maxPromptTokens: Number(process.env.AI_ASSISTANT_MAX_TOKENS || 3500)
  });
} catch (error) {
  console.error('Failed to initialize AI assistant:', error);
}

function parseBody(req: IngestRequest): IngestRequestBody {
  if (!req.body) {
    throw new Error('Missing request body');
  }

  if (typeof req.body === 'object') {
    return req.body as IngestRequestBody;
  }

  try {
    const parsed = JSON.parse(String(req.body));
    return parsed as IngestRequestBody;
  } catch (error) {
    throw new Error('Unable to parse request body');
  }
}

function validateIngestBody(body: IngestRequestBody) {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    errors.push('Request body must be an object');
    return errors;
  }

  if (!body.source || typeof body.source !== 'string') {
    errors.push('`source` must be provided');
  }

  if (!body.payload || typeof body.payload !== 'object') {
    errors.push('`payload` must be an object');
  }

  return errors;
}

function buildResponsePayload(record: Record<string, unknown>, analysis: TranscriptAnalysis, clientInfo: ClientInfo) {
  const storedRecord = record as { transcript_id?: string; created_at?: string };

  return {
    success: true,
    transcriptId: storedRecord.transcript_id || null,
    createdAt: storedRecord.created_at || null,
    summary: analysis.summary,
    sentiment: analysis.sentiment,
    keyIssues: analysis.keyIssues,
    ingestionClient: {
      ip: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    }
  };
}

export default async function handler(req: IngestRequest, res: JsonResponse) {
  setSecurityHeaders(res);

  if (!validateHttpMethod(req, res, ['POST'])) {
    return;
  }

  if (!rateLimiter(req, res)) {
    return;
  }

  if (!databaseService.isInitialized) {
    res.status(500).json({
      error: 'Service Configuration Error',
      message: 'Database service is not configured'
    });
    return;
  }

  try {
    const body = parseBody(req);
    const validationErrors = validateIngestBody(body);

    if (validationErrors.length > 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid ingestion payload',
        details: validationErrors
      });
      return;
    }

    if (!aiAssistant) {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'AI assistant service is not configured'
      });
      return;
    }

    const clientInfo = extractClientInfo(req);
    const normalized = normalizeTranscript(body.source, body.payload);
    const analysis = await aiAssistant.analyzeTranscript(normalized);

    const storageRecord = createStoragePayload(normalized, analysis);
    storageRecord.metadata = {
      ...(storageRecord.metadata || {}),
      ingestionMetadata: {
        client: {
          ip: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent
        },
        receivedAt: clientInfo.timestamp,
        sourceMetadata: body.metadata || {}
      }
    };

    if (typeof storageRecord.subject === 'string') {
      const sanitizedSubject = sanitizeInput(storageRecord.subject);
      if (typeof sanitizedSubject === 'string') {
        storageRecord.subject = sanitizedSubject.substring(0, 200);
      }
    }

    const redactedRecord = redactTranscriptRecord(storageRecord);
    const savedRecord = await databaseService.insertNormalizedTranscript(redactedRecord);

    res.status(201).json(buildResponsePayload(savedRecord, analysis, clientInfo));
  } catch (error) {
    console.error('Ingestion pipeline error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process transcript',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}
