import { DatabaseService } from '../../../services/database.js';
import { setSecurityHeaders, validateHttpMethod } from '../../../utils/security.js';

function initializeDatabaseService() {
  try {
    return new DatabaseService();
  } catch (error) {
    console.error('Database service initialization failed:', error.message);
    return {
      isInitialized: false,
      async testConnection() {
        throw new Error('Database not initialized');
      }
    };
  }
}

let dbService = initializeDatabaseService();
let healthCheckCache = { data: null, timestamp: 0 };
const CACHE_DURATION = 10000;

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

  try {
    const dbStatus = await dbService.testConnection();
    healthData.checks.database = dbStatus.status;
    healthData.checks.rls = dbStatus.rls;

    if (dbStatus.rls === 'enforced') {
      healthData.security = 'RLS properly enforced - public access denied';
    } else if (dbStatus.rls === 'needs_verification') {
      healthData.warnings = ['Database accessible - verify RLS is properly configured'];
    }
  } catch (error) {
    if (error.message.includes('not initialized')) {
      healthData.checks.database = 'not_configured';
      healthData.checks.rls = 'not_configured';
      healthData.warnings = ['Database service not properly configured'];
    } else if (error.message.includes('relation "reports" does not exist')) {
      healthData.checks.database = 'table_missing';
      healthData.checks.rls = 'table_missing';
      healthData.warnings = ['Reports table does not exist. Run database setup.'];
    } else {
      healthData.checks.database = 'error';
      healthData.checks.rls = 'unknown';
      healthData.warnings = [`Database connectivity issue: ${error.message}`];
    }
  }

  const hasErrors = Object.values(healthData.checks).some(check =>
    check === 'error' || check === 'not_configured'
  );

  if (hasErrors) {
    healthData.status = 'degraded';
  }

  return healthData;
}

export async function handleHealthCheck(req, res) {
  setSecurityHeaders(res);

  if (!validateHttpMethod(req, res, ['GET'])) {
    return;
  }

  const now = Date.now();
  if (healthCheckCache.data && now - healthCheckCache.timestamp < CACHE_DURATION) {
    return res.status(200).json({
      ...healthCheckCache.data,
      cached: true,
      cacheAge: Math.floor((now - healthCheckCache.timestamp) / 1000)
    });
  }

  try {
    const healthCheck = Promise.race([
      performHealthCheck(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout after 3 seconds')), 3000)
      )
    ]);

    const healthData = await healthCheck;

    healthCheckCache = {
      data: healthData,
      timestamp: now
    };

    return res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check error:', error);

    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'INT Smart Triage AI 2.0',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      checks: {
        api: 'error',
        database: 'timeout',
        rls: 'unknown'
      },
      error: {
        message: error.message.includes('timeout')
          ? 'Health check timeout after 3 seconds'
          : 'Internal server error during health check',
        timestamp: new Date().toISOString()
      }
    };

    return res.status(500).json(errorResponse);
  }
}

export default handleHealthCheck;
