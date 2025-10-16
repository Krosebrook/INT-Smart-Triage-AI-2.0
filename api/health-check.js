/**
 * Health Check API Endpoint
 * Verifies system status and Supabase connectivity
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
let healthCheckCache = { data: null, timestamp: 0 };
const CACHE_DURATION = 10000; // 10 seconds cache as required

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export default async function handler(req, res) {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET requests are allowed',
    });
  }

  // Check cache first (10s cache as required)
  const now = Date.now();
  if (
    healthCheckCache.data &&
    now - healthCheckCache.timestamp < CACHE_DURATION
  ) {
    return res.status(200).json({
      ...healthCheckCache.data,
      cached: true,
      cacheAge: Math.floor((now - healthCheckCache.timestamp) / 1000),
    });
  }

  try {
    // Create promise with 3s timeout as required
    const healthCheck = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Health check timeout after 3 seconds'));
      }, 3000);

      performHealthCheck()
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });

    const healthData = await healthCheck;

    // Cache successful results for 10s as required
    healthCheckCache = {
      data: healthData,
      timestamp: now,
    };

    return res.status(200).json(healthData);
  } catch (error) {
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'INT Smart Triage AI 2.0',
      version: '1.0.0',
      checks: {
        api: 'error',
        database: 'timeout',
        rls: 'unknown',
      },
      error: {
        message: error.message.includes('timeout')
          ? 'Health check timeout after 3 seconds'
          : 'Internal server error during health check',
        timestamp: new Date().toISOString(),
      },
    };

    return res.status(500).json(errorResponse);
  }
}

async function performHealthCheck() {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'INT Smart Triage AI 2.0',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    checks: {
      api: 'healthy',
      database: 'unknown',
      rls: 'unknown',
    },
  };
  // Check Supabase connection and RLS status
  if (supabase) {
    // Test basic connectivity
    const { error: connectionError } = await supabase
      .from('reports')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      if (
        connectionError.message.includes('relation "reports" does not exist')
      ) {
        healthData.checks.database = 'table_missing';
        healthData.checks.rls = 'table_missing';
        healthData.warnings = [
          'Reports table does not exist. Run database setup.',
        ];
      } else if (
        connectionError.message.includes('permission denied') ||
        connectionError.message.includes('RLS')
      ) {
        healthData.checks.database = 'healthy';
        healthData.checks.rls = 'enforced';
        healthData.security = 'RLS properly enforced - public access denied';
      } else {
        healthData.checks.database = 'error';
        healthData.checks.rls = 'unknown';
        healthData.warnings = [
          `Database connectivity issue: ${connectionError.message}`,
        ];
      }
    } else {
      healthData.checks.database = 'healthy';
      healthData.checks.rls = 'needs_verification';
      healthData.warnings = [
        'Database accessible - verify RLS is properly configured',
      ];
    }

    // Check RLS policies specifically
    try {
      const { data: rlsCheck, error: rlsError } = await supabase.rpc(
        'check_rls_status',
        {
          table_name: 'reports',
        }
      );

      if (!rlsError && rlsCheck) {
        healthData.checks.rls = rlsCheck.rls_enabled ? 'enabled' : 'disabled';
      }
    } catch (rlsCheckError) {
      // RLS check function may not exist, which is expected
      healthData.checks.rls = 'manual_verification_required';
    }
  } else {
    healthData.checks.database = 'not_configured';
    healthData.checks.rls = 'not_configured';
    healthData.warnings = ['Supabase environment variables not configured'];
  }

  // Determine overall health status
  const hasErrors = Object.values(healthData.checks).some(
    (check) => check === 'error' || check === 'not_configured'
  );

  if (hasErrors) {
    healthData.status = 'degraded';
  }

  return healthData;
}
