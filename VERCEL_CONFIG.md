# Vercel Configuration Documentation

This document explains the `vercel.json` configuration for the INT Smart Triage AI 2.0 deployment.

## Configuration Overview

The `vercel.json` file configures the deployment with the following key components:

### Runtime Configuration
- **Node.js 20**: All serverless functions use the latest Node.js 20.x runtime for optimal performance and security
- **Functions Pattern**: `api/**/*.js` targets all JavaScript files in the API directory

### Routing Rules

#### 1. Static File Routing (`/public/**`)
**Purpose**: Serve static assets like HTML, CSS, JS, and images with optimal caching
```json
{
  "src": "/public/(.*)",
  "dest": "/public/$1",
  "headers": {
    "Cache-Control": "public, max-age=31536000, immutable"
  }
}
```
- **Cache Strategy**: 1-year cache with immutable directive for performance
- **CDN Optimization**: Files served directly by Vercel's global CDN

#### 2. API Routing (`/api/**`)
**Purpose**: Route all API requests to corresponding serverless functions
```json
{
  "src": "/api/(.*)",
  "dest": "/api/$1"
}
```
- **Serverless Functions**: Automatically maps `/api/health` to `api/health.js`
- **Auto-scaling**: Functions scale automatically based on demand

#### 3. Demo Page Routing
**Purpose**: Make demo.html accessible from root path for easy testing
```json
{
  "src": "/demo.html",
  "dest": "/public/demo.html",
  "headers": {
    "Cache-Control": "public, max-age=3600"
  }
}
```
- **Accessibility**: Demo available at both `/demo.html` and `/public/demo.html`
- **Cache Duration**: 1-hour cache for demo content

#### 4. Fallback Routing
**Purpose**: Handle unmatched routes with proper 404 responses
```json
{
  "src": "/(.*)",
  "dest": "/public/$1",
  "status": 404
}
```

### Security Headers

#### API Security Headers
Applied to all `/api/**` routes:
- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing attacks
- **X-Frame-Options**: `DENY` - Prevents clickjacking attacks  
- **X-XSS-Protection**: `1; mode=block` - Enables XSS filtering

#### Static File Security
Applied to all `/public/**` routes:
- **X-Content-Type-Options**: `nosniff` - Prevents content type confusion

### Environment Configuration
- **NODE_ENV**: Set to `production` for all deployments
- **Runtime Optimization**: Production builds with enhanced performance

### Deployment Regions
- **Primary**: `iad1` (US East - Washington DC)
- **Secondary**: `sfo1` (US West - San Francisco)
- **Strategy**: Multi-region deployment for reduced latency

## Testing the Configuration

### 1. Static File Serving
- Access `/public/demo.html` - Should serve the demo page
- Access `/demo.html` - Should redirect to the demo page
- Verify cache headers in browser developer tools

### 2. API Endpoint Detection
- **Health Check**: `GET /api/health` - Should return service status
- **Triage API**: `POST /api/triage` - Should process ticket data
- Verify security headers in response

### 3. Performance Validation
- Check CDN cache hits for static files
- Verify serverless function cold start times
- Monitor response times across regions

## Troubleshooting

### Common Issues
1. **API Routes Not Found**: Ensure `.js` files are in `/api/` directory
2. **Static Files 404**: Verify files exist in `/public/` directory  
3. **Cache Issues**: Use browser force refresh (Ctrl+F5) during testing
4. **CORS Errors**: API functions include CORS headers for browser requests

### Performance Optimization
- Static files cached for 1 year (31536000 seconds)
- API responses include appropriate cache headers
- Functions use Node.js 20 for improved performance
- Multi-region deployment reduces global latency