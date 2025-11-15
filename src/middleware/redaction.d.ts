export interface TranscriptRecord {
  subject?: string;
  summary?: string;
  key_issues?: string[];
  metadata?: Record<string, unknown>;
  messages?: Array<{
    text?: string;
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export function redactText(text: string): string;
export function redactTranscriptRecord<T extends TranscriptRecord>(record: T): T;
