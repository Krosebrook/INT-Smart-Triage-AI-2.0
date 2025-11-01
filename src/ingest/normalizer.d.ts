export interface TranscriptMessage {
  speaker: 'customer' | 'agent' | 'system';
  text: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface NormalizedTranscript {
  source: 'email' | 'chatgpt';
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

export function normalizeEmailTranscript(payload: Record<string, unknown>): NormalizedTranscript;
export function normalizeChatTranscript(payload: Record<string, unknown>): NormalizedTranscript;
export function normalizeTranscript(sourceType: string, payload: Record<string, unknown>): NormalizedTranscript;
export function buildAnalysisPrompt(normalizedTranscript: NormalizedTranscript): string;
export function createStoragePayload(normalizedTranscript: NormalizedTranscript, analysis: TranscriptAnalysis): Record<string, unknown>;
