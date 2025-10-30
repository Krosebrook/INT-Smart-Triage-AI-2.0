/**
 * SCIM utility helpers for validation, parsing, and payload shaping
 */

import { z } from 'zod';

export const scimEmailSchema = z
  .object({
    value: z.string().email('SCIM email must be valid'),
    type: z.string().optional(),
    primary: z.boolean().optional(),
  })
  .transform((email) => ({
    ...email,
    primary: email.primary ?? false,
  }));

export const scimNameSchema = z.object({
  givenName: z.string().min(1, 'givenName is required'),
  familyName: z.string().min(1, 'familyName is required'),
  middleName: z.string().optional(),
});

export const scimCreateUserSchema = z.object({
  schemas: z.array(z.string()).optional(),
  userName: z.string().min(1, 'userName is required'),
  externalId: z.string().optional(),
  name: scimNameSchema,
  displayName: z.string().optional(),
  preferredLanguage: z.string().optional(),
  locale: z.string().optional(),
  title: z.string().optional(),
  timezone: z.string().optional(),
  emails: z.array(scimEmailSchema).nonempty('At least one email is required'),
  active: z.boolean().optional().default(true),
  dataResidencyRegion: z.string().optional(),
});

export const scimPatchSchema = z.object({
  schemas: z.array(z.string()).optional(),
  Operations: z
    .array(
      z.object({
        op: z.string().min(1),
        path: z.string().optional(),
        value: z.any().optional(),
      })
    )
    .min(1, 'At least one patch operation is required'),
});

export function parseScimFilter(filter) {
  if (!filter) {
    return null;
  }

  const normalized = filter.trim();
  const match = normalized.match(/^(\w+)\s+eq\s+\"?([^\"]+)\"?$/i);
  if (!match) {
    throw new Error('Unsupported SCIM filter expression');
  }

  const [, attribute, value] = match;

  if (!['userName', 'externalId', 'active'].includes(attribute)) {
    throw new Error(`Unsupported SCIM filter attribute: ${attribute}`);
  }

  if (attribute === 'active') {
    return { attribute, value: value.toLowerCase() === 'true' };
  }

  return { attribute, value };
}

export function buildScimUserResource(row) {
  if (!row) {
    return null;
  }

  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    id: row.id,
    userName: row.user_name,
    externalId: row.external_id,
    name: row.name,
    displayName: row.display_name,
    active: row.active,
    emails: row.emails,
    preferredLanguage: row.preferred_language,
    locale: row.locale,
    title: row.title,
    timezone: row.timezone,
    dataResidencyRegion: row.data_residency_region,
    meta: {
      resourceType: 'User',
      created: row.created_at,
      lastModified: row.updated_at,
      location: `/api/scim/v2/Users/${row.id}`,
    },
  };
}

export function applyPatchOperations(original, operations) {
  if (!original) {
    throw new Error('Cannot apply SCIM patch operations to empty payload');
  }

  const patched = JSON.parse(JSON.stringify(original));

  for (const operation of operations) {
    const op = operation.op?.toLowerCase();
    const rawPath = operation.path?.trim();
    const path = rawPath ? rawPath.toLowerCase() : undefined;

    if (op !== 'replace' && op !== 'add' && op !== 'remove') {
      throw new Error(`Unsupported SCIM patch operation: ${operation.op}`);
    }

    if (op === 'remove') {
      if (!path) {
        throw new Error('Remove operation requires a path');
      }
      if (path === 'active') {
        patched.active = false;
      } else if (path === 'emails') {
        patched.emails = [];
      } else if (path.startsWith('name.')) {
        const field = rawPath.slice(rawPath.indexOf('.') + 1);
        if (patched.name) {
          delete patched.name[field];
        }
      } else {
        throw new Error(`Unsupported remove path: ${operation.path}`);
      }
      continue;
    }

    if (path === 'active') {
      patched.active = Boolean(operation.value);
      continue;
    }

    if (path === 'displayname') {
      patched.displayName = operation.value;
      continue;
    }

    if (path === 'dataresidencyregion') {
      patched.dataResidencyRegion = operation.value;
      continue;
    }

    if (path && path.startsWith('name.')) {
      const field = rawPath.slice(rawPath.indexOf('.') + 1);
      if (!patched.name) {
        patched.name = {};
      }
      patched.name[field] = operation.value;
      continue;
    }

    if (path === 'emails') {
      const emails = Array.isArray(operation.value) ? operation.value : [operation.value];
      const parsedEmails = z.array(scimEmailSchema).parse(emails);
      patched.emails = parsedEmails;
      continue;
    }

    if (!path && (op === 'replace' || op === 'add')) {
      if (typeof operation.value !== 'object') {
        throw new Error('SCIM patch value must be an object when path is omitted');
      }
      Object.assign(patched, operation.value);
      continue;
    }

    throw new Error(`Unsupported patch path: ${operation.path}`);
  }

  return patched;
}

