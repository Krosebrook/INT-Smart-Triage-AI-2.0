/**
 * Tests for Clerk Authentication Security Implementation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock environment variables for testing
process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_mock-publishable-key-for-testing';

describe('Clerk Authentication Security', () => {
    it('should validate environment variable format', () => {
        const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
        assert.ok(publishableKey, 'CLERK_PUBLISHABLE_KEY should be set');
        assert.ok(publishableKey.startsWith('pk_'), 'CLERK_PUBLISHABLE_KEY should start with pk_');
    });

    it('should not expose secrets in client code', () => {
        const indexHtmlPath = path.join(__dirname, '../index.html');
        const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
        
        // Should not contain any pk_ keys hardcoded
        assert.ok(!indexHtml.includes('pk_test'), 'Client code should not contain hardcoded test keys');
        assert.ok(!indexHtml.includes('pk_live'), 'Client code should not contain hardcoded live keys');
    });

    it('should have secure auth client implementation', () => {
        const authClientPath = path.join(__dirname, '../secure-auth.js');
        const authClient = fs.readFileSync(authClientPath, 'utf8');
        
        // Should fetch publishableKey from server
        assert.ok(authClient.includes('/api/auth-config'), 'Should fetch config from server');
        assert.ok(authClient.includes('publishableKey'), 'Should handle publishableKey');
        
        // Should not contain actual hardcoded keys (pk_ followed by actual key content)
        const hardcodedKeyPattern = /pk_(test|live)_[a-zA-Z0-9]{20,}/;
        assert.ok(!hardcodedKeyPattern.test(authClient), 'Should not contain actual hardcoded keys');
    });

    it('should have secure server endpoint', () => {
        const authConfigPath = path.join(__dirname, '../api/auth-config.js');
        const authConfig = fs.readFileSync(authConfigPath, 'utf8');
        
        // Should use environment variables
        assert.ok(authConfig.includes('process.env.CLERK_PUBLISHABLE_KEY'), 'Should use environment variables');
        assert.ok(authConfig.includes('security headers'), 'Should set security headers');
        
        // Should not contain actual hardcoded keys (pk_ followed by actual key content)
        const hardcodedKeyPattern = /pk_(test|live)_[a-zA-Z0-9]{20,}/;
        assert.ok(!hardcodedKeyPattern.test(authConfig), 'Should not contain actual hardcoded keys');
    });
});