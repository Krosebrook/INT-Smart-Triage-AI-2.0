export interface NormalizedTranscriptRecord {
  transcript_id: string;
  created_at: string;
  summary: string;
  sentiment: string;
  key_issues: string[];
  [key: string]: unknown;
}

export class DatabaseService {
  isInitialized: boolean;
  constructor();
  insertNormalizedTranscript(record: Record<string, unknown>): Promise<NormalizedTranscriptRecord>;
}
