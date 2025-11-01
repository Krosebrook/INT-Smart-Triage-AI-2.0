import { ApiError } from './errors.js';
import type {
  HealthStatus,
  KnowledgeBaseArticle,
  KnowledgeBaseRequest,
  ReportSubmission,
  ReportSubmissionResponse,
  ResponseReview,
  ResponseReviewRequest,
  TemplateRequest,
  TemplateResponse,
  TriageRequest,
  TriageResponse
} from './types.js';

export interface ClientOptions {
  baseUrl: string;
  apiKey?: string;
  apiKeyHeader?: string;
  defaultHeaders?: Record<string, string>;
  fetchImpl?: typeof fetch;
}

const DEFAULT_HEADERS: Record<string, string> = {
  Accept: 'application/json'
};

export class IntSmartTriageClient {
  private readonly baseUrl: URL;
  private readonly apiKey?: string;
  private readonly apiKeyHeader: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ClientOptions) {
    if (!options?.baseUrl) {
      throw new Error('baseUrl is required');
    }

    this.baseUrl = new URL(options.baseUrl);
    this.apiKey = options.apiKey;
    this.apiKeyHeader = options.apiKeyHeader ?? 'X-API-Key';
    this.defaultHeaders = { ...DEFAULT_HEADERS, ...(options.defaultHeaders ?? {}) };
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private buildUrl(path: string): string {
    const url = new URL(path.replace(/^\//, ''), this.baseUrl);
    return url.toString();
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { ...this.defaultHeaders };

    if (this.apiKey) {
      headers[this.apiKeyHeader] = this.apiKey;
    }

    const hasBody = body !== undefined && body !== null;
    const requestInit: RequestInit = {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined
    };

    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await this.fetchImpl(this.buildUrl(path), requestInit);
    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new ApiError(
        `Request to ${path} failed with status ${response.status}`,
        response.status,
        payload
      );
    }

    return payload as T;
  }

  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('GET', '/api/public/v1/health');
  }

  async createTriageReport(payload: TriageRequest): Promise<TriageResponse> {
    return this.request<TriageResponse>('POST', '/api/public/v1/triage-reports', payload);
  }

  async submitReport(payload: ReportSubmission): Promise<ReportSubmissionResponse> {
    return this.request<ReportSubmissionResponse>('POST', '/api/public/v1/reports', payload);
  }

  async generateKnowledgeBaseArticle(
    payload: KnowledgeBaseRequest
  ): Promise<KnowledgeBaseArticle> {
    return this.request<KnowledgeBaseArticle>(
      'POST',
      '/api/public/v1/knowledge-base/articles',
      payload
    );
  }

  async generateResponseTemplate(payload: TemplateRequest): Promise<TemplateResponse> {
    return this.request<TemplateResponse>('POST', '/api/public/v1/response-templates', payload);
  }

  async reviewResponse(payload: ResponseReviewRequest): Promise<ResponseReview> {
    return this.request<ResponseReview>('POST', '/api/public/v1/response-reviews', payload);
  }
}
