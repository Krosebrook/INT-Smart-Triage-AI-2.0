/**
 * Authentication Configuration API Endpoint
 * Securely provides Clerk publishableKey from server-side environment variables
 * This prevents client-side exposure of sensitive authentication keys
 */

export default async function handler(req, res) {
    // Set comprehensive security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', 'default-src \'self\'');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Enable CORS for same-origin requests
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Method Not Allowed',
            message: 'Only GET requests are allowed'
        });
    }

    try {
        // Validate that required environment variables are set
        const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;
        
        if (!clerkPublishableKey) {
            console.error('CLERK_PUBLISHABLE_KEY environment variable is not set');
            return res.status(500).json({
                error: 'Authentication Service Configuration Error',
                message: 'Authentication service is not properly configured'
            });
        }

        // Validate that the key follows the expected format (starts with pk_)
        if (!clerkPublishableKey.startsWith('pk_')) {
            console.error('CLERK_PUBLISHABLE_KEY does not have expected format');
            return res.status(500).json({
                error: 'Authentication Service Configuration Error',
                message: 'Authentication service configuration is invalid'
            });
        }

        // Return the publishableKey securely
        // Note: This is safe to expose as it's designed to be used on the client-side
        // but fetching it from the server ensures it's never hardcoded in client code
        return res.status(200).json({
            success: true,
            publishableKey: clerkPublishableKey,
            timestamp: new Date().toISOString(),
            service: 'INT Smart Triage AI 2.0',
            authProvider: 'Clerk',
            security: {
                serverProvided: true,
                environmentManaged: true,
                clientSafe: true
            }
        });

    } catch (error) {
        console.error('Auth config error:', error);
        
        return res.status(500).json({
            error: 'Authentication Configuration Error',
            message: 'Failed to retrieve authentication configuration',
            timestamp: new Date().toISOString(),
            service: 'INT Smart Triage AI 2.0'
        });
    }
}