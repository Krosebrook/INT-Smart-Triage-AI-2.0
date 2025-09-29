# INT Smart Triage AI 2.0 - Production Deployment Guide

## 🎯 Overview
Secure, production-ready AI Triage Tool for INT Inc. Client Success. This system provides CSRs with intelligent ticket triage, empathetic talking points, Knowledge Base suggestions, and secure audit logging via Supabase with mandatory Row Level Security.

## 🔐 Security Features
- **Mandatory RLS (Row Level Security)**: Zero client-side database access
- **Service Role Authentication**: Server-side only database operations  
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

#### Required Vercel Secrets
Configure these as **Vercel Environment Variables** (NOT in code):

```bash
# Add environment variables via Vercel Dashboard or CLI
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
```

**Values to configure:**
- `SUPABASE_URL`: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (NOT the anon key!)
- `CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key (e.g., `pk_test_xxxxx`)  
- `CLERK_SECRET_KEY`: Your Clerk secret key (e.g., `sk_test_xxxxx`)

⚠️ **Critical Security Notes**: 
- Never use the `anon` key in production. Always use the `service_role` key for server-side operations with RLS bypass capabilities.
- **Clerk publishableKey is dynamically fetched from server** to prevent client-side exposure (security vulnerability prevention).

### 3. Supabase Database Setup

#### Step 1: Create Database Table
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase-setup.sql`
4. Execute the script

#### Step 2: Verify RLS Configuration
Run this query to confirm RLS is properly configured:
```sql
-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = 'reports') as policy_count
FROM pg_tables 
WHERE tablename = 'reports';

-- List all policies
SELECT * FROM pg_policies WHERE tablename = 'reports';
```

**Expected Results:**
- `rls_enabled`: `true`
- `policy_count`: `2` (deny public, allow service_role)
- Policy names: "Deny all public access", "Allow service role access"

### 4. Functional Testing

#### Authentication Config Endpoint
```bash
curl -X GET https://your-app.vercel.app/api/auth-config
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "publishableKey": "pk_test_xxxxx",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "INT Smart Triage AI 2.0",
  "authProvider": "Clerk",
  "security": {
    "serverProvided": true,
    "environmentManaged": true,
    "clientSafe": true
  }
}
```

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

- [ ] **RLS Enabled**: `ALTER TABLE reports ENABLE ROW LEVEL SECURITY;` executed
- [ ] **Public Access Denied**: Default policy blocks all public access
- [ ] **Service Role Access**: API can write to database using service role
- [ ] **Environment Variables**: Secrets configured in Vercel (not in code)
- [ ] **Clerk Authentication**: Keys managed server-side, not hardcoded in client
- [ ] **HTTPS Enforced**: All communications encrypted
- [ ] **Security Headers**: XSS, CSRF, and other protections active
- [ ] **Input Validation**: All user inputs sanitized and validated
- [ ] **Audit Logging**: All requests logged with metadata
- [ ] **Authentication Middleware**: API endpoints protected with optional/required auth

## 🔧 System Architecture

```
CSR Interface (index.html)
    ↓ HTTPS
Vercel Edge Functions
    ↓ Secure API Calls
/api/health-check.js ←→ Supabase (Health Check)
/api/triage-report.js ←→ Supabase (Secure Write)
    ↓ Service Role Auth
Supabase Database (RLS Enforced)
    ↓ Audit Trail
Reports Table (No Public Access)
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

**🔒 Security Reminder**: This system enforces zero client-side database access through mandatory RLS. All database operations are performed server-side with proper authentication and audit logging.