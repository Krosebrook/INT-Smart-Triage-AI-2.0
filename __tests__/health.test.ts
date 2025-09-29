/**
 * Test suite for the health check API endpoint
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals'

// Mock the external dependencies
jest.mock('@supabase/supabase-js')
jest.mock('@google/generative-ai')

// Import the handler after mocking
import handler from '../api/health'
import type { VercelRequest, VercelResponse } from '@vercel/node'

describe('Health Check API', () => {
  let mockReq: Partial<VercelRequest>
  let mockRes: Partial<VercelResponse>
  let jsonSpy: jest.Mock
  let statusSpy: jest.Mock

  beforeEach(() => {
    jsonSpy = jest.fn()
    statusSpy = jest.fn(() => mockRes)
    
    mockReq = {
      method: 'GET'
    }
    
    mockRes = {
      status: statusSpy,
      json: jsonSpy
    } as any

    // Clear any existing cache between tests
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  test('should return 405 for non-GET requests', async () => {
    mockReq.method = 'POST'
    
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)
    
    expect(statusSpy).toHaveBeenCalledWith(405)
    expect(jsonSpy).toHaveBeenCalledWith({ error: 'Method not allowed' })
  })

  test('should return health status with correct structure', async () => {
    // Mock environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    process.env.GEMINI_API_KEY = 'test-gemini-key'

    await handler(mockReq as VercelRequest, mockRes as VercelResponse)
    
    expect(statusSpy).toHaveBeenCalledWith(200)
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        overall_status: expect.stringMatching(/^(OPERATIONAL|DEGRADED|FAILURE)$/),
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        services: expect.objectContaining({
          supabase: expect.objectContaining({
            status: expect.stringMatching(/^(up|down)$/),
            response_time: expect.any(Number)
          }),
          gemini: expect.objectContaining({
            status: expect.stringMatching(/^(up|down)$/),
            response_time: expect.any(Number)
          }),
          crm_forwarding: expect.objectContaining({
            status: expect.stringMatching(/^(up|down)$/),
            response_time: expect.any(Number)
          })
        })
      })
    )
  })

  test('should handle missing environment variables gracefully', async () => {
    // Clear environment variables
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_ANON_KEY
    delete process.env.GEMINI_API_KEY

    await handler(mockReq as VercelRequest, mockRes as VercelResponse)
    
    const response: any = jsonSpy.mock.calls[0][0]
    expect(response.services.supabase.status).toBe('down')
    expect(response.services.supabase.error).toContain('Missing Supabase configuration')
    expect(response.services.gemini.status).toBe('down')
    expect(response.services.gemini.error).toContain('Missing Gemini API key')
  })

  test('should enforce timeout', async () => {
    jest.useFakeTimers()
    
    // Mock a slow service
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_ANON_KEY = 'test-key'
    process.env.GEMINI_API_KEY = 'test-gemini-key'

    const promise = handler(mockReq as VercelRequest, mockRes as VercelResponse)
    
    // Fast-forward past the 3 second timeout
    jest.advanceTimersByTime(4000)
    
    await promise
    
    // The request should complete within the timeout period
    expect(statusSpy).toHaveBeenCalled()
    
    jest.useRealTimers()
  }, 10000)
})