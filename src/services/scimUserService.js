import { createClient } from '@supabase/supabase-js';
import { applyPatchOperations, buildScimUserResource } from '../utils/scim.js';

export class ScimUserService {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing for SCIM provisioning');
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'public' },
    });
  }

  async listUsers({ filter, startIndex = 1, count = 100, region } = {}) {
    const from = Math.max(startIndex - 1, 0);
    const to = from + Math.max(count, 1) - 1;

    let query = this.supabase.from('scim_users').select('*', { count: 'exact' }).order('created_at', { ascending: true });

    if (filter?.attribute === 'userName') {
      query = query.eq('user_name', filter.value);
    } else if (filter?.attribute === 'externalId') {
      query = query.eq('external_id', filter.value);
    } else if (filter?.attribute === 'active') {
      query = query.eq('active', filter.value);
    }

    if (region) {
      query = query.eq('data_residency_region', region);
    }

    const { data, error, count: total } = await query.range(from, to);

    if (error) {
      throw new Error(`Failed to list SCIM users: ${error.message}`);
    }

    return {
      resources: (data || []).map(buildScimUserResource),
      totalResults: total ?? 0,
    };
  }

  async getUserById(id) {
    const { data, error } = await this.supabase.from('scim_users').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch SCIM user: ${error.message}`);
    }

    return buildScimUserResource(data);
  }

  async getUserByUserName(userName) {
    const { data, error } = await this.supabase.from('scim_users').select('*').eq('user_name', userName).maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch SCIM user by userName: ${error.message}`);
    }

    return data ? buildScimUserResource(data) : null;
  }

  async getUserByEmail(email) {
    const { data, error } = await this.supabase
      .from('scim_users')
      .select('*')
      .contains('emails', [{ value: email }])
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch SCIM user by email: ${error.message}`);
    }

    return data ? buildScimUserResource(data) : null;
  }

  async createUser(scimPayload) {
    const payload = {
      external_id: scimPayload.externalId || null,
      user_name: scimPayload.userName,
      name: scimPayload.name,
      display_name: scimPayload.displayName || null,
      emails: scimPayload.emails,
      active: scimPayload.active ?? true,
      preferred_language: scimPayload.preferredLanguage || null,
      locale: scimPayload.locale || null,
      title: scimPayload.title || null,
      timezone: scimPayload.timezone || null,
      data_residency_region: scimPayload.dataResidencyRegion || 'us-east-1',
    };

    const { data, error } = await this.supabase.from('scim_users').insert(payload).select('*').single();

    if (error) {
      throw new Error(`Failed to create SCIM user: ${error.message}`);
    }

    return buildScimUserResource(data);
  }

  async replaceUser(id, scimPayload) {
    const payload = {
      external_id: scimPayload.externalId || null,
      user_name: scimPayload.userName,
      name: scimPayload.name,
      display_name: scimPayload.displayName || null,
      emails: scimPayload.emails,
      active: scimPayload.active ?? true,
      preferred_language: scimPayload.preferredLanguage || null,
      locale: scimPayload.locale || null,
      title: scimPayload.title || null,
      timezone: scimPayload.timezone || null,
      data_residency_region: scimPayload.dataResidencyRegion || 'us-east-1',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase.from('scim_users').update(payload).eq('id', id).select('*').single();

    if (error) {
      throw new Error(`Failed to replace SCIM user: ${error.message}`);
    }

    return buildScimUserResource(data);
  }

  async patchUser(id, operations) {
    const current = await this.getRawUserById(id);
    if (!current) {
      return null;
    }

    const mappedCurrent = {
      externalId: current.external_id,
      userName: current.user_name,
      name: current.name,
      displayName: current.display_name,
      emails: current.emails,
      active: current.active,
      preferredLanguage: current.preferred_language,
      locale: current.locale,
      title: current.title,
      timezone: current.timezone,
      dataResidencyRegion: current.data_residency_region,
    };

    const patched = applyPatchOperations(mappedCurrent, operations);

    const dbPayload = {
      external_id: patched.externalId || null,
      user_name: patched.userName,
      name: patched.name,
      display_name: patched.displayName || null,
      emails: patched.emails,
      active: patched.active ?? true,
      preferred_language: patched.preferredLanguage || null,
      locale: patched.locale || null,
      title: patched.title || null,
      timezone: patched.timezone || null,
      data_residency_region: patched.dataResidencyRegion || 'us-east-1',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase.from('scim_users').update(dbPayload).eq('id', id).select('*').single();

    if (error) {
      throw new Error(`Failed to patch SCIM user: ${error.message}`);
    }

    return buildScimUserResource(data);
  }

  async deactivateUser(id) {
    const { data, error } = await this.supabase
      .from('scim_users')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to deactivate SCIM user: ${error.message}`);
    }

    return buildScimUserResource(data);
  }

  async getRawUserById(id) {
    const { data, error } = await this.supabase.from('scim_users').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch SCIM user: ${error.message}`);
    }

    return data;
  }
}

