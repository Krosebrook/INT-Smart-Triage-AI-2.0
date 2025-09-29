/**
 * Secure Clerk Authentication Client
 * Dynamically fetches publishableKey from server to prevent client-side exposure
 */

class SecureClerkAuth {
    constructor() {
        this.clerk = null;
        this.isInitialized = false;
        this.user = null;
        this.token = null;
    }

    /**
     * Initialize Clerk authentication by securely fetching publishableKey from server
     */
    async initialize() {
        try {
            // Fetch publishableKey from secure server endpoint
            const configResponse = await fetch('/api/auth-config');
            
            if (!configResponse.ok) {
                throw new Error(`Failed to fetch auth config: ${configResponse.status}`);
            }
            
            const authConfig = await configResponse.json();
            
            if (!authConfig.success || !authConfig.publishableKey) {
                throw new Error('Invalid authentication configuration received');
            }
            
            // Validate publishableKey format
            if (!authConfig.publishableKey.startsWith('pk_')) {
                throw new Error('Invalid publishableKey format received from server');
            }
            
            // Load Clerk script dynamically
            await this.loadClerkScript();
            
            // Initialize Clerk with securely fetched publishableKey
            this.clerk = new window.Clerk(authConfig.publishableKey);
            await this.clerk.load();
            
            // Set up authentication state listeners
            this.setupAuthListeners();
            
            this.isInitialized = true;
            console.log('✅ Clerk authentication initialized securely');
            
            return this.clerk;
            
        } catch (error) {
            console.error('❌ Failed to initialize Clerk authentication:', error);
            throw new Error(`Authentication initialization failed: ${error.message}`);
        }
    }
    
    /**
     * Load Clerk script dynamically
     */
    async loadClerkScript() {
        return new Promise((resolve, reject) => {
            // Check if Clerk is already loaded
            if (window.Clerk) {
                return resolve();
            }
            
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@clerk/clerk-js@4/dist/clerk.browser.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Clerk script'));
            document.head.appendChild(script);
        });
    }
    
    /**
     * Set up authentication state listeners
     */
    setupAuthListeners() {
        if (!this.clerk) return;
        
        this.clerk.addListener(({ user }) => {
            this.user = user;
            this.onAuthStateChanged(user);
        });
    }
    
    /**
     * Auth state change handler - can be overridden
     */
    onAuthStateChanged(user) {
        // Emit custom event for UI to listen to
        const event = new CustomEvent('authStateChanged', { 
            detail: { user, isAuthenticated: !!user } 
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Get current authentication token
     */
    async getToken() {
        if (!this.isInitialized || !this.user) {
            return null;
        }
        
        try {
            this.token = await this.clerk.session.getToken();
            return this.token;
        } catch (error) {
            console.error('Failed to get authentication token:', error);
            return null;
        }
    }
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.isInitialized && !!this.user;
    }
    
    /**
     * Sign in with redirect
     */
    async signIn() {
        if (!this.isInitialized) {
            throw new Error('Clerk not initialized');
        }
        
        return this.clerk.redirectToSignIn();
    }
    
    /**
     * Sign out
     */
    async signOut() {
        if (!this.isInitialized) {
            throw new Error('Clerk not initialized');
        }
        
        await this.clerk.signOut();
        this.user = null;
        this.token = null;
    }
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }
    
    /**
     * Make authenticated API request
     */
    async authenticatedFetch(url, options = {}) {
        const token = await this.getToken();
        
        const authHeaders = token ? {
            'Authorization': `Bearer ${token}`
        } : {};
        
        return fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                ...options.headers
            }
        });
    }
}

// For browsers that don't support ES modules, provide global access
if (typeof window !== 'undefined') {
    window.SecureClerkAuth = new SecureClerkAuth();
}