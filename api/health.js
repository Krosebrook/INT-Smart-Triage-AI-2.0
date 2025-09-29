/**
 * Health check endpoint for INT Smart Triage AI 2.0
 * Vercel Serverless Function using Node.js 20 runtime
 */

export default function handler(req, res) {
  // Set CORS headers for security
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests for health check
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts GET requests'
    });
  }

  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'INT Smart Triage AI 2.0',
      version: '2.0.0',
      runtime: 'Node.js 20',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during health check',
      timestamp: new Date().toISOString()
    });
  }
}