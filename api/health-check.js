// Health check endpoint for INT Smart Triage AI
// Vercel serverless function

export default async function handler(req, res) {
  // Set CORS headers for security
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      status: 'error', 
      message: 'Method not allowed' 
    });
  }
  
  try {
    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        status: 'error',
        message: 'Missing required environment variables',
        timestamp: new Date().toISOString()
      });
    }
    
    // Basic health check response
    const healthData = {
      status: 'healthy',
      message: 'INT Smart Triage AI is operational',
      timestamp: new Date().toISOString(),
      environment: {
        supabaseConfigured: !!supabaseUrl && !!supabaseKey,
        nodeVersion: process.version
      }
    };
    
    return res.status(200).json(healthData);
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during health check',
      timestamp: new Date().toISOString()
    });
  }
}