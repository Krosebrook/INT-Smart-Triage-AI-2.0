-- SCIM provisioning storage

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS scim_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT,
    user_name TEXT NOT NULL,
    name JSONB NOT NULL CHECK (jsonb_typeof(name) = 'object'),
    display_name TEXT,
    emails JSONB NOT NULL CHECK (jsonb_typeof(emails) = 'array'),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    preferred_language TEXT,
    locale TEXT,
    title TEXT,
    timezone TEXT,
    data_residency_region TEXT NOT NULL DEFAULT 'us-east-1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_name),
    UNIQUE (external_id)
);

ALTER TABLE scim_users
    ADD CONSTRAINT fk_scim_users_region
    FOREIGN KEY (data_residency_region)
    REFERENCES data_residency_regions(region_code);

CREATE INDEX IF NOT EXISTS idx_scim_users_user_name ON scim_users (user_name);
CREATE INDEX IF NOT EXISTS idx_scim_users_external_id ON scim_users (external_id);
CREATE INDEX IF NOT EXISTS idx_scim_users_region ON scim_users (data_residency_region);
CREATE INDEX IF NOT EXISTS idx_scim_users_active ON scim_users (active);

ALTER TABLE scim_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny public access" ON scim_users;
CREATE POLICY "Deny public access" ON scim_users
    FOR ALL
    TO public
    USING (false)
    WITH CHECK (false);

DROP POLICY IF EXISTS "Allow service role manage scim users" ON scim_users;
CREATE POLICY "Allow service role manage scim users" ON scim_users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE TRIGGER set_scim_users_updated_at
    BEFORE UPDATE ON scim_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

