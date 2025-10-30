/*
  Workflow Rules Schema
  Defines tables to manage composable workflow automations, including
  nodes, edges, and version history.
*/

-- Workflow rule metadata
CREATE TABLE IF NOT EXISTS workflow_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    trigger_summary TEXT NOT NULL DEFAULT 'unconfigured',
    revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
    concurrency_limit INTEGER NOT NULL DEFAULT 1 CHECK (concurrency_limit > 0 AND concurrency_limit <= 50),
    timeout_seconds INTEGER NOT NULL DEFAULT 300 CHECK (timeout_seconds BETWEEN 30 AND 86400),
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_workflow_rules_org ON workflow_rules (organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_status ON workflow_rules (status);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_updated_at ON workflow_rules (updated_at DESC);

-- Store the latest published version of a workflow rule. The editor can
-- keep draft versions in this table with immutable JSON definition payloads.
CREATE TABLE IF NOT EXISTS workflow_rule_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES workflow_rules(id) ON DELETE CASCADE,
    version INTEGER NOT NULL CHECK (version > 0),
    is_latest BOOLEAN NOT NULL DEFAULT false,
    definition JSONB NOT NULL CHECK (jsonb_typeof(definition) = 'object'),
    validation_errors JSONB DEFAULT '[]'::jsonb,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_rule_versions_rule_version
    ON workflow_rule_versions (rule_id, version);
CREATE INDEX IF NOT EXISTS idx_workflow_rule_versions_latest
    ON workflow_rule_versions (rule_id) WHERE is_latest;

-- Nodes that compose the workflow graph. Each node belongs to a workflow rule
-- and stores both visual metadata and the configuration payload required to
-- execute that node.
CREATE TABLE IF NOT EXISTS workflow_rule_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES workflow_rules(id) ON DELETE CASCADE,
    node_key TEXT NOT NULL,
    node_type TEXT NOT NULL CHECK (node_type IN ('trigger', 'condition', 'action')), 
    variant TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    position JSONB NOT NULL DEFAULT '{"x":0,"y":0}'::jsonb
        CHECK (
            jsonb_typeof(position) = 'object'
            AND (position ? 'x')
            AND (position ? 'y')
        ),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE (rule_id, node_key)
);

CREATE INDEX IF NOT EXISTS idx_workflow_rule_nodes_rule ON workflow_rule_nodes (rule_id);
CREATE INDEX IF NOT EXISTS idx_workflow_rule_nodes_type ON workflow_rule_nodes (node_type);

-- Directed edges between workflow nodes. Guards allow conditional flows.
CREATE TABLE IF NOT EXISTS workflow_rule_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES workflow_rules(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES workflow_rule_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES workflow_rule_nodes(id) ON DELETE CASCADE,
    guard JSONB NOT NULL DEFAULT '{"type":"always"}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE (rule_id, source_node_id, target_node_id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_rule_edges_rule ON workflow_rule_edges (rule_id);
CREATE INDEX IF NOT EXISTS idx_workflow_rule_edges_source ON workflow_rule_edges (source_node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_rule_edges_target ON workflow_rule_edges (target_node_id);

-- Execution audit log capturing workflow runs and node level results.
CREATE TABLE IF NOT EXISTS workflow_rule_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES workflow_rules(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
    input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    error JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_rule_runs_rule ON workflow_rule_runs (rule_id);
CREATE INDEX IF NOT EXISTS idx_workflow_rule_runs_org ON workflow_rule_runs (organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_rule_runs_status ON workflow_rule_runs (status);
CREATE INDEX IF NOT EXISTS idx_workflow_rule_runs_started ON workflow_rule_runs (started_at DESC);

-- Run events capture per-node execution data for observability.
CREATE TABLE IF NOT EXISTS workflow_rule_run_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES workflow_rule_runs(id) ON DELETE CASCADE,
    node_id UUID REFERENCES workflow_rule_nodes(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('started', 'completed', 'skipped', 'errored')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'ignored')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_workflow_rule_run_events_run ON workflow_rule_run_events (run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_rule_run_events_node ON workflow_rule_run_events (node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_rule_run_events_event ON workflow_rule_run_events (event_type);

-- Row Level Security (RLS)
ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_rule_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_rule_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_rule_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_rule_run_events ENABLE ROW LEVEL SECURITY;

-- Organization scoped access policies
CREATE POLICY "Users can view workflow rules in their organization"
    ON workflow_rules FOR SELECT
    TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage workflow rules in their organization"
    ON workflow_rules FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Users can view workflow rule versions in their organization"
    ON workflow_rule_versions FOR SELECT
    TO authenticated
    USING (rule_id IN (
        SELECT id FROM workflow_rules
        WHERE organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Admins can manage workflow rule versions"
    ON workflow_rule_versions FOR ALL
    TO authenticated
    USING (rule_id IN (
        SELECT id FROM workflow_rules
        WHERE organization_id IN (
            SELECT organization_id FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    ));

CREATE POLICY "Users can view workflow nodes"
    ON workflow_rule_nodes FOR SELECT
    TO authenticated
    USING (rule_id IN (
        SELECT id FROM workflow_rules
        WHERE organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Admins can manage workflow nodes"
    ON workflow_rule_nodes FOR ALL
    TO authenticated
    USING (rule_id IN (
        SELECT id FROM workflow_rules
        WHERE organization_id IN (
            SELECT organization_id FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    ));

CREATE POLICY "Users can view workflow edges"
    ON workflow_rule_edges FOR SELECT
    TO authenticated
    USING (rule_id IN (
        SELECT id FROM workflow_rules
        WHERE organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Admins can manage workflow edges"
    ON workflow_rule_edges FOR ALL
    TO authenticated
    USING (rule_id IN (
        SELECT id FROM workflow_rules
        WHERE organization_id IN (
            SELECT organization_id FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    ));

CREATE POLICY "Users can view workflow runs"
    ON workflow_rule_runs FOR SELECT
    TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can manage workflow runs"
    ON workflow_rule_runs FOR ALL
    TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_profiles
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
    ));

CREATE POLICY "Users can view workflow run events"
    ON workflow_rule_run_events FOR SELECT
    TO authenticated
    USING (run_id IN (
        SELECT id FROM workflow_rule_runs
        WHERE organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Admins can manage workflow run events"
    ON workflow_rule_run_events FOR ALL
    TO authenticated
    USING (run_id IN (
        SELECT id FROM workflow_rule_runs
        WHERE organization_id IN (
            SELECT organization_id FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    ));

-- Service role bypass policies for trusted backend operations
CREATE POLICY "Service role manages workflow rules"
    ON workflow_rules FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages workflow rule versions"
    ON workflow_rule_versions FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages workflow rule nodes"
    ON workflow_rule_nodes FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages workflow rule edges"
    ON workflow_rule_edges FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages workflow rule runs"
    ON workflow_rule_runs FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages workflow rule run events"
    ON workflow_rule_run_events FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);
