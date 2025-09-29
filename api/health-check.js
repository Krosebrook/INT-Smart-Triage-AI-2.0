/**
 * Health Check API Endpoint
 * Verifies system status and Supabase connectivity
 * Enhanced with centralized error handling and structured logging
 */

import { createClient } from '@supabase/supabase-js';
import { generateRequestId, createContextLogger, logRequest, logResponse } from '../lib/logger.js';
import { handleApiError, APIError, ErrorTypes } from '../lib/errorHandler.js';

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
            persistSession: false
        }
    });
}

export default async function handler(req, res) {
    // Generate request ID for correlation
    const requestId = generateRequestId();
    req.requestId = requestId;
    
    // Create context logger
    const contextLogger = createContextLogger(requestId, null, '/api/health-check');
    
    // Log incoming request
    logRequest(contextLogger, req);
    
    // Record start time for response time tracking
    const startTime = Date.now();

    try {
        // Set security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        // Only allow GET requests
        if (req.method !== 'GET') {
            throw new APIError(
                ErrorTypes.VALIDATION_ERROR,
                'Only GET requests are allowed',
                { allowedMethods: ['GET'] }
            );
        }

        // Check cache first (10s cache as required)
        const now = Date.now();
        if (healthCheckCache.data && (now - healthCheckCache.timestamp) < CACHE_DURATION) {
            const responseTime = Date.now() - startTime;
            logResponse(contextLogger, res, 200, responseTime);
            
            contextLogger.debug('Health check served from cache', {
                cacheAge: Math.floor((now - healthCheckCache.timestamp) / 1000),
                responseTime: `${responseTime}ms`
            });

            return res.status(200).json({
                ...healthCheckCache.data,
                requestId,
                cached: true,
                cacheAge: Math.floor((now - healthCheckCache.timestamp) / 1000)
            });
        }

        // Create promise with 3s timeout as required
        const healthCheck = new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new APIError(
                    ErrorTypes.EXTERNAL_SERVICE_ERROR,
                    'Health check timeout after 3 seconds'
                ));
            }, 3000);

            try {
                const result = await performHealthCheck();
                clearTimeout(timeout);
                resolve(result);
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });

        const healthData = await healthCheck;
        
        const responseTime = Date.now() - startTime;
        logResponse(contextLogger, res, 200, responseTime);
        
        // Cache successful results for 10s as required
        healthCheckCache = {
            data: { ...healthData, requestId },
            timestamp: now
        };

        contextLogger.info('Health check completed successfully', {
            status: healthData.status,
            databaseStatus: healthData.checks.database,
            rlsStatus: healthData.checks.rls,
            responseTime: `${responseTime}ms`
        });

        return res.status(200).json({ ...healthData, requestId });

    } catch (error) {
        const responseTime = Date.now() - startTime;
        logResponse(contextLogger, res, error.statusCode || 500, responseTime);
        
        return handleApiError(error, req, res, contextLogger, requestId);
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
            rls: 'unknown'
        }
    };
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
        }

        return healthData;
}