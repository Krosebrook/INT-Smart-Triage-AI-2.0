/**
 * Supabase Client Initialization
 * Shared Supabase client configuration for all API endpoints
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Supabase client instance with service role authentication
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 */
let supabase;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export default supabase;
