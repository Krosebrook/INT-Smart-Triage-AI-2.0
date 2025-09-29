# Health Check API Documentation

## Overview

The Health Check API endpoint (`/api/health`) provides a robust health probe for the INT Smart Triage AI system. It performs parallel health checks on critical services and returns an aggregated status with detailed service information.

## Endpoint

- **URL:** `/api/health`
- **Method:** `GET`
- **Function Timeout:** 10 seconds (Vercel configuration)

## Features

### 🚀 Parallel Service Checks
- **Supabase**: Non-destructive connectivity test via database query
- **Gemini AI**: API availability check with minimal token usage
- **CRM Forwarding**: Stub implementation (placeholder for future enhancement)

### ⚡ Performance Optimizations
- **Parallel Execution**: All checks run simultaneously using `Promise.all()`
- **Result Caching**: 10-second TTL to reduce load on backend services
- **Timeout Protection**: 3-second timeout via `AbortController`

### 📊 Status Aggregation
- **OPERATIONAL**: All services are up and running
- **DEGRADED**: Some services are down but system is partially functional
- **FAILURE**: Critical services are down or all services are unavailable

## Response Format

```json
{
  "overall_status": "OPERATIONAL|DEGRADED|FAILURE",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "services": {
    "supabase": {
      "status": "up|down",
      "response_time": 123,
      "error": "Optional error message"
    },
    "gemini": {
      "status": "up|down", 
      "response_time": 456,
      "error": "Optional error message"
    },
    "crm_forwarding": {
      "status": "up|down",
      "response_time": 789,
      "error": "Optional error message"
    }
  }
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes |

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

## HTTP Status Codes

- **200 OK**: Health check completed successfully
- **405 Method Not Allowed**: Non-GET request attempted
- **500 Internal Server Error**: Health check system failure

## Caching Behavior

The endpoint caches successful responses for **10 seconds** to prevent overwhelming backend services with frequent health checks. During the cache period, all requests will return the same response with identical timestamps.

## Timeout Handling

All service checks are subject to a **3-second timeout** enforced by `AbortController`. Services that don't respond within this timeframe are marked as "down" with appropriate error messages.

## Usage Examples

### Basic Health Check
```bash
curl https://your-domain.vercel.app/api/health
```

### Load Balancer Integration
Most load balancers can use this endpoint directly:
```yaml
# Example for k8s ingress
healthcheck:
  path: /api/health
  interval: 30s
  timeout: 5s
  retries: 3
```

### Monitoring Integration
The endpoint is designed for monitoring systems like:
- Uptime Robot
- Pingdom
- StatusCake
- Custom monitoring dashboards

## Development

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npx tsc --noEmit
```

### Local Development
```bash
npm run dev
```

## Architecture Notes

- **Serverless**: Optimized for Vercel Functions
- **TypeScript**: Full type safety
- **Error Handling**: Comprehensive error catching and reporting  
- **Observability**: Structured logging for debugging
- **Security**: Environment variable validation

## Future Enhancements

- [ ] Metrics collection and reporting
- [ ] Custom health check configuration
- [ ] Database-specific health queries
- [ ] Circuit breaker pattern implementation
- [ ] Health check history tracking