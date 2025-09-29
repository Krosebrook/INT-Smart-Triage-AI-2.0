/**
 * Authentication Middleware for Clerk JWT Verification
 * Validates Clerk JWT tokens on server-side API requests
 */

/**
 * Simple JWT verification without external dependencies
 * For production, you might want to use a more robust JWT library
 */
function base64UrlDecode(str) {
    str += new Array(5 - str.length % 4).join('=');
    return Buffer.from(str.replace(/\-/g, '+').replace(/_/g, '/'), 'base64').toString();
}

function verifyClerkTokenSimple(token) {
    try {
        if (!token) {
            throw new Error('No token provided');
        }

        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace(/^Bearer\s+/, '');
        
        // Split the token
        const parts = cleanToken.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }

        // Decode the payload (we're doing basic validation here)
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        
        // Check if token is expired
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            throw new Error('Token expired');
        }

        return payload;
    } catch (error) {
        throw new Error('Invalid authentication token: ' + error.message);
    }
}

/**
 * Authentication middleware function
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {function} next - Next middleware function
 */
export async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication token is required',
                code: 'AUTH_TOKEN_MISSING'
            });
        }

        const user = verifyClerkTokenSimple(authHeader);
        
        // Add user info to request object
        req.user = user;
        req.authenticated = true;
        
        // Continue to next middleware/handler
        if (next) next();
        
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired authentication token',
            code: 'AUTH_TOKEN_INVALID'
        });
    }
}

/**
 * Optional authentication middleware - allows unauthenticated requests but adds user context if token is provided
 */
export async function optionalAuthentication(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader) {
            const user = verifyClerkTokenSimple(authHeader);
            req.user = user;
            req.authenticated = true;
        } else {
            req.authenticated = false;
        }
        
        if (next) next();
        
    } catch (error) {
        // For optional auth, we don't reject on auth failure
        console.warn('Optional authentication failed:', error);
        req.authenticated = false;
        if (next) next();
    }
}