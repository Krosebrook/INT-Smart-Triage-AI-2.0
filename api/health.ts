/**
 * Health Check API Endpoint
 * 
 * This endpoint provides a robust health probe for the INT Smart Triage AI system.
 * 
 * Checks performed:
 * - Supabase: Non-destructive ping via SELECT query
 * - Gemini AI: API availability check with 3s timeout
 * - CRM Forwarding: Stub check (placeholder for future implementation)
 * 
 * Features:
 * - Parallel execution of all health checks for optimal performance
 * - Result caching with 10 second TTL to reduce load
 * - Status aggregation: OPERATIONAL (all services up) | DEGRADED (some issues) | FAILURE (critical services down)
 * - 3 second timeout enforcement via AbortController
 * - Comprehensive error handling and logging
 * 
 * Response Format:
 * {
 *   "overall_status": "OPERATIONAL|DEGRADED|FAILURE",
 *   "timestamp": "ISO 8601 timestamp",
 *   "services": {
 *     "supabase": { "status": "up|down", "response_time": 123, "error": "..." },
 *     "gemini": { "status": "up|down", "response_time": 456, "error": "..." },
 *     "crm_forwarding": { "status": "up|down", "response_time": 789, "error": "..." }
 *   }
 * }
 */

import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface ServiceCheck {
  status: 'up' | 'down'
  response_time: number
  error?: string
}

interface HealthResponse {
  overall_status: 'OPERATIONAL' | 'DEGRADED' | 'FAILURE'
  timestamp: string
  services: {
    supabase: ServiceCheck
    gemini: ServiceCheck
    crm_forwarding: ServiceCheck
  }
}

// Cache for health check results (10 second TTL)
interface CacheEntry {
  data: HealthResponse
  expires: number
}

let cache: CacheEntry | null = null
const CACHE_TTL_MS = 10 * 1000 // 10 seconds
const TIMEOUT_MS = 3 * 1000 // 3 seconds

/**
 * Check Supabase connectivity with a non-destructive query
 */
async function checkSupabase(abortController: AbortController): Promise<ServiceCheck> {
  const startTime = Date.now()
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        status: 'down',
        response_time: Date.now() - startTime,
        error: 'Missing Supabase configuration'
      }
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Non-destructive ping: try a simple query that should work
    const { error } = await supabase
      .rpc('ping_health_check', {})
      .abortSignal(abortController.signal)
    
    // If the ping function doesn't exist, try a simple select
    // Use error code '42883' for "function does not exist" (PostgreSQL)
    if (error && error.code === '42883') {
      const { error: selectError } = await supabase
        .from('_supabase_health_check')
        .select('count(*)')
        .limit(1)
        .abortSignal(abortController.signal)
      
      // Use error code '42P01' for "table does not exist" (PostgreSQL)
      if (selectError && selectError.code !== '42P01') {
        return {
          status: 'down',
          response_time: Date.now() - startTime,
          error: selectError.message
        }
      }
    } else if (error) {
      return {
        status: 'down',
        response_time: Date.now() - startTime,
        error: error.message
      }
    }
    
    return {
      status: 'up',
      response_time: Date.now() - startTime
    }
  } catch (error) {
    return {
      status: 'down',
      response_time: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check Gemini AI availability with timeout
 */
async function checkGemini(abortController: AbortController): Promise<ServiceCheck> {
  const startTime = Date.now()
  
  try {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return {
        status: 'down',
        response_time: Date.now() - startTime,
        error: 'Missing Gemini API key'
      }
    }
    
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    // Simple ping with minimal token usage
    const timeoutMs = 3000;
    const timeoutPromise = new Promise((_, reject) => {
      const timer = setTimeout(() => {
        abortController.abort();
        reject(new Error('Request timed out'));
      }, timeoutMs);
      abortController.signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Request aborted'));
      });
    });

    const result = await Promise.race([
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 1 }
      }),
      timeoutPromise
    ]);
    return {
      status: 'up',
      response_time: Date.now() - startTime
    }
  } catch (error) {
    return {
      status: 'down',
      response_time: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check CRM forwarding service (stub implementation)
 */
async function checkCRMForwarding(abortController: AbortController): Promise<ServiceCheck> {
  const startTime = Date.now()
  
  try {
    // Stub implementation - simulate a quick health check
    await new Promise(resolve => setTimeout(resolve, 50))
    
    if (abortController.signal.aborted) {
      throw new Error('Request timed out')
    }
    
    return {
      status: 'up',
      response_time: Date.now() - startTime
    }
  } catch (error) {
    return {
      status: 'down',
      response_time: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Aggregate service statuses into overall status
 */
function aggregateStatus(services: HealthResponse['services']): 'OPERATIONAL' | 'DEGRADED' | 'FAILURE' {
  const statuses = Object.values(services).map(service => service.status)
  
  if (statuses.every(status => status === 'up')) {
    return 'OPERATIONAL'
  } else if (statuses.every(status => status === 'down')) {
    return 'FAILURE'
  } else {
    return 'DEGRADED'
  }
}

/**
 * Perform all health checks in parallel
 */
async function performHealthChecks(): Promise<HealthResponse> {
  const abortController = new AbortController()
  
  // Set up timeout
  const timeout = setTimeout(() => {
    abortController.abort()
  }, TIMEOUT_MS)
  
  try {
    // Run all checks in parallel
    const [supabaseResult, geminiResult, crmResult] = await Promise.all([
      checkSupabase(abortController),
      checkGemini(abortController),
      checkCRMForwarding(abortController)
    ])
    
    const services = {
      supabase: supabaseResult,
      gemini: geminiResult,
      crm_forwarding: crmResult
    }
    
    return {
      overall_status: aggregateStatus(services),
      timestamp: new Date().toISOString(),
      services
    }
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Main handler function
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Only support GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }
    
    // Check cache first
    const now = Date.now()
    if (cache && cache.expires > now) {
      return res.status(200).json(cache.data)
    }
    
    // Perform health checks
    const healthResult = await performHealthChecks()
    
    // Cache the result
    cache = {
      data: healthResult,
      expires: now + CACHE_TTL_MS
    }
    
    // Return result
    return res.status(200).json(healthResult)
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return res.status(500).json({
      overall_status: 'FAILURE',
      timestamp: new Date().toISOString(),
      services: {
        supabase: { status: 'down', response_time: 0, error: 'Health check failed' },
        gemini: { status: 'down', response_time: 0, error: 'Health check failed' },
        crm_forwarding: { status: 'down', response_time: 0, error: 'Health check failed' }
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}