/*
  Customer Profile Aggregate Metrics Schema
  -----------------------------------------
  Stores derived health metrics for each customer profile.
*/

CREATE TABLE IF NOT EXISTS customer_profile_metrics (
    customer_id TEXT PRIMARY KEY,
    total_tickets INTEGER NOT NULL DEFAULT 0,
    open_tickets INTEGER NOT NULL DEFAULT 0,
    resolved_tickets INTEGER NOT NULL DEFAULT 0,
    high_priority_tickets INTEGER NOT NULL DEFAULT 0,
    escalated_tickets INTEGER NOT NULL DEFAULT 0,
    avg_resolution_time_minutes NUMERIC(10,2),
    avg_first_response_minutes NUMERIC(10,2),
    last_ticket_created_at TIMESTAMPTZ,
    last_contact_at TIMESTAMPTZ,
    sentiment_score NUMERIC(5,2),
    sentiment_bucket TEXT CHECK (sentiment_bucket IN ('detractor', 'passive', 'promoter') OR sentiment_bucket IS NULL),
    escalation_rate NUMERIC(5,2),
    csat_score NUMERIC(5,2),
    health_score NUMERIC(5,2),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_profile_metrics_health
    ON customer_profile_metrics(health_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_customer_profile_metrics_updated
    ON customer_profile_metrics(updated_at DESC);

CREATE OR REPLACE FUNCTION touch_customer_profile_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_profile_metrics_updated
    ON customer_profile_metrics;

CREATE TRIGGER trg_customer_profile_metrics_updated
    BEFORE UPDATE ON customer_profile_metrics
    FOR EACH ROW
    EXECUTE FUNCTION touch_customer_profile_metrics_updated_at();

ALTER TABLE customer_profile_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access"
    ON customer_profile_metrics FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can read metrics"
    ON customer_profile_metrics FOR SELECT
    TO authenticated
    USING (true);
