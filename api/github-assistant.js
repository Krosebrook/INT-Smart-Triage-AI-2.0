/**
 * GitHub Assistant Agent API Endpoint
 *
 * Serverless function that provides access to the GitHub Assistant Agent
 * with 9 modular capabilities for repository analysis and development tasks.
 */

import assistant from '../src/githubAssistant.js';
import { logger } from '../src/logger.js';

/**
 * Main API handler for GitHub Assistant Agent
 *
 * @param {Object} req - Vercel request object
 * @param {Object} res - Vercel response object
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST and GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST or GET.',
    });
  }

  try {
    // GET: Return available capabilities
    if (req.method === 'GET') {
      const capabilities = assistant.getCapabilities();
      return res.status(200).json({
        success: true,
        capabilities,
        version: '1.0.0',
        description: 'GitHub Assistant Agent with 9 modular capabilities',
      });
    }

    // POST: Process a request
    const { request, context } = req.body || {};

    // Validate input
    if (!request || typeof request !== 'string') {
      return res.status(400).json({
        success: false,
        error:
          'Missing or invalid "request" field. Expected a string describing your task.',
      });
    }

    // Process the request
    const result = await assistant.processRequest(request, context || {});

    // Return result with appropriate status code
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    // Use logger for consistent serverless logging
    logger.error('GitHub Assistant API Error', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}
