-- Data residency configuration for multi-region support

CREATE TABLE IF NOT EXISTS data_residency_regions (
    region_code TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    supabase_project_ref TEXT NOT NULL,
    encryption_scope TEXT NOT NULL,
    retention_policy JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO data_residency_regions (region_code, description, supabase_project_ref, encryption_scope, retention_policy)
VALUES
    ('us-east-1', 'Primary region - North America', 'project-usa', 'aes-256-gcm', '{"pii_retention_days": 365, "audit_log_retention_days": 730}'),
    ('eu-central-1', 'Secondary region - European Union', 'project-eu', 'aes-256-gcm', '{"pii_retention_days": 365, "audit_log_retention_days": 730, "gdpr": true}'),
    ('ap-southeast-2', 'Secondary region - APAC', 'project-apac', 'aes-256-gcm', '{"pii_retention_days": 365, "audit_log_retention_days": 730}')
ON CONFLICT (region_code) DO UPDATE
SET
    description = EXCLUDED.description,
    supabase_project_ref = EXCLUDED.supabase_project_ref,
    encryption_scope = EXCLUDED.encryption_scope,
    retention_policy = EXCLUDED.retention_policy,
    updated_at = NOW();

ALTER TABLE data_residency_regions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role access" ON data_residency_regions;
CREATE POLICY "Allow service role access" ON data_residency_regions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Deny public access" ON data_residency_regions;
CREATE POLICY "Deny public access" ON data_residency_regions
    FOR ALL
    TO public
    USING (false)
    WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_data_residency_regions_project_ref ON data_residency_regions(supabase_project_ref);

ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS data_residency_region TEXT DEFAULT 'us-east-1';

UPDATE reports
SET data_residency_region = COALESCE(data_residency_region, 'us-east-1');

ALTER TABLE reports
    ALTER COLUMN data_residency_region SET NOT NULL;

ALTER TABLE reports
    ADD CONSTRAINT fk_reports_data_residency
    FOREIGN KEY (data_residency_region)
    REFERENCES data_residency_regions(region_code);

CREATE INDEX IF NOT EXISTS idx_reports_data_residency_region ON reports(data_residency_region);

CREATE TRIGGER set_data_residency_regions_updated_at
    BEFORE UPDATE ON data_residency_regions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

