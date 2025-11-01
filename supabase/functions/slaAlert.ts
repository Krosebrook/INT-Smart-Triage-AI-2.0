import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const notificationSchema = z.object({
  eventType: z.literal("SLA_BREACH"),
  reportId: z.string().min(1),
  ticketId: z.number().int().positive().optional(),
  slaType: z.enum(["first_response", "resolution"]),
  severity: z.enum(["warning", "critical"]),
  breachDetectedAt: z.string().datetime(),
  dueAt: z.string().datetime(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedTo: z.string().optional(),
  organizationId: z.string().optional(),
  notify: z
    .object({
      email: z.boolean().optional().default(true),
      webhook: z.boolean().optional().default(false),
    })
    .default({ email: true, webhook: false }),
  email: z
    .object({
      to: z.array(z.string().email()).min(1).optional(),
      cc: z.array(z.string().email()).optional(),
      templateId: z.string().optional(),
      subject: z.string().optional(),
    })
    .optional(),
  webhook: z
    .object({
      url: z.string().url().optional(),
      headers: z.record(z.string()).optional(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

type NotificationPayload = z.infer<typeof notificationSchema>;

type SendResult = {
  channel: "email" | "webhook";
  status: "sent" | "skipped" | "failed";
  detail?: string;
};

async function sendEmailNotification(payload: NotificationPayload): Promise<SendResult> {
  const config = payload.email;
  const sendgridKey = Deno.env.get("SENDGRID_API_KEY");
  const sender = Deno.env.get("SLA_ALERT_SENDER");

  if (!config?.to?.length || !sendgridKey || !sender) {
    return {
      channel: "email",
      status: "skipped",
      detail: "Missing recipients or SENDGRID_API_KEY/SLA_ALERT_SENDER",
    };
  }

  const body = {
    personalizations: [
      {
        to: config.to.map((email) => ({ email })),
        cc: config.cc?.map((email) => ({ email })),
        dynamic_template_data: {
          reportId: payload.reportId,
          ticketId: payload.ticketId,
          slaType: payload.slaType,
          severity: payload.severity,
          breachDetectedAt: payload.breachDetectedAt,
          dueAt: payload.dueAt,
          priority: payload.priority,
          assignedTo: payload.assignedTo,
          metadata: payload.metadata ?? {},
        },
      },
    ],
    from: { email: sender },
    subject:
      config.subject ??
      `SLA ${payload.slaType.replace("_", " ").toUpperCase()} ${payload.severity === "critical" ? "BREACH" : "Warning"}: ${payload.reportId}`,
    content: [
      {
        type: "text/plain",
        value: `Ticket ${payload.reportId} breached the ${payload.slaType} SLA with ${payload.severity} severity at ${payload.breachDetectedAt}.`,
      },
    ],
    template_id: config.templateId,
  };

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sendgridKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("SendGrid error", response.status, errorText);
    return { channel: "email", status: "failed", detail: errorText.slice(0, 250) };
  }

  return { channel: "email", status: "sent" };
}

async function sendWebhookNotification(payload: NotificationPayload): Promise<SendResult> {
  const webhookUrl = payload.webhook?.url ?? Deno.env.get("SLA_ALERT_WEBHOOK_URL");
  if (!webhookUrl) {
    return { channel: "webhook", status: "skipped", detail: "No webhook URL provided" };
  }

  const headers = {
    "Content-Type": "application/json",
    ...(payload.webhook?.headers ?? {}),
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      event: payload.eventType,
      reportId: payload.reportId,
      ticketId: payload.ticketId,
      severity: payload.severity,
      slaType: payload.slaType,
      dueAt: payload.dueAt,
      breachDetectedAt: payload.breachDetectedAt,
      priority: payload.priority,
      assignedTo: payload.assignedTo,
      organizationId: payload.organizationId,
      metadata: payload.metadata ?? {},
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Webhook dispatch failed", response.status, errorText);
    return { channel: "webhook", status: "failed", detail: errorText.slice(0, 250) };
  }

  return { channel: "webhook", status: "sent" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const rawPayload = await req.json();
    const payload = notificationSchema.parse(rawPayload);

    const results: SendResult[] = [];

    if (payload.notify.email) {
      results.push(await sendEmailNotification(payload));
    }

    if (payload.notify.webhook) {
      results.push(await sendWebhookNotification(payload));
    }

    return new Response(
      JSON.stringify({
        success: true,
        reportId: payload.reportId,
        dispatch: results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const status = error instanceof z.ZodError ? 422 : 500;
    const body = error instanceof z.ZodError
      ? { error: "validation_failed", details: error.errors }
      : { error: "internal_error", message: error.message };

    console.error("SLA alert handler failure", body);

    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
