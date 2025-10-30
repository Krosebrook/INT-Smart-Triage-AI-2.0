import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ClientInfo {
  ipAddress: string;
  userAgent: string;
  sessionId: string | null;
  timestamp: string;
}

export function setSecurityHeaders(res: ServerResponse): void;
export function extractClientInfo(req: IncomingMessage & { headers: Record<string, string> }): ClientInfo;
export function validateHttpMethod(
  req: IncomingMessage & { method?: string },
  res: ServerResponse & { status: (code: number) => ServerResponse; json: (payload: unknown) => void },
  allowedMethods: string[]
): boolean;
export function createRateLimiter(windowMs?: number, maxRequests?: number): (
  req: IncomingMessage & { headers: Record<string, string> },
  res: ServerResponse & { status: (code: number) => ServerResponse; json: (payload: unknown) => void }
) => boolean;
