import { z } from "zod";

type Fetch = typeof fetch;

const slaAlertSchema = z.object({
  reportId: z.string().min(1),
  ticketId: z.number().int().positive().optional(),
  slaType: z.enum(["first_response", "resolution"]),
  severity: z.enum(["warning", "critical"]),
  breachDetectedAt: z.coerce.date(),
  dueAt: z.coerce.date(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedTo: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  recipients: z
    .object({
      email: z.array(z.string().email()).nonempty().optional(),
      cc: z.array(z.string().email()).optional(),
      webhookUrl: z.string().url().optional(),
    })
    .default({}),
});

export type SlaAlertInput = z.input<typeof slaAlertSchema>;
export type SlaAlertPayload = z.output<typeof slaAlertSchema>;

const defaultHeaders: Record<string, string> = {
  "Content-Type": "application/json",
};

function resolveEdgeEndpoint(): string {
  const direct = import.meta.env?.VITE_SLA_ALERT_ENDPOINT;
  if (direct) return direct;

  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Supabase URL is not configured");
  }

  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/slaAlert`;
}

function buildSlaRequest(payload: SlaAlertPayload) {
  return {
    eventType: "SLA_BREACH" as const,
    reportId: payload.reportId,
    ticketId: payload.ticketId,
    slaType: payload.slaType,
    severity: payload.severity,
    breachDetectedAt: payload.breachDetectedAt.toISOString(),
    dueAt: payload.dueAt.toISOString(),
    priority: payload.priority,
    assignedTo: payload.assignedTo,
    organizationId: payload.organizationId,
    notify: {
      email: Boolean(payload.recipients.email?.length),
      webhook: Boolean(payload.recipients.webhookUrl),
    },
    email: payload.recipients.email?.length
      ? {
          to: payload.recipients.email,
          cc: payload.recipients.cc,
        }
      : undefined,
    webhook: payload.recipients.webhookUrl
      ? {
          url: payload.recipients.webhookUrl,
        }
      : undefined,
    metadata: payload.metadata ?? {},
  };
}

export class NotificationService {
  #fetch: Fetch;
  #edgeEndpoint?: string;

  constructor(fn: Fetch = fetch, endpoint?: string) {
    const boundFetch = fn.bind(globalThis) as Fetch;
    this.#fetch = ((...args: Parameters<Fetch>) => boundFetch(...args)) as Fetch;
    this.#edgeEndpoint = endpoint;
  }

  configureEndpoint(endpoint: string) {
    this.#edgeEndpoint = endpoint;
  }

  async sendSlaBreachAlert(input: SlaAlertInput) {
    const payload = slaAlertSchema.parse(input);
    const request = buildSlaRequest(payload);
    const endpoint = this.#edgeEndpoint ?? resolveEdgeEndpoint();

    const response = await this.#fetch(endpoint, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Failed to dispatch SLA alert: ${response.status} ${message}`);
    }

    return {
      endpoint,
      request,
      response: await response.json().catch(() => ({})),
    };
  }
}

export const notificationService = new NotificationService();
