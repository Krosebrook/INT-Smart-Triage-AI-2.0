/*
  # Add Integration Tracking Tables for INT System Integrations

  This migration adds tables to track synchronization status with external systems:
  - HubSpot (CRM)
  - Freshdesk (Help Desk)
  - Microsoft Teams (Communication)
  - Notion (optional Knowledge Base)

  Tables:
  1. external_integrations - Overall integration health and status
  2. hubspot_contacts_sync - Maps customer profiles to HubSpot contacts
  3. freshdesk_tickets_sync - Maps triage reports to Freshdesk tickets
  4. sync_queue - Async sync tasks with retry logic
  5. integration_errors - Error logging for failed syncs

  Security:
  - All tables have Row Level Security (RLS) enabled
  - Service role can manage all records
*/

-- ============================================================================
-- 1. External Integrations Table (Integration Health Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_type TEXT NOT NULL UNIQUE, -- 'hubspot', 'freshdesk', 'teams', 'notion'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'error', 'disabled', 'configuring'
    last_sync_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,
    error_count INT DEFAULT 0,
    last_error_message TEXT,
    last_error_at TIMESTAMPTZ,
    config JSONB DEFAULT '{}'::jsonb, -- Integration-specific configuration
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_integrations_type ON external_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_external_integrations_status ON external_integrations(status);

ALTER TABLE external_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage external integrations"
    ON external_integrations FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE external_integrations IS 'Tracks health and status of all external system integrations';

-- ============================================================================
-- 2. HubSpot Contacts Sync Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS hubspot_contacts_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL UNIQUE, -- Internal customer ID
    hubspot_contact_id TEXT UNIQUE, -- HubSpot contact ID (vid)
    hubspot_contact_vid BIGINT, -- HubSpot numeric contact ID
    sync_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'synced', 'error', 'conflict'
    sync_direction TEXT DEFAULT 'bidirectional', -- 'to_hubspot', 'from_hubspot', 'bidirectional'
    last_synced_at TIMESTAMPTZ,
    last_modified_source TEXT, -- 'int' or 'hubspot' - who made the last change
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hubspot_sync_customer_id ON hubspot_contacts_sync(customer_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_contact_id ON hubspot_contacts_sync(hubspot_contact_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_status ON hubspot_contacts_sync(sync_status);

ALTER TABLE hubspot_contacts_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage hubspot sync"
    ON hubspot_contacts_sync FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE hubspot_contacts_sync IS 'Maps INT customer profiles to HubSpot contacts';

-- ============================================================================
-- 3. Freshdesk Tickets Sync Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS freshdesk_tickets_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT NOT NULL UNIQUE, -- INT triage report ID
    freshdesk_ticket_id BIGINT UNIQUE, -- Freshdesk ticket ID
    sync_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'synced', 'error', 'conflict'
    sync_direction TEXT DEFAULT 'bidirectional', -- 'to_freshdesk', 'from_freshdesk', 'bidirectional'
    last_synced_at TIMESTAMPTZ,
    last_modified_source TEXT, -- 'int' or 'freshdesk' - who made the last change
    status_mapping JSONB DEFAULT '{}'::jsonb, -- Map INT status to Freshdesk status
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_freshdesk_sync_report_id ON freshdesk_tickets_sync(report_id);
CREATE INDEX IF NOT EXISTS idx_freshdesk_sync_ticket_id ON freshdesk_tickets_sync(freshdesk_ticket_id);
CREATE INDEX IF NOT EXISTS idx_freshdesk_sync_status ON freshdesk_tickets_sync(sync_status);

ALTER TABLE freshdesk_tickets_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage freshdesk sync"
    ON freshdesk_tickets_sync FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE freshdesk_tickets_sync IS 'Maps INT triage reports to Freshdesk tickets';

-- ============================================================================
-- 4. Sync Queue Table (Async Task Processing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_type TEXT NOT NULL, -- 'hubspot', 'freshdesk', 'teams'
    operation TEXT NOT NULL, -- 'create', 'update', 'delete', 'sync'
    entity_type TEXT NOT NULL, -- 'contact', 'ticket', 'message'
    entity_id TEXT NOT NULL, -- Internal entity ID
    payload JSONB NOT NULL, -- Data to sync
    priority INT DEFAULT 5, -- 1 (highest) to 10 (lowest)
    status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    error_message TEXT,
    scheduled_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_integration ON sync_queue(integration_type);
CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);

ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage sync queue"
    ON sync_queue FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE sync_queue IS 'Queue for async synchronization tasks with retry logic';

-- ============================================================================
-- 5. Integration Errors Table (Error Logging)
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_type TEXT NOT NULL,
    operation TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    error_code TEXT,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    request_payload JSONB,
    response_payload JSONB,
    severity TEXT DEFAULT 'error', -- 'warning', 'error', 'critical'
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_errors_type ON integration_errors(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_errors_severity ON integration_errors(severity);
CREATE INDEX IF NOT EXISTS idx_integration_errors_resolved ON integration_errors(resolved);
CREATE INDEX IF NOT EXISTS idx_integration_errors_created ON integration_errors(created_at);

ALTER TABLE integration_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage integration errors"
    ON integration_errors FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE integration_errors IS 'Comprehensive error logging for integration failures';

-- ============================================================================
-- 6. Initialize Default Integration Records
-- ============================================================================

INSERT INTO external_integrations (integration_type, status, config)
VALUES
    ('hubspot', 'configuring', '{"enabled": false}'::jsonb),
    ('freshdesk', 'configuring', '{"enabled": false}'::jsonb),
    ('teams', 'configuring', '{"enabled": false}'::jsonb),
    ('notion', 'disabled', '{"enabled": false}'::jsonb)
ON CONFLICT (integration_type) DO NOTHING;

-- ============================================================================
-- 7. Helper Functions
-- ============================================================================

-- Function to increment error count for an integration
CREATE OR REPLACE FUNCTION increment_integration_errors(p_integration_type TEXT, p_error_message TEXT)
RETURNS void AS $$
BEGIN
    UPDATE external_integrations
    SET
        error_count = error_count + 1,
        last_error_message = p_error_message,
        last_error_at = now(),
        updated_at = now(),
        status = CASE
            WHEN error_count + 1 >= 10 THEN 'error'
            ELSE status
        END
    WHERE integration_type = p_integration_type;
END;
$$ LANGUAGE plpgsql;

-- Function to mark sync as successful
CREATE OR REPLACE FUNCTION mark_sync_success(p_integration_type TEXT)
RETURNS void AS $$
BEGIN
    UPDATE external_integrations
    SET
        last_sync_at = now(),
        error_count = 0,
        last_error_message = NULL,
        status = CASE
            WHEN status = 'error' THEN 'active'
            ELSE status
        END,
        updated_at = now()
    WHERE integration_type = p_integration_type;
END;
$$ LANGUAGE plpgsql;

-- Function to get next queued sync task
CREATE OR REPLACE FUNCTION get_next_sync_task()
RETURNS TABLE (
    task_id UUID,
    integration_type TEXT,
    operation TEXT,
    entity_type TEXT,
    entity_id TEXT,
    payload JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sq.id,
        sq.integration_type,
        sq.operation,
        sq.entity_type,
        sq.entity_id,
        sq.payload
    FROM sync_queue sq
    WHERE sq.status = 'queued'
        AND sq.scheduled_at <= now()
        AND sq.retry_count < sq.max_retries
    ORDER BY sq.priority ASC, sq.scheduled_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. Triggers for Auto-updating Timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_external_integrations_updated_at
    BEFORE UPDATE ON external_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_hubspot_sync_updated_at
    BEFORE UPDATE ON hubspot_contacts_sync
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_freshdesk_sync_updated_at
    BEFORE UPDATE ON freshdesk_tickets_sync
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
