import { strict as assert } from 'node:assert';
import test from 'node:test';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ZodError } from 'zod';
import {
  buildObjectKey,
  collectCompliancePayload,
  ComplianceExportPayload,
  loadConfig,
  run,
  uploadPayload
} from '../scripts/jobs/complianceExport';

class MockQueryBuilder<T extends Record<string, unknown>> {
  private rows: T[];
  private filterColumn?: keyof T;
  private filterValue?: string;

  constructor(rows: T[]) {
    this.rows = rows;
  }

  select(): this {
    return this;
  }

  order(column: keyof T, options: { ascending: boolean }): this {
    const direction = options.ascending ? 1 : -1;
    this.rows = [...this.rows].sort((a, b) => {
      const left = String(a[column] ?? '');
      const right = String(b[column] ?? '');
      return left.localeCompare(right) * direction;
    });
    return this;
  }

  gte(column: keyof T, value: string): this {
    this.filterColumn = column;
    this.filterValue = value;
    return this;
  }

  async range(start: number, end: number): Promise<{ data: T[]; error: null }> {
    let filtered = this.rows;
    if (this.filterColumn && this.filterValue) {
      filtered = filtered.filter((row) => String(row[this.filterColumn!]) >= this.filterValue!);
    }
    return { data: filtered.slice(start, end + 1), error: null };
  }
}

class MockSupabaseClient {
  private readonly tables: Record<string, Record<string, unknown>[]>;

  constructor(tables: Record<string, Record<string, unknown>[]>) {
    this.tables = tables;
  }

  from(tableName: string): MockQueryBuilder<Record<string, unknown>> {
    if (!(tableName in this.tables)) {
      throw new Error(`Table ${tableName} not mocked`);
    }
    return new MockQueryBuilder(this.tables[tableName]);
  }
}

class MockS3Client {
  public lastCommand: PutObjectCommand | null = null;

  async send(command: PutObjectCommand): Promise<void> {
    this.lastCommand = command;
  }
}

test('loadConfig validates environment variables', () => {
  const env = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    COMPLIANCE_EXPORT_BUCKET: 'secure-audit-bucket',
    COMPLIANCE_EXPORT_REGION: 'us-east-1',
    COMPLIANCE_EXPORT_PREFIX: 'daily/',
    COMPLIANCE_EXPORT_KMS_KEY_ID: 'kms-1234'
  };

  const config = loadConfig(env);
  assert.equal(config.SUPABASE_URL, env.SUPABASE_URL);
  assert.equal(config.COMPLIANCE_EXPORT_BUCKET, env.COMPLIANCE_EXPORT_BUCKET);
});

test('loadConfig rejects missing configuration', () => {
  assert.throws(() => loadConfig({}), /Required/);
});

test('collectCompliancePayload aggregates audit logs and role assignments', async () => {
  const tables = {
    audit_logs: [
      {
        id: '1',
        created_at: '2024-01-01T00:00:00Z',
        organization_id: 'org-1',
        user_id: 'user-1',
        action: 'login',
        entity_type: 'session',
        entity_id: 'sess-1',
        old_value: null,
        new_value: null,
        ip_address: '127.0.0.1',
        user_agent: 'Chrome'
      }
    ],
    'access_control.roles': [
      { id: 'role-admin', key: 'admin' }
    ],
    'access_control.user_roles': [
      {
        user_id: 'user-1',
        organization_id: 'org-1',
        role_id: 'role-admin',
        assigned_by: 'user-2',
        assigned_at: '2024-01-01T00:01:00Z'
      }
    ]
  } satisfies Record<string, Record<string, unknown>[]>;

  const client = new MockSupabaseClient(tables);
  const payload = await collectCompliancePayload(client as unknown as SupabaseClient);

  assert.equal(payload.auditLogs.length, 1);
  assert.equal(payload.roleAssignments.length, 1);
  assert.equal(payload.roleAssignments[0].role_key, 'admin');
});

test('buildObjectKey respects prefix and timestamp', () => {
  const timestamp = new Date('2024-01-01T00:00:00.000Z');
  const key = buildObjectKey(
    {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
      COMPLIANCE_EXPORT_BUCKET: 'bucket',
      COMPLIANCE_EXPORT_REGION: 'us-east-1',
      COMPLIANCE_EXPORT_PREFIX: 'exports',
      COMPLIANCE_EXPORT_KMS_KEY_ID: undefined
    },
    timestamp
  );

  assert.equal(key, 'exports/compliance/audit-logs-2024-01-01T00-00-00.000Z.json.gz');
});

test('uploadPayload writes encrypted artifact to S3', async () => {
  const config = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    COMPLIANCE_EXPORT_BUCKET: 'secure-bucket',
    COMPLIANCE_EXPORT_REGION: 'us-east-1',
    COMPLIANCE_EXPORT_PREFIX: undefined,
    COMPLIANCE_EXPORT_KMS_KEY_ID: 'kms-1234'
  };
  const payload: ComplianceExportPayload = {
    generatedAt: '2024-01-01T00:00:00Z',
    auditLogs: [],
    roleAssignments: [],
    version: 'test'
  };
  const s3 = new MockS3Client();
  const key = await uploadPayload(s3 as unknown as any, config, payload, new Date('2024-01-01T00:00:00Z'));

  assert.equal(key, 'compliance/audit-logs-2024-01-01T00-00-00.000Z.json.gz');
  assert.ok(s3.lastCommand instanceof PutObjectCommand);
  const input = (s3.lastCommand as PutObjectCommand).input;
  assert.equal(input?.ServerSideEncryption, 'aws:kms');
  assert.equal(input?.Metadata?.payload_version, 'test');
});

test('run surfaces configuration failures', async () => {
  const envBackup = { ...process.env };
  try {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    process.env.COMPLIANCE_EXPORT_BUCKET = 'bucket';
    process.env.COMPLIANCE_EXPORT_REGION = 'us-east-1';

    await assert.rejects(async () => run(), (error) => {
      assert.ok(error instanceof ZodError, 'Expected ZodError for invalid configuration');
      return true;
    });
  } finally {
    Object.keys(process.env).forEach((key) => {
      delete process.env[key];
    });
    Object.assign(process.env, envBackup);
  }
});
