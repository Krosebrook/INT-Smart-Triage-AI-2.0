import { createHash } from 'crypto';
import { gzipSync } from 'zlib';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  COMPLIANCE_EXPORT_BUCKET: z.string().min(3),
  COMPLIANCE_EXPORT_REGION: z.string().min(1),
  COMPLIANCE_EXPORT_PREFIX: z.string().optional(),
  COMPLIANCE_EXPORT_KMS_KEY_ID: z.string().optional()
});

type ExportConfig = z.infer<typeof envSchema>;

const auditLogRecordSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  organization_id: z.string().nullable(),
  user_id: z.string().nullable(),
  action: z.string(),
  entity_type: z.string().nullable(),
  entity_id: z.string().nullable(),
  old_value: z.record(z.any()).nullable(),
  new_value: z.record(z.any()).nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable()
});

type AuditLogRecord = z.infer<typeof auditLogRecordSchema>;

const roleAssignmentRowSchema = z.object({
  user_id: z.string(),
  organization_id: z.string(),
  role_id: z.string(),
  assigned_by: z.string().nullable(),
  assigned_at: z.string()
});

type RoleAssignmentRow = z.infer<typeof roleAssignmentRowSchema>;

type RoleAssignmentRecord = RoleAssignmentRow & {
  user_id: string;
  organization_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
  role_key: string;
};

export type ComplianceExportPayload = {
  generatedAt: string;
  auditLogs: AuditLogRecord[];
  roleAssignments: RoleAssignmentRecord[];
  version: string;
};

export function loadConfig(source: NodeJS.ProcessEnv = process.env): ExportConfig {
  return envSchema.parse(source);
}

async function fetchPaginated<T>(
  queryFactory: (rangeStart: number, rangeEnd: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
  validator: z.ZodType<T>,
  batchSize = 500
): Promise<T[]> {
  const rows: T[] = [];
  let rangeStart = 0;

  while (true) {
    const rangeEnd = rangeStart + batchSize - 1;
    const { data, error } = await queryFactory(rangeStart, rangeEnd);

    if (error) {
      throw new Error(error.message);
    }

    const parsed = validator.array().parse(data ?? []);
    rows.push(...parsed);

    if (!Array.isArray(data) || data.length < batchSize) {
      break;
    }

    rangeStart += batchSize;
  }

  return rows;
}

async function fetchAuditLogRecords(client: SupabaseClient, since?: string): Promise<AuditLogRecord[]> {
  return fetchPaginated<AuditLogRecord>(
    async (rangeStart, rangeEnd) => {
      const query = client
        .from('audit_logs')
        .select(
          'id, created_at, organization_id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent'
        )
        .order('created_at', { ascending: true })
        .range(rangeStart, rangeEnd);

      if (since) {
        query.gte('created_at', since);
      }

      return query;
    },
    auditLogRecordSchema
  );
}

async function fetchRoleAssignments(client: SupabaseClient): Promise<RoleAssignmentRecord[]> {
  const roles = await fetchPaginated<{ id: string; key: string }>(
    (rangeStart, rangeEnd) =>
      client
        .from('access_control.roles')
        .select('id, key')
        .order('key', { ascending: true })
        .range(rangeStart, rangeEnd),
    z.object({ id: z.string(), key: z.string() })
  );

  const roleIndex = new Map(roles.map((role) => [role.id, role.key]));

  const assignments = await fetchPaginated<RoleAssignmentRow>(
    async (rangeStart, rangeEnd) =>
      client
        .from('access_control.user_roles')
        .select('user_id, organization_id, role_id, assigned_by, assigned_at')
        .order('assigned_at', { ascending: true })
        .range(rangeStart, rangeEnd),
    roleAssignmentRowSchema
  );

  return assignments.map((record) => ({
    ...record,
    role_key: roleIndex.get(record.role_id) ?? 'unknown'
  }));
}

export async function collectCompliancePayload(
  client: SupabaseClient,
  options: { since?: string } = {}
): Promise<ComplianceExportPayload> {
  const [auditLogs, roleAssignments] = await Promise.all([
    fetchAuditLogRecords(client, options.since),
    fetchRoleAssignments(client)
  ]);

  return {
    generatedAt: new Date().toISOString(),
    auditLogs,
    roleAssignments,
    version: '2024-11-01'
  };
}

export function createS3Client(config: ExportConfig): S3Client {
  return new S3Client({ region: config.COMPLIANCE_EXPORT_REGION });
}

export function buildObjectKey(config: ExportConfig, timestamp = new Date()): string {
  const prefix = config.COMPLIANCE_EXPORT_PREFIX ? config.COMPLIANCE_EXPORT_PREFIX.replace(/\/*$/, '/') : '';
  const safeTimestamp = timestamp.toISOString().replace(/[:]/g, '-');
  return `${prefix}compliance/audit-logs-${safeTimestamp}.json.gz`;
}

export async function uploadPayload(
  s3: S3Client,
  config: ExportConfig,
  payload: ComplianceExportPayload,
  timestamp = new Date()
): Promise<string> {
  const json = JSON.stringify(payload);
  const checksum = createHash('sha256').update(json).digest('base64');
  const compressed = gzipSync(Buffer.from(json, 'utf-8'));
  const key = buildObjectKey(config, timestamp);

  const putObjectCommand = new PutObjectCommand({
    Bucket: config.COMPLIANCE_EXPORT_BUCKET,
    Key: key,
    Body: compressed,
    ContentType: 'application/json',
    ContentEncoding: 'gzip',
    ChecksumSHA256: checksum,
    ServerSideEncryption: config.COMPLIANCE_EXPORT_KMS_KEY_ID ? 'aws:kms' : 'AES256',
    SSEKMSKeyId: config.COMPLIANCE_EXPORT_KMS_KEY_ID,
    Metadata: {
      payload_version: payload.version,
      generated_at: payload.generatedAt
    }
  });

  await s3.send(putObjectCommand);
  return key;
}

export async function run(now = new Date()): Promise<string> {
  const config = loadConfig();
  const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
  const payload = await collectCompliancePayload(supabase);
  const s3 = createS3Client(config);
  return uploadPayload(s3, config, payload, now);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run()
    .then((key) => {
      console.log(`Compliance export written to s3://${process.env.COMPLIANCE_EXPORT_BUCKET}/${key}`);
    })
    .catch((error) => {
      console.error('Compliance export failed', { message: error.message });
      process.exitCode = 1;
    });
}
