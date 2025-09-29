#!/usr/bin/env node

/**
 * Local Test Server for Real-time Notification System
 * This is a simple HTTP server to test the notification system locally
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// Simple HTTP server
const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    try {
        if (url.pathname.startsWith('/api/')) {
            await handleApiRequest(req, res, url);
        } else {
            await handleStaticFile(req, res, url);
        }
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
});

// Handle API requests
async function handleApiRequest(req, res, url) {
    const apiPath = url.pathname.replace('/api/', '');
    
    // Import the API handler dynamically
    try {
        const handlerPath = join(__dirname, 'api', `${apiPath}.js`);
        
        if (!existsSync(handlerPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'API endpoint not found' }));
            return;
        }

        const { default: handler } = await import(handlerPath);
        
        // Create request object with query parameters
        const requestBody = await getRequestBody(req);
        const mockReq = {
            method: req.method,
            url: req.url,
            headers: req.headers,
            query: Object.fromEntries(url.searchParams),
            body: requestBody
        };

        const mockRes = {
            writeHead: (statusCode, headers) => {
                res.writeHead(statusCode, headers);
            },
            setHeader: (name, value) => {
                res.setHeader(name, value);
            },
            write: (data) => {
                res.write(data);
            },
            end: (data) => {
                res.end(data);
            },
            status: (code) => ({
                json: (data) => {
                    res.writeHead(code, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(data));
                }
            })
        };

        await handler(mockReq, mockRes);
    } catch (error) {
        console.error('API handler error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'API handler error', 
            message: error.message 
        }));
    }
}

// Handle static files
async function handleStaticFile(req, res, url) {
    let filePath;
    
    if (url.pathname === '/' || url.pathname === '/index.html') {
        filePath = join(__dirname, 'index.html');
    } else if (url.pathname === '/notifications-demo.html') {
        filePath = join(__dirname, 'public', 'notifications-demo.html');
    } else if (url.pathname.startsWith('/public/')) {
        filePath = join(__dirname, url.pathname);
    } else {
        // Try to find file in public directory
        filePath = join(__dirname, 'public', url.pathname);
    }

    if (!existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
    }

    const ext = filePath.split('.').pop().toLowerCase();
    const contentType = {
        'html': 'text/html',
        'js': 'application/javascript',
        'css': 'text/css',
        'json': 'application/json'
    }[ext] || 'text/plain';

    try {
        const content = readFileSync(filePath, 'utf8');
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error reading file');
    }
}

// Get request body
function getRequestBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                resolve({});
            }
        });
    });
}

server.listen(PORT, () => {
    console.log(`🚀 Test server running at http://localhost:${PORT}`);
    console.log(`📱 Demo page: http://localhost:${PORT}/notifications-demo.html`);
    console.log(`🏠 Main app: http://localhost:${PORT}/index.html`);
});