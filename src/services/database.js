/**
 * Database service with improved error handling and connection management
 */

import { createClient } from '@supabase/supabase-js';

export class DatabaseService {
  constructor() {
    this.supabase = null;
    this.isInitialized = false;
    this.configurationError = null;

    try {
      this.initializeClient();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Supabase configuration error: secure service role key required.';
      this.configurationError = error instanceof Error ? error : new Error(message);
      console.error(message);
      throw this.configurationError;
    }
  }

  initializeClient() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      const missing = [];
      if (!supabaseUrl) missing.push('SUPABASE_URL');
      if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      const requirement = missing.length > 1 ? 'are required for secure database access.' : 'is required for secure database access.';
      throw new Error(`Supabase configuration error: ${missing.join(', ')} ${requirement}`);
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      });
      this.isInitialized = true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Supabase configuration error: failed to initialize client (${reason}).`);
    }
  }

  async testConnection() {
    if (!this.isInitialized || !this.supabase) {
      throw new Error('Database not initialized');
    }

    try {
      const { error } = await this.supabase
        .from('reports')
        .select('count', { count: 'exact', head: true });

      if (error) {
        // RLS blocking is expected and indicates proper security
        if (error.message.includes('RLS') || error.message.includes('permission denied')) {
          return { status: 'healthy', rls: 'enforced' };
        }
        throw error;
      }

      return { status: 'healthy', rls: 'needs_verification' };
    } catch (error) {
      throw new Error(`Database connection test failed: ${error.message}`);
    }
  }

  async insertReport(reportData) {
    if (!this.isInitialized || !this.supabase) {
      throw new Error('Database not initialized');
    }

    try {
      const { data, error } = await this.supabase
        .from('reports')
        .insert([reportData])
        .select('report_id, created_at, priority, category, confidence_score')
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Database insert error:', error);
      throw new Error(`Failed to save report: ${error.message}`);
    }
  }

  async getReportById(reportId) {
    if (!this.isInitialized || !this.supabase) {
      throw new Error('Database not initialized');
    }

    try {
      const { data, error } = await this.supabase
        .from('reports')
        .select('*')
        .eq('report_id', reportId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Database select error:', error);
      throw new Error(`Failed to retrieve report: ${error.message}`);
    }
  }

  async getReportsByAgent(csrAgent, limit = 50) {
    if (!this.isInitialized || !this.supabase) {
      throw new Error('Database not initialized');
    }

    try {
      const { data, error } = await this.supabase
        .from('reports')
        .select('report_id, customer_name, priority, created_at')
        .eq('csr_agent', csrAgent)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Database select error:', error);
      throw new Error(`Failed to retrieve reports: ${error.message}`);
    }
  }
}