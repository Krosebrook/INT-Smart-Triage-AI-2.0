import crypto from 'node:crypto';
import { sanitizeInput } from '../utils/validation.js';

const EMAIL_BREAK_MARKERS = [/^>+\s*/, /^on\s.+wrote:?$/i, /^from:\s.+/i];

function generateDeterministicId(seed) {
  return crypto.createHash('sha256').update(seed).digest('hex').slice(0, 24);
}

function normalizeTimestamp(timestamp, fallback = new Date()) {
  if (timestamp instanceof Date && !Number.isNaN(timestamp.getTime())) {
    return timestamp.toISOString();
  }

  if (typeof timestamp === 'number' && Number.isFinite(timestamp)) {
    return new Date(timestamp).toISOString();
  }

  if (typeof timestamp === 'string' && timestamp.trim().length > 0) {
    const parsed = new Date(timestamp);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return fallback.toISOString();
}

function cleanText(text) {
  if (typeof text !== 'string') {
    return '';
  }

  const sanitized = sanitizeInput(text) || '';
  return sanitized
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\t\f]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function splitEmailBody(body) {
  if (typeof body !== 'string' || body.trim().length === 0) {
    return [];
  }

  const lines = body.split(/\r?\n/);
  const segments = [];
  let current = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const isMarker = EMAIL_BREAK_MARKERS.some(pattern => pattern.test(line));

    if (isMarker && current.length > 0) {
      segments.push(current.join(' ').trim());
      current = [];
      continue;
    }

    if (line.length > 0) {
      current.push(line);
    }
  }

  if (current.length > 0) {
    segments.push(current.join(' ').trim());
  }

  return segments;
}

function deriveEmailMessages(payload) {
  const segments = splitEmailBody(payload.body || '');
  if (segments.length === 0) {
    const fallback = cleanText(payload.body || '');
    if (!fallback) {
      return [];
    }

    return [
      {
        speaker: 'customer',
        text: fallback,
        timestamp: normalizeTimestamp(payload.receivedAt || Date.now()),
        metadata: {
          from: payload.from,
          to: payload.to,
          channel: 'email'
        }
      }
    ];
  }

  const messages = [];
  segments.forEach((segment, index) => {
    const text = cleanText(segment);
    if (!text) {
      return;
    }

    const isReply = index > 0;
    messages.push({
      speaker: isReply ? 'agent' : 'customer',
      text,
      timestamp: normalizeTimestamp(payload.receivedAt || Date.now()),
      metadata: {
        from: isReply ? payload.to : payload.from,
        to: isReply ? payload.from : payload.to,
        channel: 'email',
        position: index
      }
    });
  });

  return messages;
}

function mapRoleToSpeaker(role) {
  if (!role) {
    return 'system';
  }

  const normalized = role.toLowerCase();
  if (['assistant', 'agent'].includes(normalized)) {
    return 'agent';
  }
  if (['user', 'customer', 'end_user'].includes(normalized)) {
    return 'customer';
  }
  return 'system';
}

export function normalizeEmailTranscript(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Email payload must be an object');
  }

  const subject = cleanText(payload.subject || 'Customer communication');
  const messages = deriveEmailMessages(payload);
  const createdAt = normalizeTimestamp(payload.receivedAt || Date.now());
  const transcriptId = payload.id || generateDeterministicId(`${subject}-${createdAt}`);

  return {
    source: 'email',
    subject,
    originalId: String(payload.id || transcriptId),
    createdAt,
    messages,
    tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 10).map(cleanText).filter(Boolean) : [],
    metadata: {
      threadId: payload.threadId || null,
      importance: payload.importance || 'normal',
      attachments: Array.isArray(payload.attachments) ? payload.attachments.length : 0,
      originalHeaders: payload.headers || {},
      channel: 'email'
    }
  };
}

export function normalizeChatTranscript(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Chat payload must be an object');
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const normalizedMessages = messages
    .map((message, index) => {
      const text = cleanText(message.content || message.text || '');
      if (!text) {
        return null;
      }

      return {
        speaker: mapRoleToSpeaker(message.role || message.sender),
        text,
        timestamp: normalizeTimestamp(message.timestamp || payload.updatedAt || Date.now(), new Date(Date.now() + index)),
        metadata: {
          role: message.role || message.sender,
          index,
          channel: 'chatgpt'
        }
      };
    })
    .filter(Boolean);

  const createdAt = normalizeTimestamp(payload.createdAt || Date.now());
  const transcriptId = payload.sessionId || generateDeterministicId(`${createdAt}-${normalizedMessages.length}`);

  return {
    source: 'chatgpt',
    subject: cleanText(payload.subject || payload.topic || 'Chat session'),
    originalId: String(payload.sessionId || transcriptId),
    createdAt,
    messages: normalizedMessages,
    tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 10).map(cleanText).filter(Boolean) : [],
    metadata: {
      model: payload.model || 'chatgpt',
      conversationLength: normalizedMessages.length,
      sessionDurationMs: typeof payload.durationMs === 'number' ? payload.durationMs : null,
      channel: 'chatgpt'
    }
  };
}

export function normalizeTranscript(sourceType, payload) {
  const normalizedSource = String(sourceType || '').toLowerCase();
  if (normalizedSource === 'email') {
    return normalizeEmailTranscript(payload);
  }

  if (normalizedSource === 'chatgpt') {
    return normalizeChatTranscript(payload);
  }

  throw new Error(`Unsupported transcript source: ${sourceType}`);
}

export function buildAnalysisPrompt(normalizedTranscript) {
  if (!normalizedTranscript || typeof normalizedTranscript !== 'object') {
    throw new Error('Normalized transcript is required to build prompt');
  }

  const header = `Source: ${normalizedTranscript.source.toUpperCase()}\nSubject: ${normalizedTranscript.subject || 'n/a'}\nCreated: ${normalizedTranscript.createdAt}`;
  const body = normalizedTranscript.messages
    .map(message => `- [${message.timestamp}] ${message.speaker.toUpperCase()}: ${message.text}`)
    .join('\n');

  const tail = normalizedTranscript.tags?.length
    ? `\nTags: ${normalizedTranscript.tags.join(', ')}`
    : '';

  return `${header}\n${body}${tail}`.trim();
}

export function createStoragePayload(normalizedTranscript, analysis) {
  if (!normalizedTranscript || typeof normalizedTranscript !== 'object') {
    throw new Error('Normalized transcript is required');
  }
  if (!analysis || typeof analysis !== 'object') {
    throw new Error('Transcript analysis is required');
  }

  return {
    transcript_id: normalizedTranscript.originalId,
    source: normalizedTranscript.source,
    subject: normalizedTranscript.subject,
    created_at: normalizedTranscript.createdAt,
    messages: normalizedTranscript.messages,
    summary: analysis.summary,
    sentiment: analysis.sentiment,
    key_issues: analysis.keyIssues,
    tags: normalizedTranscript.tags,
    metadata: {
      ...(normalizedTranscript.metadata || {}),
      aiNotes: analysis.aiNotes || null,
      generatedAt: new Date().toISOString()
    }
  };
}

export default {
  normalizeTranscript,
  normalizeEmailTranscript,
  normalizeChatTranscript,
  buildAnalysisPrompt,
  createStoragePayload
};
