import { setTimeout as sleep } from 'node:timers/promises';
import { buildAnalysisPrompt } from '../ingest/normalizer.js';
import { redactText } from '../middleware/redaction.js';

type TranscriptSource = 'email' | 'chatgpt';

type TranscriptSpeaker = 'customer' | 'agent' | 'system';

export interface TranscriptMessage {
  speaker: TranscriptSpeaker;
  text: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface NormalizedTranscript {
  source: TranscriptSource;
  subject?: string;
  originalId: string;
  createdAt: string;
  messages: TranscriptMessage[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface TranscriptAnalysis {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  keyIssues: string[];
  aiNotes?: string | null;
}

interface AiAssistantConfig {
  endpoint: string;
  apiKey: string;
  model?: string;
  requestTimeoutMs?: number;
  maxPromptTokens?: number;
}

interface AiAssistantResponse {
  summary: string;
  sentiment: string;
  keyIssues?: string[];
  notes?: string;
}

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_MODEL = 'gpt-4.1-mini';

const BLOCKED_CONTENT_PATTERNS = [
  /(password|passcode|pin)/i,
  /(social security|ssn)/i,
  /(credit\s*card|cc\s*number)/i
];

export class AiAssistant {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly requestTimeoutMs: number;
  private readonly maxPromptTokens: number;

  constructor(config: AiAssistantConfig) {
    if (!config.endpoint) {
      throw new Error('AI assistant endpoint is required');
    }
    if (!config.apiKey) {
      throw new Error('AI assistant API key is required');
    }

    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_MODEL;
    this.requestTimeoutMs = config.requestTimeoutMs || DEFAULT_TIMEOUT;
    this.maxPromptTokens = config.maxPromptTokens || 3500;
  }

  private ensurePromptIsSafe(prompt: string): string {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt must be a non-empty string');
    }

    const trimmed = prompt.trim();
    if (trimmed.length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    if (trimmed.length > this.maxPromptTokens * 4) {
      throw new Error('Prompt exceeds maximum allowed length');
    }

    for (const pattern of BLOCKED_CONTENT_PATTERNS) {
      if (pattern.test(trimmed)) {
        throw new Error('Prompt blocked by content policy');
      }
    }

    return redactText(trimmed);
  }

  private async requestWithTimeout(body: Record<string, unknown>): Promise<AiAssistantResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-AI-Model': this.model
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`AI assistant responded with ${response.status}: ${errorBody}`);
      }

      const payload = (await response.json()) as AiAssistantResponse;
      return payload;
    } finally {
      clearTimeout(timeout);
    }
  }

  async analyzeTranscript(transcript: NormalizedTranscript): Promise<TranscriptAnalysis> {
    if (!transcript || !Array.isArray(transcript.messages)) {
      throw new Error('Normalized transcript with messages is required');
    }

    const prompt = buildAnalysisPrompt({
      source: transcript.source,
      subject: transcript.subject,
      originalId: transcript.originalId,
      createdAt: transcript.createdAt,
      messages: transcript.messages,
      tags: transcript.tags,
      metadata: transcript.metadata
    });

    const safePrompt = this.ensurePromptIsSafe(prompt);

    const body = {
      model: this.model,
      task: 'transcript_analysis',
      prompt: safePrompt,
      metadata: {
        source: transcript.source,
        messageCount: transcript.messages.length,
        tags: transcript.tags || []
      }
    };

    let response;
    try {
      response = await this.requestWithTimeout(body);
    } catch (error) {
      await sleep(200);
      throw error instanceof Error ? error : new Error('AI assistant request failed');
    }

    const keyIssues = Array.isArray(response.keyIssues)
      ? response.keyIssues.filter(issue => typeof issue === 'string').map(issue => issue.trim()).filter(Boolean)
      : [];

    const sentiment = ['positive', 'neutral', 'negative', 'mixed'].includes(response.sentiment?.toLowerCase?.() ?? '')
      ? (response.sentiment as TranscriptAnalysis['sentiment'])
      : 'neutral';

    return {
      summary: response.summary?.trim() || 'No summary generated.',
      sentiment,
      keyIssues,
      aiNotes: response.notes?.trim() || null
    };
  }
}

export default AiAssistant;
