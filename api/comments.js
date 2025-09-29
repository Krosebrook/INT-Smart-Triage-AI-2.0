/**
 * Comments API Endpoint
 * Handles creating new comments and triggers real-time notifications
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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

export default async function handler(req, res) {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'POST') {
            return await handleCreateComment(req, res);
        } else if (req.method === 'GET') {
            return await handleGetComments(req, res);
        } else {
            return res.status(405).json({
                error: 'Method Not Allowed',
                message: 'Only GET and POST requests are allowed'
            });
        }
    } catch (error) {
        console.error('Comments API error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to handle comment request',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Contact system administrator'
        });
    }
}

async function handleCreateComment(req, res) {
    // Validate request body
    const { ideaId, userId, commentText, ideaOwnerId } = req.body;

    if (!ideaId || !userId || !commentText) {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Missing required fields: ideaId, userId, commentText'
        });
    }

    // Sanitize inputs
    const sanitizedData = {
        ideaId: ideaId.trim().substring(0, 50),
        userId: userId.trim().substring(0, 100),
        commentText: commentText.trim().substring(0, 2000),
        ideaOwnerId: ideaOwnerId ? ideaOwnerId.trim().substring(0, 100) : null
    };

    // Generate unique comment ID
    const commentId = `CMT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    try {
        // Save comment to database if Supabase is available
        let dbResult = null;
        if (supabase) {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    comment_id: commentId,
                    idea_id: sanitizedData.ideaId,
                    user_id: sanitizedData.userId,
                    comment_text: sanitizedData.commentText,
                    created_at: new Date().toISOString()
                })
                .select();

            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({
                    error: 'Database Error',
                    message: 'Failed to save comment to database'
                });
            }

            dbResult = data[0];
        }

        // Trigger real-time notification
        await triggerCommentNotification(sanitizedData, commentId);

        return res.status(201).json({
            success: true,
            commentId,
            comment: {
                id: commentId,
                ideaId: sanitizedData.ideaId,
                userId: sanitizedData.userId,
                commentText: sanitizedData.commentText,
                createdAt: new Date().toISOString()
            },
            database: {
                saved: !!dbResult,
                recordId: dbResult?.id || null
            }
        });

    } catch (error) {
        console.error('Failed to create comment:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create comment'
        });
    }
}

async function handleGetComments(req, res) {
    const { ideaId, limit = 50 } = req.query;

    if (!ideaId) {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Missing required parameter: ideaId'
        });
    }

    try {
        let comments = [];

        if (supabase) {
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('idea_id', ideaId)
                .order('created_at', { ascending: false })
                .limit(parseInt(limit));

            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({
                    error: 'Database Error',
                    message: 'Failed to fetch comments from database'
                });
            }

            comments = data || [];
        } else {
            // Mock data if no database connection
            comments = [
                {
                    comment_id: 'CMT-DEMO-001',
                    idea_id: ideaId,
                    user_id: 'demo_user',
                    comment_text: 'This is a demo comment for testing the notification system.',
                    created_at: new Date().toISOString()
                }
            ];
        }

        return res.status(200).json({
            success: true,
            ideaId,
            comments,
            total: comments.length,
            limit: parseInt(limit)
        });

    } catch (error) {
        console.error('Failed to fetch comments:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch comments'
        });
    }
}

async function triggerCommentNotification(commentData, commentId) {
    try {
        // Create notification payload
        const notificationPayload = {
            type: 'new_comment',
            message: `New comment on your idea "${commentData.ideaId}" by ${commentData.userId}`,
            data: {
                ideaId: commentData.ideaId,
                commentId: commentId,
                userId: commentData.userId,
                commentText: commentData.commentText.substring(0, 100) + (commentData.commentText.length > 100 ? '...' : ''),
                timestamp: new Date().toISOString()
            },
            targetUserId: commentData.ideaOwnerId
        };

        // Make HTTP request to notifications endpoint to broadcast the notification
        const notificationsUrl = process.env.VERCEL_URL ? 
            `https://${process.env.VERCEL_URL}/api/notifications` :
            `${process.env.HOST || 'http://localhost:3000'}/api/notifications`;

        const response = await fetch(notificationsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notificationPayload)
        });

        if (!response.ok) {
            console.warn('Failed to send notification:', response.status, response.statusText);
        } else {
            const result = await response.json();
            console.log('Notification sent successfully:', result);
        }

    } catch (error) {
        console.error('Failed to trigger notification:', error);
        // Don't fail the comment creation if notification fails
    }
}