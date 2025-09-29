# Deployment Guide

## Quick Deploy to Vercel

1. **Connect Repository to Vercel**
   ```bash
   vercel --prod
   ```

2. **Verify Deployment**
   - Static Demo: `https://your-app.vercel.app/public/demo.html`
   - Demo Shortcut: `https://your-app.vercel.app/demo.html`
   - Health API: `https://your-app.vercel.app/api/health`
   - Triage API: `https://your-app.vercel.app/api/triage`

## Configuration Summary

✅ **Static Files**: `/public/**` served with 1-year cache  
✅ **API Routes**: `/api/**` mapped to serverless functions  
✅ **Node.js 20**: Latest runtime for optimal performance  
✅ **Security**: XSS protection, MIME sniffing prevention  
✅ **Performance**: Multi-region deployment, CDN optimization  

## Testing the Deployment

### Static File Test
```bash
curl -I https://your-app.vercel.app/public/demo.html
# Should return 200 with Cache-Control headers
```

### API Health Check
```bash
curl https://your-app.vercel.app/api/health
# Should return JSON with service status
```

### AI Triage Test
```bash
curl -X POST https://your-app.vercel.app/api/triage \
  -H "Content-Type: application/json" \
  -d '{"ticket": "I need help with my password", "priority": "high"}'
# Should return AI triage analysis
```

## Architecture

```
INT-Smart-Triage-AI-2.0/
├── vercel.json          # Deployment configuration
├── package.json         # Node.js dependencies
├── public/              # Static files (CDN-served)
│   └── demo.html       # Interactive demo
└── api/                # Serverless functions
    ├── health.js       # Service health check
    └── triage.js       # AI ticket processing
```

## Performance Features

- **Edge Caching**: Static files cached globally
- **Serverless Auto-scaling**: Functions scale with demand
- **Regional Deployment**: US East/West for low latency
- **Node.js 20**: Latest runtime optimizations