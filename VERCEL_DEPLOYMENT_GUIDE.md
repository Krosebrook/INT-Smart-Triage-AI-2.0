# Vercel Deployment Guide for INT Smart Triage AI 2.0

## ✅ Pre-Deployment Verification

This project is **fully ready for Vercel deployment**. All configurations have been tested and verified.

### What's Ready
- ✅ Modern Vercel configuration (vercel.json)
- ✅ Vite build system properly configured
- ✅ All HTML pages build successfully
- ✅ API endpoints using ES modules (Node.js 18+)
- ✅ Static assets properly bundled
- ✅ Environment variables documented
- ✅ Security headers configured

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect: **Vite Framework**

3. **Configure Environment Variables**
   
   In Vercel Dashboard → Settings → Environment Variables, add:

   **Client-Side Variables** (exposed to browser):
   ```
   VITE_SUPABASE_URL = https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGc...your-anon-key
   ```

   **Server-Side Variables** (API endpoints only):
   ```
   SUPABASE_URL = https://your-project-id.supabase.co
   SUPABASE_ANON_KEY = eyJhbGc...your-anon-key
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...your-service-role-key
   GEMINI_API_KEY = AIzaSy...your-gemini-api-key (optional)
   ```

   **Set for:** Production, Preview, Development (select all)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~1-2 minutes)

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts to configure environment variables
```

## 🧪 Post-Deployment Testing

After deployment, verify these endpoints:

### 1. Check Landing Page
```bash
curl https://your-project.vercel.app/
# Should return 200 OK with HTML content
```

### 2. Check Client Success Portal
```bash
curl https://your-project.vercel.app/client-success-portal
# Should return 200 OK with portal HTML
```

### 3. Check Health API
```bash
curl https://your-project.vercel.app/api/health-check
# Expected response:
# {
#   "status": "healthy",
#   "service": "INT Smart Triage AI 2.0",
#   "checks": {
#     "api": "healthy",
#     "database": "healthy",
#     "rls": "enabled"
#   }
# }
```

### 4. Test Triage Report API
```bash
curl -X POST https://your-project.vercel.app/api/triage-report \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "ticketSubject": "Login Issue",
    "issueDescription": "Cannot access my account",
    "customerTone": "frustrated",
    "csrAgent": "TEST_CSR"
  }'

# Expected: 200 OK with triage analysis
```

## 📊 Build Configuration

The project uses the following verified configuration:

- **Framework**: Vite 5.x
- **Output Directory**: `dist/`
- **Build Command**: `npm run build`
- **Node Version**: 18.x or higher
- **Module System**: ES Modules (`"type": "module"` in package.json)

### Build Output
```
dist/
├── index.html                       (~5 KB)
├── client-success-portal.html       (~4 KB)
├── demo.html                        (~15 KB)
└── assets/
    ├── portal-[hash].css           (~16 KB)
    └── portal-[hash].js            (~230 KB)
```

## 🔐 Security Notes

- **RLS Enforcement**: Database access is restricted by Row Level Security
- **Service Role Key**: Only used server-side, never exposed to browser
- **Security Headers**: Automatically applied by vercel.json configuration
- **HTTPS Only**: All traffic encrypted by default on Vercel

## 🐛 Troubleshooting

### Build Fails
**Issue**: Build command not found
**Solution**: Ensure `package.json` has `"build": "vite build"` in scripts

### API Errors
**Issue**: API returns 500 errors
**Solution**: 
1. Check environment variables are set correctly in Vercel Dashboard
2. Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured
3. Check Vercel function logs for detailed error messages

### Database Connection Issues
**Issue**: "Database not initialized" error
**Solution**:
1. Verify environment variables are set in Vercel
2. Check Supabase project is active
3. Confirm database migrations have been run (see `supabase-setup.sql`)

### Static Assets Not Loading
**Issue**: CSS/JS files return 404
**Solution**: This should not happen with current configuration. If it does:
1. Check vercel.json `outputDirectory` is set to `"dist"`
2. Verify build completed successfully
3. Check Vercel deployment logs

## 📝 Deployment Checklist

Before deploying, verify:

- [ ] Code pushed to GitHub
- [ ] All dependencies in package.json
- [ ] Build completes locally: `npm run build`
- [ ] All environment variables documented
- [ ] Supabase project created and configured
- [ ] Database migrations applied (`supabase-setup.sql`)
- [ ] .env files NOT committed to git (.gitignore includes .env)

After deploying, verify:

- [ ] Landing page loads
- [ ] Client Success Portal accessible
- [ ] Demo page works
- [ ] `/api/health-check` returns healthy status
- [ ] Triage API processes requests
- [ ] Database writes successful
- [ ] Real-time features functional

## 🎯 Expected Results

**Build Time**: ~1-2 minutes
**Bundle Size**: ~245 KB uncompressed, ~59 KB gzipped
**Performance**: 
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.0s
- Lighthouse Score: 90+

## 🆘 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review Supabase project logs
3. Verify all environment variables are set
4. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
5. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed configuration

---

**Last Updated**: 2024
**Status**: ✅ Production Ready
**Tested on**: Vercel, Node.js 18+
