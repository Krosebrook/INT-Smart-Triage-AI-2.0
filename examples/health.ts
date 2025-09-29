import { logger } from '../lib/log';

/**
 * Health check endpoint example
 * Demonstrates basic logging usage
 */
export function healthCheck(): { status: string; timestamp: string } {
  const startTime = Date.now();
  
  logger.info('health.check.started');
  
  try {
    // Simulate health checks
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    logger.info('health.check.completed', {
      duration: Date.now() - startTime,
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024)
      },
      uptime
    });
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('health.check.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    });
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString()
    };
  }
}

// Example usage
if (require.main === module) {
  console.log('Running health check example...');
  const result = healthCheck();
  console.log('Health check result:', result);
}