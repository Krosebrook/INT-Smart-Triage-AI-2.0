/**
 * Real-time Notifications API Endpoint
 * Handles WebSocket connections for real-time notifications
 */

import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

// Store active connections
const connections = new Map();

export default async function handler(req, res) {
    // Set CORS headers for WebSocket upgrade
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method Not Allowed',
            message: 'Only GET and POST requests are allowed'
        });
    }

    try {
        // For Vercel serverless functions, we need to use a different approach
        // Since we can't maintain persistent WebSocket connections in serverless
        // We'll use Server-Sent Events (SSE) instead which is more suitable
        
        if (req.method === 'GET') {
            // Handle SSE connection for real-time notifications
            return handleSSEConnection(req, res);
        } else if (req.method === 'POST') {
            // Handle notification broadcasting
            return handleNotificationBroadcast(req, res);
        }

    } catch (error) {
        console.error('Notifications API error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to handle notification request',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Contact system administrator'
        });
    }
}

// Handle Server-Sent Events connection for real-time updates
function handleSSEConnection(req, res) {
    // Set headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const clientId = req.query.clientId || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = req.query.userId || 'anonymous';
    
    // Store connection
    connections.set(clientId, { res, userId, connectedAt: Date.now() });

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({
        type: 'connection',
        clientId: clientId,
        message: 'Connected to notification stream',
        timestamp: new Date().toISOString()
    })}\n\n`);

    // Send periodic heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
        if (connections.has(clientId)) {
            res.write(`data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
            })}\n\n`);
        }
    }, 30000); // 30 seconds

    // Handle client disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
        connections.delete(clientId);
        console.log(`Client ${clientId} disconnected from notification stream`);
    });

    req.on('error', (error) => {
        console.error('SSE connection error:', error);
        clearInterval(heartbeat);
        connections.delete(clientId);
    });

    return; // Keep connection open
}

// Handle broadcasting notifications to connected clients
async function handleNotificationBroadcast(req, res) {
    const { type, message, targetUserId, data } = req.body;

    if (!type || !message) {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Missing required fields: type, message'
        });
    }

    const notification = {
        type,
        message,
        data: data || {},
        timestamp: new Date().toISOString(),
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    let broadcastCount = 0;

    // Broadcast to all connected clients (or specific user if targetUserId provided)
    for (const [clientId, connection] of connections.entries()) {
        try {
            if (!targetUserId || connection.userId === targetUserId) {
                connection.res.write(`data: ${JSON.stringify(notification)}\n\n`);
                broadcastCount++;
            }
        } catch (error) {
            console.error(`Failed to send notification to client ${clientId}:`, error);
            // Remove dead connections
            connections.delete(clientId);
        }
    }

    // Log notification to database if Supabase is available
    if (supabase) {
        try {
            await supabase
                .from('notifications')
                .insert({
                    notification_id: notification.id,
                    type: notification.type,
                    message: notification.message,
                    data: notification.data,
                    target_user_id: targetUserId,
                    broadcast_count: broadcastCount,
                    created_at: notification.timestamp
                });
        } catch (dbError) {
            console.error('Failed to log notification to database:', dbError);
        }
    }

    return res.status(200).json({
        success: true,
        notificationId: notification.id,
        broadcastCount,
        activeConnections: connections.size,
        timestamp: notification.timestamp
    });
}

// Export helper function to broadcast notifications from other APIs
export async function broadcastNotification(type, message, data = {}, targetUserId = null) {
    const notificationData = {
        type,
        message,
        data,
        targetUserId
    };

    try {
        // In a real deployment, this would make an HTTP request to the notifications endpoint
        // For now, we'll simulate the broadcast
        const notification = {
            type,
            message,
            data,
            timestamp: new Date().toISOString(),
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        let broadcastCount = 0;
        for (const [clientId, connection] of connections.entries()) {
            try {
                if (!targetUserId || connection.userId === targetUserId) {
                    connection.res.write(`data: ${JSON.stringify(notification)}\n\n`);
                    broadcastCount++;
                }
            } catch (error) {
                console.error(`Failed to send notification to client ${clientId}:`, error);
                connections.delete(clientId);
            }
        }

        return { success: true, broadcastCount, notificationId: notification.id };
    } catch (error) {
        console.error('Failed to broadcast notification:', error);
        return { success: false, error: error.message };
    }
}