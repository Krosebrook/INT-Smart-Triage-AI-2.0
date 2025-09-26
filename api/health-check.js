/**
 * Health Check API Endpoint
 * Verifies system status and Supabase connectivity
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;

if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

export default async function handler(req, res) {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Method Not Allowed',
            message: 'Only GET requests are allowed'
        });
    }

    const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'INT Smart Triage AI 2.0',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        checks: {
            api: 'healthy',
            database: 'unknown',
            rls: 'unknown'
        }
    };

    try {
        // Check Supabase connection and RLS status
        if (supabase) {
            // Test basic connectivity
            const { data: connectionTest, error: connectionError } = await supabase
                .from('reports')
                .select('count', { count: 'exact', head: true });

            if (connectionError) {
                if (connectionError.message.includes('relation "reports" does not exist')) {
                    healthData.checks.database = 'table_missing';
                    healthData.checks.rls = 'table_missing';
                    healthData.warnings = ['Reports table does not exist. Run database setup.'];
                } else if (connectionError.message.includes('permission denied') || 
                          connectionError.message.includes('RLS')) {
                    healthData.checks.database = 'healthy';
                    healthData.checks.rls = 'enforced';
                    healthData.security = 'RLS properly enforced - public access denied';
                } else {
                    healthData.checks.database = 'error';
                    healthData.checks.rls = 'unknown';
                    healthData.warnings = [`Database connectivity issue: ${connectionError.message}`];
                }
            } else {
                healthData.checks.database = 'healthy';
                healthData.checks.rls = 'needs_verification';
                healthData.warnings = ['Database accessible - verify RLS is properly configured'];
            }

            // Check RLS policies specifically
            try {
                const { data: rlsCheck, error: rlsError } = await supabase.rpc('check_rls_status', {
                    table_name: 'reports'
                });

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
        const hasErrors = Object.values(healthData.checks).some(check => 
            check === 'error' || check === 'not_configured'
        );

        if (hasErrors) {
            healthData.status = 'degraded';
            return res.status(503).json(healthData);
        }

        // System is healthy
        return res.status(200).json(healthData);

    } catch (error) {
        console.error('Health check error:', error);
        
        healthData.status = 'unhealthy';
        healthData.checks.api = 'error';
        healthData.error = {
            message: 'Internal server error during health check',
            timestamp: new Date().toISOString()
        };

        return res.status(500).json(healthData);
    }
}