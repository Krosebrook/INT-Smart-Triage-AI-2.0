# INT Smart Triage AI 2.0 - Production Deployment Guide

## 🎯 Overview
Secure, production-ready AI Triage Tool for INT Inc. Client Success. This system provides CSRs with intelligent ticket triage, empathetic talking points, Knowledge Base suggestions, and secure audit logging via Supabase with mandatory Row Level Security.

## 🔐 Security Features
- **Mandatory RLS (Row Level Security)**: Browser Supabase client locked down by default-deny policies on every exposed table
- **Service Role Authentication**: Serverless functions use service role keys only for privileged writes (never shipped to the browser)
- **Comprehensive Security Headers**: XSS, CSRF, and clickjacking protection
- **Input Validation & Sanitization**: Prevents injection attacks
- **Audit Logging**: Complete request tracking with IP and session data

## 🚀 Deployment Instructions

### 1. Vercel Deployment Setup

#### Prerequisites
- Vercel CLI installed: `npm i -g vercel`
- Supabase project created
- GitHub repository access

#### Deploy to Vercel
```bash
# Clone the repository
git clone https://github.com/Krosebrook/INT-Smart-Triage-AI-2.0.git
cd INT-Smart-Triage-AI-2.0

# Install dependencies
npm install

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 2. Environment Variables Configuration

#### Required Vercel Environment Variables
Configure these in your **Vercel Dashboard** under Project Settings → Environment Variables:

**Client-Side Variables (exposed to browser):**
- `VITE_SUPABASE_URL`: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key (safe for public exposure)

**Server-Side Variables (API endpoints only - NOT exposed to browser):**
- `SUPABASE_URL`: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for privileged operations)
- `GEMINI_API_KEY`: Google Gemini API key (optional - for AI-powered triage features)

#### Using Vercel CLI:
```bash
# Add environment variables via Vercel CLI
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add GEMINI_API_KEY production
```

⚠️ **Critical Security Notes**: 
- Client-side (`VITE_` prefixed) variables are exposed to the browser - only use anon key
- Server-side variables are secure and never exposed to the client
- The `service_role` key bypasses RLS and should only be used in API endpoints
- GEMINI_API_KEY is only used server-side for AI features

### 3. Supabase Database Setup

#### Step 1: Create Database Table
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase-setup.sql`
4. Execute the script

#### Step 2: Verify RLS Configuration
Because the CSR dashboard talks to Supabase directly from the browser, you **must** confirm RLS on every table it can touch. Run this query for each table in `('tickets','ticket_messages','customers','response_templates','knowledge_base_articles','channel_integrations','sentiment_analytics','csr_performance')`:
```sql
-- Check RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = '<table_name>') as policy_count
FROM pg_tables
WHERE tablename = '<table_name>';

-- List all policies
SELECT * FROM pg_policies WHERE tablename = '<table_name>';
```

**Expected Results:**
- `rls_enabled`: `true`
- `policy_count`: `>= 1` (at least a deny-all fallback and the scoped allow policy)
- Policies must scope access to authenticated CSR role or channel webhook as defined in `supabase-setup.sql`

### 4. Functional Testing

#### Health Check Endpoint
```bash
curl -X GET https://your-app.vercel.app/api/health-check
```

**Expected Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "INT Smart Triage AI 2.0",
  "version": "1.0.0",
  "checks": {
    "api": "healthy",
    "database": "healthy",
    "rls": "enabled"
  },
  "security": "RLS properly enforced"
}
```

#### Triage Report Endpoint
```bash
curl -X POST https://your-app.vercel.app/api/triage-report \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "ticketSubject": "Login Issue",
    "issueDescription": "Cannot login to the system",
    "customerTone": "frustrated",
    "csrAgent": "CSR_TEST"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "reportId": "TR-1234567890-ABCD",
  "priority": "medium",
  "confidence": "80%",
  "responseApproach": "Empathetic response with clear action plan...",
  "talkingPoints": ["Acknowledge their frustration...", "..."],
  "knowledgeBase": ["KB-AUTH-01: Authentication Issues...", "..."],
  "security": {
    "rlsEnforced": true,
    "auditLogged": true,
    "serverAuthorized": true
  }
}
```

## 🛡️ Security Verification Checklist

- [ ] **RLS Enabled**: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;` executed for every CSR-facing table
- [ ] **Public Access Denied**: Default policy blocks all public access (verify with anonymous session tests)
- [ ] **Service Role Access**: API can write to database using service role
- [ ] **Environment Variables**: Secrets configured in Vercel (not in code)
- [ ] **HTTPS Enforced**: All communications encrypted
- [ ] **Security Headers**: XSS, CSRF, and other protections active
- [ ] **Input Validation**: All user inputs sanitized and validated
- [ ] **Audit Logging**: All requests logged with metadata

## 🔧 System Architecture

```
CSR Interface (index.html)
    ↓ HTTPS
Supabase JS Client (anon key + RLS)
    ↘ Real-time subscriptions / filtered queries (tickets, templates, KB)
Vercel Edge Functions (e.g., /api/triage-report)
    ↓ Service Role Auth (privileged writes only)
Supabase Database (RLS Enforced)
    ↓ Audit Trail
Tables: tickets, ticket_messages, response_templates, knowledge_base_articles, customers, analytics
```

## 📊 Monitoring & Maintenance

### Health Monitoring
- Monitor `/api/health-check` endpoint
- Check Vercel function logs
- Review Supabase database performance

### Security Auditing
- Review RLS policy effectiveness
- Monitor failed authentication attempts
- Audit environment variable access

### Performance Optimization
- Monitor API response times
- Check database query performance
- Review Vercel function execution times

## 🚨 Troubleshooting

### Common Issues

1. **503 Service Unavailable from health-check**
   - Check Supabase URL and service key
   - Verify RLS policies are properly configured
   - Ensure reports table exists

2. **RLS Permission Denied (Expected)**
   - This is normal - indicates RLS is working
   - API should handle this and use service role override

3. **Environment Variables Not Found**
   - Verify secrets are set in Vercel dashboard
   - Redeploy after adding environment variables

4. **Database Connection Errors**
   - Check Supabase project is active
   - Verify service role key has correct permissions
   - Ensure database URL format is correct

## 📞 Support

For technical support or security concerns:
- Review Vercel deployment logs
- Check Supabase project dashboard
- Verify all security requirements are met

---

**🔒 Security Reminder**: The CSR dashboard embeds the Supabase JS client for low-latency reads and realtime updates. Treat RLS verification as part of every deployment—any gap immediately becomes a data exposure path. Service role keys stay server-only and are never bundled in the browser.