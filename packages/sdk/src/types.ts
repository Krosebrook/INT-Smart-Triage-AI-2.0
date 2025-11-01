export type CustomerTone = 'calm' | 'neutral' | 'frustrated' | 'urgent';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TriageRequest {
  customerName: string;
  ticketSubject: string;
  issueDescription: string;
  customerTone: CustomerTone;
  csrAgent: string;
}

export interface TriageResponse {
  success: boolean;
  reportId: string;
  timestamp: string;
  priority: PriorityLevel;
  category: string;
  confidence: string;
  responseApproach: string;
  talkingPoints: string[];
  knowledgeBase: string[];
  kbArticleDraft?: string | null;
  managementSummary?: string | null;
  crmForwardingData?: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  security: Record<string, unknown>;
}

export interface ReportSubmission {
  reportId: string;
  customerName: string;
  ticketSubject: string;
  issueDescription: string;
  customerTone: string;
  priority: string;
  category: string;
  confidenceScore: number;
  responseApproach: string;
  talkingPoints: string[];
  knowledgeBase: string[];
  csrAgent: string;
  createdAt: string;
  processedAt: string;
  metadata?: Record<string, unknown>;
}

export interface ReportSubmissionResponse {
  success: boolean;
  reportId: string;
  createdAt: string;
  priority: string;
  category: string;
  confidenceScore: number;
}

export interface KnowledgeBaseMessage {
  sender_type: string;
  message: string;
}

export interface KnowledgeBaseRequest {
  subject: string;
  description?: string;
  messages?: KnowledgeBaseMessage[];
}

export interface KnowledgeBaseArticle {
  title: string;
  content: string;
  category: 'technical' | 'billing' | 'account' | 'general';
  tags: string[];
}

export interface TemplateRequest {
  category: string;
  tone: string;
  context: string;
}

export interface TemplateResponse {
  template: string;
}

export interface ResponseReviewRequest {
  response: string;
  ticketSubject?: string;
  ticketDescription?: string;
  customerName?: string;
}

export interface ResponseReview {
  tone_score: number;
  completeness_score: number;
  professionalism_score: number;
  suggestions: string[];
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  environment: string;
  checks: {
    api: string;
    database: string;
    rls: string;
  };
  security?: string;
  warnings?: string[];
  cached?: boolean;
  cacheAge?: number;
  error?: {
    message: string;
    timestamp: string;
  };
}
