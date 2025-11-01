import crypto from 'node:crypto';
import { z } from 'zod';
import { integrationRegistry } from '../../src/integrations/index.js';
import {
  IntegrationAuthError,
  IntegrationValidationError,
  IntegrationError
} from '../../src/integrations/errors.js';
import { setSecurityHeaders, validateHttpMethod } from '../../src/utils/security.js';

const WEBHOOK_METHODS = ['POST'];
const ZENDESK_KEY = 'zendesk';

type QueryValue = string | string[] | undefined;

type RequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, QueryValue>;
  rawBody?: unknown;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => ResponseLike | void;
  setHeader: (name: string, value: string) => void;
};

const webhookPayloadSchema = z
  .object({
    metadata: z
      .object({
        event_type: z.string().min(1),
        generated_at: z.string().min(1)
      })
      .passthrough(),
    payload: z.record(z.any())
  })
  .strict();

function toBuffer(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return Buffer.from(value);
  }

  if (value === undefined || value === null) {
    return Buffer.from('');
  }

  return Buffer.from(JSON.stringify(value));
}

function extractHeader(headers: RequestLike['headers'], name: string): string | undefined {
  const header = headers[name.toLowerCase()] ?? headers[name];

  if (Array.isArray(header)) {
    return header[0];
  }

  return header;
}

function verifySignature(rawBody: Buffer, providedSignature: string | undefined, secret: string) {
  if (!providedSignature) {
    throw new IntegrationAuthError('Missing Zendesk webhook signature');
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    throw new IntegrationAuthError('Zendesk webhook signature mismatch');
  }

  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    throw new IntegrationAuthError('Zendesk webhook signature mismatch');
  }
}

function handleError(error: unknown, res: ResponseLike) {
  const integrationError =
    error instanceof IntegrationError
      ? error
      : new IntegrationError('Unexpected Zendesk webhook error', { cause: error });

  if (process.env.NODE_ENV === 'development') {
    console.error('Zendesk webhook error:', integrationError);
  } else {
    console.error('Zendesk webhook error:', integrationError.message);
  }

  res.status(integrationError.statusCode ?? 500).json({
    error: integrationError.name,
    message: integrationError.message
  });
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  setSecurityHeaders(res);

  if (!validateHttpMethod(req, res, WEBHOOK_METHODS)) {
    return;
  }

  try {
    const secrets = integrationRegistry.resolveWebhookSecrets(ZENDESK_KEY);
    const rawBody = toBuffer(req.rawBody ?? req.body ?? '');
    const signature = extractHeader(req.headers, 'x-zendesk-webhook-signature');

    verifySignature(rawBody, signature, secrets.signingSecret);

    let parsed;

    try {
      parsed = JSON.parse(rawBody.toString('utf8'));
    } catch (error) {
      throw new IntegrationValidationError('Invalid JSON payload received from Zendesk', {
        cause: error
      });
    }

    const result = webhookPayloadSchema.safeParse(parsed);

    if (!result.success) {
      throw new IntegrationValidationError('Invalid Zendesk webhook payload', {
        details: result.error.flatten()
      });
    }

    const event = result.data.metadata.event_type;

    res.status(202).json({
      success: true,
      eventType: event
    });
  } catch (error) {
    handleError(error, res);
  }
}
