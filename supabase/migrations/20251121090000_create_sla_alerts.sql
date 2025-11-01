/*
  # SLA Alert Automation

  - Adds SLA tracking columns to reports table
  - Creates sla_alerts table to persist SLA breaches
  - Establishes triggers to set default SLA targets and enqueue alerts
  - Dispatches alerts to the slaAlert edge function when configured
*/

CREATE EXTENSION IF NOT EXISTS pg_net;

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS first_response_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_status TEXT DEFAULT 'on_track' CHECK (sla_status IN ('on_track', 'warning', 'breached', 'resolved'));

CREATE TABLE IF NOT EXISTS sla_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id VARCHAR(50) NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
    ticket_id BIGINT,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('first_response', 'resolution')),
    severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
    breach_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at TIMESTAMPTZ NOT NULL,
    notified_channels JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sla_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages SLA alerts" ON sla_alerts;
CREATE POLICY "Service role manages SLA alerts"
  ON sla_alerts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION set_default_sla_targets()
RETURNS TRIGGER AS $$
DECLARE
  first_response_interval INTERVAL;
  resolution_interval INTERVAL;
BEGIN
  CASE NEW.priority
    WHEN 'high' THEN
      first_response_interval := INTERVAL '15 minutes';
      resolution_interval := INTERVAL '8 hours';
    WHEN 'medium' THEN
      first_response_interval := INTERVAL '30 minutes';
      resolution_interval := INTERVAL '16 hours';
    ELSE
      first_response_interval := INTERVAL '1 hour';
      resolution_interval := INTERVAL '36 hours';
  END CASE;

  IF NEW.first_response_due_at IS NULL THEN
    NEW.first_response_due_at := COALESCE(NEW.created_at, NOW()) + first_response_interval;
  END IF;

  IF NEW.resolution_due_at IS NULL THEN
    NEW.resolution_due_at := COALESCE(NEW.created_at, NOW()) + resolution_interval;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reports_default_sla ON reports;
CREATE TRIGGER reports_default_sla
  BEFORE INSERT OR UPDATE OF priority ON reports
  FOR EACH ROW
  EXECUTE FUNCTION set_default_sla_targets();

CREATE OR REPLACE FUNCTION dispatch_sla_breach(
  alert_row sla_alerts
) RETURNS VOID AS $$
DECLARE
  endpoint TEXT;
  payload JSONB;
BEGIN
  endpoint := current_setting('app.settings.sla_alert_function_url', true);

  IF endpoint IS NULL OR endpoint = '' THEN
    RETURN;
  END IF;

  payload := jsonb_build_object(
    'eventType', 'SLA_BREACH',
    'reportId', alert_row.report_id,
    'ticketId', alert_row.ticket_id,
    'slaType', alert_row.alert_type,
    'severity', alert_row.severity,
    'breachDetectedAt', alert_row.breach_detected_at,
    'dueAt', alert_row.due_at,
    'metadata', alert_row.metadata
  );

  PERFORM
    net.http_post(
      url := endpoint,
      headers := ARRAY['Content-Type: application/json'],
      body := payload::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION evaluate_sla_breach()
RETURNS TRIGGER AS $$
DECLARE
  alert_type TEXT := NULL;
  severity TEXT := NULL;
  due_at TIMESTAMPTZ := NULL;
  alert_row sla_alerts;
BEGIN
  IF NEW.status IN ('resolved', 'closed') THEN
    NEW.sla_status := 'resolved';
    RETURN NEW;
  END IF;

  IF NEW.first_response_due_at IS NOT NULL AND NEW.first_response_at IS NULL AND NEW.first_response_due_at <= NOW() THEN
    alert_type := 'first_response';
    due_at := NEW.first_response_due_at;
  END IF;

  IF NEW.resolution_due_at IS NOT NULL AND NEW.resolution_at IS NULL AND NEW.resolution_due_at <= NOW() THEN
    alert_type := 'resolution';
    due_at := NEW.resolution_due_at;
  END IF;

  IF alert_type IS NULL THEN
    IF NEW.sla_status <> 'on_track' THEN
      NEW.sla_status := 'on_track';
    END IF;
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM sla_alerts a
    WHERE a.report_id = NEW.report_id
      AND a.alert_type = alert_type
      AND a.due_at = due_at
  ) THEN
    RETURN NEW;
  END IF;

  IF NOW() - due_at > INTERVAL '2 hours' THEN
    severity := 'critical';
    NEW.sla_status := 'breached';
  ELSE
    severity := 'warning';
    NEW.sla_status := 'warning';
  END IF;

  INSERT INTO sla_alerts (
    report_id,
    ticket_id,
    alert_type,
    severity,
    due_at,
    metadata
  )
  VALUES (
    NEW.report_id,
    NEW.id,
    alert_type,
    severity,
    due_at,
    jsonb_build_object(
      'priority', NEW.priority,
      'assigned_to', NEW.assigned_to,
      'status', NEW.status,
      'organization_id', NEW.organization_id
    )
  )
  RETURNING * INTO alert_row;

  PERFORM dispatch_sla_breach(alert_row);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reports_sla_breach_insert ON reports;
CREATE TRIGGER reports_sla_breach_insert
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION evaluate_sla_breach();

DROP TRIGGER IF EXISTS reports_sla_breach_update ON reports;
CREATE TRIGGER reports_sla_breach_update
  AFTER UPDATE OF status, first_response_at, resolution_at, updated_at ON reports
  FOR EACH ROW
  EXECUTE FUNCTION evaluate_sla_breach();
