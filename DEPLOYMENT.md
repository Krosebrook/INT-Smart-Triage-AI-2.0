# Deployment Guide

This guide provides step-by-step instructions for deploying the INT Smart Triage AI 2.0 system to Vercel.

## Prerequisites Checklist
- [ ] GitHub repository access configured
- [ ] Vercel account with appropriate permissions
- [ ] Supabase project created (see SUPABASE_SETUP.md)
- [ ] Required API keys obtained (OpenAI, etc.)
- [ ] Domain configuration ready (if custom domain needed)

## Vercel Deployment Steps

### 1. Connect Repository to Vercel

1. **Login to Vercel Dashboard**
   - [ ] Navigate to [vercel.com](https://vercel.com)
   - [ ] Sign in with your GitHub account
   - [ ] Ensure you have access to the INT organization

2. **Import Project**
   - [ ] Click "New Project" button
   - [ ] Select "Import Git Repository"
   - [ ] Choose `Krosebrook/INT-Smart-Triage-AI-2.0`
   - [ ] Click "Import"

3. **Configure Project Settings**
   - [ ] Set Framework Preset: `Next.js` (if using Next.js) or `Other`
   - [ ] Set Build Command: `npm run build`
   - [ ] Set Output Directory: `.next` (Next.js) or `dist` (Vite/other)
   - [ ] Set Install Command: `npm ci`

### 2. Environment Variables Configuration

Configure the following environment variables in Vercel:

#### Required Environment Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-domain.vercel.app

# Security Configuration
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key_32_chars
```

#### Setting Environment Variables in Vercel
- [ ] Go to Project Settings > Environment Variables
- [ ] Add each variable with appropriate scope:
  - `Production` for live environment
  - `Preview` for PR deployments  
  - `Development` for local testing
- [ ] Ensure sensitive keys (service keys, secrets) are only in Production scope
- [ ] Verify no service keys are exposed to client-side code

### 3. First Preview Deployment

1. **Trigger Initial Build**
   - [ ] Push changes to any branch to trigger preview deployment
   - [ ] Monitor build logs in Vercel dashboard
   - [ ] Verify build completes without errors

2. **Test Preview Environment**
   - [ ] Access preview URL provided by Vercel
   - [ ] Verify application loads correctly
   - [ ] Test core functionality:
     - [ ] Ticket triage functionality
     - [ ] Database connectivity (Supabase)
     - [ ] AI service integration (OpenAI)
     - [ ] Authentication flow (if applicable)

3. **Review Build Analytics**
   - [ ] Check build time (should be < 5 minutes)
   - [ ] Verify bundle size is optimized
   - [ ] Review any warnings or performance suggestions

### 4. Production Deployment

#### Pre-Production Checklist
- [ ] All preview tests passed
- [ ] Environment variables validated
- [ ] Database migrations applied (see SUPABASE_SETUP.md)
- [ ] Security review completed (see SECURITY.md)
- [ ] Performance testing completed
- [ ] Monitoring and alerting configured

#### Promote to Production
1. **Deploy to Production**
   - [ ] Merge approved changes to `main` branch
   - [ ] Verify automatic production deployment triggers
   - [ ] Monitor deployment progress in Vercel dashboard

2. **Post-Deployment Verification**
   - [ ] Access production URL
   - [ ] Verify all environment variables are correctly applied
   - [ ] Test critical user journeys:
     - [ ] Ticket submission and triage
     - [ ] AI response generation
     - [ ] Data persistence to Supabase
     - [ ] Error handling and logging

3. **Domain Configuration (if applicable)**
   - [ ] Configure custom domain in Vercel project settings
   - [ ] Update DNS records as instructed
   - [ ] Verify SSL certificate provisioning
   - [ ] Test domain accessibility

### 5. Rollback Procedure

If issues are discovered after deployment:

1. **Immediate Rollback**
   - [ ] Go to Vercel project dashboard
   - [ ] Navigate to "Deployments" tab
   - [ ] Find last known good deployment
   - [ ] Click "Promote to Production"

2. **Verify Rollback**
   - [ ] Confirm production site is accessible
   - [ ] Test critical functionality
   - [ ] Monitor error rates in dashboard

3. **Post-Rollback Actions**
   - [ ] Create incident report
   - [ ] Notify stakeholders of rollback
   - [ ] Plan fix for identified issues

## Monitoring and Alerts

### Vercel Analytics Setup
- [ ] Enable Vercel Analytics in project settings
- [ ] Configure performance monitoring
- [ ] Set up uptime monitoring
- [ ] Configure error rate alerts

### Key Metrics to Monitor
- [ ] Response time (< 2 seconds average)
- [ ] Error rate (< 1% target)
- [ ] Build success rate (> 95%)
- [ ] Function execution time
- [ ] Bandwidth usage

## Troubleshooting

### Common Deployment Issues

**Build Failures**
- Check Node.js version compatibility
- Verify all dependencies are properly installed
- Review build logs for specific errors

**Environment Variable Issues**
- Ensure all required variables are set
- Verify variable names match exactly (case-sensitive)
- Check variable scoping (Production/Preview/Development)

**Function Timeouts**
- Review serverless function execution limits
- Optimize API calls and database queries
- Consider upgrading Vercel plan if needed

### Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://vercel.com/community)
- INT DevOps Team: devops@int-inc.com
- Emergency Contact: on-call@int-inc.com

## Security Considerations

- [ ] Never commit sensitive keys to repository
- [ ] Use Vercel's encrypted environment variables
- [ ] Regularly rotate API keys and secrets
- [ ] Monitor for unauthorized access attempts
- [ ] Keep dependencies updated

## Performance Optimization

- [ ] Enable Vercel Edge Network
- [ ] Configure appropriate caching headers
- [ ] Optimize images and static assets
- [ ] Monitor Core Web Vitals
- [ ] Use Vercel Analytics for performance insights

---

**Last Updated:** [Current Date]  
**Document Version:** 1.0  
**Review Schedule:** Monthly