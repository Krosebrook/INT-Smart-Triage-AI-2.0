# 🚀 Production Deployment Checklist

**INT Smart Triage AI 2.0**  
Use this checklist before deploying to production to ensure everything is properly configured.

---

## ✅ Pre-Deployment Checklist

### 🔐 Security & Configuration

- [ ] **Environment Variables Configured**
  - [ ] Run `npm run validate:env` to verify all required variables
  - [ ] SUPABASE_URL is set in Vercel environment variables
  - [ ] SUPABASE_SERVICE_ROLE_KEY is set (never commit this!)
  - [ ] NODE_ENV is set to "production"
  - [ ] All secrets are stored securely in Vercel (not in code)

- [ ] **Database Security**
  - [ ] Supabase RLS (Row Level Security) policies are enabled
  - [ ] RLS policies have been tested for all tables
  - [ ] Service role key is only used server-side (API routes)
  - [ ] Database migrations are up to date
  - [ ] Backup strategy is documented and tested

- [ ] **Code Security**
  - [ ] No hardcoded credentials in codebase
  - [ ] XSS protection implemented (`escapeHtml` function used)
  - [ ] Input validation on all API endpoints
  - [ ] SQL injection protection (using parameterized queries)
  - [ ] Security headers are set (X-Frame-Options, CSP, etc.)

### 🧪 Testing & Quality

- [ ] **Tests Pass**

  ```bash
  npm test
  npm run test:coverage
  ```

  - [ ] All unit tests passing
  - [ ] Coverage meets minimum requirements
  - [ ] Manual testing completed on staging

- [ ] **Code Quality**

  ```bash
  npm run lint
  npm run format:check
  npm run validate
  ```

  - [ ] No linting errors
  - [ ] Code is properly formatted
  - [ ] Build completes successfully

### 🏗️ Build & Infrastructure

- [ ] **Build Verification**
  - [ ] `npm run build` completes without errors
  - [ ] Built files are optimized and minified
  - [ ] No console.logs in production build (or using proper logging)
  - [ ] Source maps configured appropriately

- [ ] **Vercel Configuration**
  - [ ] `vercel.json` is properly configured
  - [ ] Build command is correct
  - [ ] Output directory is set correctly
  - [ ] Environment variables are set in Vercel dashboard
  - [ ] Domain is configured (if using custom domain)
  - [ ] SSL/HTTPS is enabled and enforced

### 📊 Monitoring & Observability

- [ ] **Error Monitoring** (Recommended)
  - [ ] Error tracking service configured (e.g., Sentry)
  - [ ] Alert notifications set up for critical errors
  - [ ] Error logs are accessible and monitored

- [ ] **Performance Monitoring**
  - [ ] Analytics configured (if needed)
  - [ ] Performance metrics tracked
  - [ ] API response times monitored

### 📚 Documentation

- [ ] **Project Documentation**
  - [ ] README.md is up to date
  - [ ] API endpoints are documented
  - [ ] Environment variables are documented (.env.example)
  - [ ] Deployment process is documented
  - [ ] Rollback procedure is documented

### 🔄 Deployment Process

- [ ] **Pre-Deploy Steps**
  - [ ] Create deployment branch or tag
  - [ ] Notify team of upcoming deployment
  - [ ] Database migrations ready (if any)
  - [ ] Backup current production data

- [ ] **Deploy Steps**
  1. [ ] Run `npm run validate:env` locally
  2. [ ] Commit and push all changes
  3. [ ] Create GitHub release (optional but recommended)
  4. [ ] Deploy to Vercel: `npm run deploy`
  5. [ ] Verify deployment URL is accessible

- [ ] **Post-Deploy Verification**
  - [ ] Health check endpoint returns 200: `/api/health-check`
  - [ ] Test core functionality:
    - [ ] Create a triage report
    - [ ] View report history
    - [ ] Search functionality works
    - [ ] Analytics dashboard loads
  - [ ] Check browser console for errors
  - [ ] Verify database connectivity
  - [ ] Test on multiple browsers (Chrome, Firefox, Safari)
  - [ ] Test on mobile devices

### 🎯 Feature-Specific Checks

- [ ] **Triage System**
  - [ ] AI triage logic working correctly
  - [ ] Priority assignment functioning
  - [ ] Knowledge base suggestions accurate
  - [ ] Sentiment analysis operational

- [ ] **Assignment System**
  - [ ] Auto-assignment working
  - [ ] CSR profiles accessible
  - [ ] Workload distribution correct
  - [ ] Escalation flow functional

- [ ] **Communication**
  - [ ] Email notifications sending (if configured)
  - [ ] Real-time updates working (if enabled)
  - [ ] Notification preferences respected

### 🚨 Rollback Plan

- [ ] **Rollback Procedure Documented**
  - [ ] Previous deployment is accessible
  - [ ] Rollback command documented
  - [ ] Database rollback plan (if schema changed)
  - [ ] Team knows who to contact for rollback

---

## 📋 Deployment Command Reference

```bash
# Validate environment
npm run validate:env

# Run all checks
npm run validate

# Build for production
npm run build

# Deploy to Vercel production
npm run deploy

# Or deploy using Vercel CLI directly
vercel --prod
```

---

## 🔧 Post-Deployment Monitoring

### First 24 Hours

- [ ] Monitor error rates in first hour
- [ ] Check performance metrics
- [ ] Review user feedback/support tickets
- [ ] Verify all scheduled jobs running (if any)

### First Week

- [ ] Review analytics and usage patterns
- [ ] Check for any reported issues
- [ ] Monitor database performance
- [ ] Verify backup procedures executed

---

## 📞 Emergency Contacts

**In case of critical issues:**

1. **Technical Lead:** [Name/Contact]
2. **DevOps:** [Name/Contact]
3. **Database Admin:** [Name/Contact]
4. **Vercel Support:** https://vercel.com/support

---

## 🎉 Deployment Success Criteria

Deployment is considered successful when:

- ✅ Health check endpoint returns "healthy"
- ✅ All core features are functional
- ✅ No critical errors in logs (first 30 minutes)
- ✅ Response times within acceptable range (<500ms for API)
- ✅ Database operations completing successfully
- ✅ Users can create and view triage reports

---

## 📝 Deployment Log Template

```
Deployment Date: YYYY-MM-DD HH:MM
Deployed By: [Name]
Version/Tag: v1.0.0
Environment: Production

Pre-Deployment Checks: ✅ Passed
Tests: ✅ All Passing
Build: ✅ Successful
Deployment: ✅ Successful

Post-Deployment Verification:
- Health Check: ✅
- Core Features: ✅
- Performance: ✅
- No Errors: ✅

Notes:
[Any additional notes about this deployment]

Next Steps:
[Any follow-up actions needed]
```

---

**Last Updated:** October 16, 2025  
**Version:** 1.0.0

**Remember:** When in doubt, ask! Better to double-check than to deploy with issues.
