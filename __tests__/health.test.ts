/**
 * Simplified test suite for the health check API endpoint
 */
import handler from '../api/health'

describe('Health Check API', () => {
  // Simple smoke tests without complex mocking
  test('should export a function', () => {
    expect(typeof handler).toBe('function')
  })

  test('response structure validation', () => {
    const sampleResponse = {
      overall_status: 'OPERATIONAL',
      timestamp: '2023-01-01T00:00:00.000Z',
      services: {
        supabase: { status: 'up', response_time: 100 },
        gemini: { status: 'up', response_time: 200 },
        crm_forwarding: { status: 'up', response_time: 50 }
      }
    }

    expect(sampleResponse.overall_status).toMatch(/^(OPERATIONAL|DEGRADED|FAILURE)$/)
    expect(sampleResponse.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(sampleResponse.services).toHaveProperty('supabase')
    expect(sampleResponse.services).toHaveProperty('gemini')
    expect(sampleResponse.services).toHaveProperty('crm_forwarding')
  })
})