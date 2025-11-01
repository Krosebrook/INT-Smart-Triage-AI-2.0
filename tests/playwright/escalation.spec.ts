import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import path from "node:path";

async function bundleQueueModule() {
  const result = await build({
    entryPoints: [path.resolve("src/pages/Queue.tsx")],
    bundle: true,
    format: "iife",
    globalName: "QueueBundle",
    platform: "browser",
    target: ["es2020"],
    write: false,
    define: {
      "import.meta.env.VITE_SUPABASE_URL": '"https://example.supabase.co"',
      "import.meta.env.VITE_SUPABASE_ANON_KEY": '"anon"',
      "import.meta.env.VITE_SLA_ALERT_ENDPOINT": '"https://example.supabase.co/functions/v1/slaAlert"',
    },
  });

  return result.outputFiles[0].text;
}

test.describe("Escalation SLA notifications", () => {
  test("sends SLA alert payload when queue action triggered", async ({ page }) => {
    const script = await bundleQueueModule();

    await page.setContent('<div id="queue-root"></div>');

    await page.addScriptTag({ type: "module", content: script + "\nwindow.QueueBundle = QueueBundle;" });

    await page.evaluate(async () => {
      const { QueueDashboardPage, notificationService } = (window as any).QueueBundle;
      (window as any).__slaCalls = [];
      const calls: any[] = (window as any).__slaCalls;
      notificationService.configureEndpoint("https://example.supabase.co/functions/v1/slaAlert");
      notificationService.sendSlaBreachAlert = async (payload) => {
        calls.push(payload);
        return { endpoint: "https://example.supabase.co/functions/v1/slaAlert", request: payload, response: {} };
      };
      const dashboard = new QueueDashboardPage("queue-root");
      await dashboard.init();
      // inject sample tickets representing escalation warning/breach
      dashboard.tickets = [
        {
          id: 123,
          report_id: "RPT-1001",
          customer_name: "Acme Corp",
          ticket_subject: "Critical outage",
          priority: "high",
          status: "in_progress",
          sla_status: "breached",
          assigned_to: "agent-1",
          first_response_due_at: null,
          first_response_at: null,
          resolution_due_at: new Date(Date.now() - 3600_000).toISOString(),
          resolution_at: null,
          created_at: new Date(Date.now() - 7200_000).toISOString(),
          organization_id: null,
        },
      ];
      dashboard.loading = false;
      dashboard.render();
      const button = document.querySelector("button[data-alert]") as HTMLButtonElement | null;
      if (!button) throw new Error("Expected alert button");
      button.click();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const calls = await page.evaluate(() => (window as any).__slaCalls);
    expect(calls).toHaveLength(1);
    const [payload] = calls as any[];
    expect(payload.reportId).toBe("RPT-1001");
    expect(payload.severity).toBe("critical");
    expect(payload.slaType).toBe("resolution");
  });

  test("handles validation errors from SLA alert endpoint", async ({ page }) => {
    const script = await bundleQueueModule();

    await page.setContent('<div id="queue-root"></div>');

    await page.addScriptTag({ type: "module", content: script + "\nwindow.QueueBundle = QueueBundle;" });

    const error = await page.evaluate(async () => {
      const { NotificationService } = (window as any).QueueBundle;
      const failingService = new NotificationService(async () => new Response(
        JSON.stringify({ error: 'validation_failed' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      ));
      failingService.configureEndpoint("https://example.supabase.co/functions/v1/slaAlert");
      try {
        await failingService.sendSlaBreachAlert({
          reportId: "RPT-2000",
          slaType: "resolution",
          severity: "warning",
          breachDetectedAt: new Date(),
          dueAt: new Date(),
          recipients: {},
        } as any);
        return null;
      } catch (err) {
        return (err as Error).message;
      }
    });

    expect(error).toContain("Failed to dispatch SLA alert");
  });
});
