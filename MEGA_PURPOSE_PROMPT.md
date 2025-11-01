# Mega Purpose Prompt: INT Smart Triage AI 2.0

## The Unified Command - Complete System Specification

---

## Executive Summary

**Mission Statement**: Build a complete, production-grade INT Smart Triage AI application for a 'nocode/vibecode' professional. The goal is to create a system that is secure, resilient, auditable, and easily understood.

**System Role**: You are a full-stack developer and AI systems architect executing a complex, multi-layered project with a single, highly-structured command.

---

## 🎯 Core Objectives

### 1. System Completeness
The system MUST include all four essential project files:
- ✅ `index.html` - CSR Dashboard Interface with modern UI/UX
- ✅ `package.json` - Complete dependency and build configuration
- ✅ `api/triage-report.js` - Secure triage processing with RLS enforcement
- ✅ `api/health-check.js` - System health monitoring with recursive checks

### 2. Deployment Architecture
- **Platform**: Vercel Serverless Functions
- **Database**: Supabase PostgreSQL with mandatory RLS
- **Security**: Service role authentication, zero client-side DB access
- **Scalability**: Edge-optimized with automatic scaling

### 3. Security Mandates (Non-Negotiable)
All security policies MUST be explicitly enforced:

#### Row Level Security (RLS)
- ✅ Mandatory RLS enabled on all database tables
- ✅ Public access DENIED by policy
- ✅ Service role access ONLY for server-side operations
- ✅ Zero client-side database access under any circumstance

#### Environment Variable Security
- ✅ All secrets stored as Vercel Environment Variables
- ✅ `SUPABASE_URL` - Project connection string
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Server authentication (NOT anon key)
- ✅ NO hardcoded credentials in source code

#### Security Headers
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Strict-Transport-Security: max-age=31536000
- ✅ Content-Security-Policy: default-src 'self'
- ✅ Referrer-Policy: strict-origin-when-cross-origin

---

## 🔄 System Resilience Requirements

### Asynchronous Database Operations
All database writes MUST be asynchronous to prevent timing issues:
```javascript
// ✅ CORRECT: Asynchronous with proper error handling
const { data, error } = await supabase
    .from('reports')
    .insert([reportData])
    .select()
    .single();

if (error) {
    // Handle RLS enforcement and retry logic
}
```

### Recursive Health Check System
The health check MUST include:
- **Timeout Protection**: 3-second maximum execution time
- **Cache Strategy**: 10-second cache duration for efficiency
- **Recursive Verification**: Database connectivity → RLS status → Policy validation
- **Graceful Degradation**: System remains operational during checks

```javascript
// Health check with timeout and caching
const CACHE_DURATION = 10000; // 10 seconds
const TIMEOUT_DURATION = 3000; // 3 seconds

const healthCheck = new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
        reject(new Error('Health check timeout after 3 seconds'));
    }, TIMEOUT_DURATION);
    
    try {
        const result = await performHealthCheck();
        clearTimeout(timeout);
        resolve(result);
    } catch (error) {
        clearTimeout(timeout);
        reject(error);
    }
});
```

---

## 🛡️ Audit and Compliance Requirements

### Complete Audit Trail
Every triage operation MUST log:
- Report ID (unique identifier)
- Customer information (sanitized)
- Ticket details and priority
- AI triage results
- CSR agent identifier
- IP address and user agent
- Session identifier
- Timestamps (created_at, processed_at, updated_at)

### Input Validation and Sanitization
All user inputs MUST be validated and sanitized:
```javascript
const sanitizedData = {
    customerName: customerName.trim().substring(0, 100),
    ticketSubject: ticketSubject.trim().substring(0, 200),
    issueDescription: issueDescription.trim().substring(0, 2000),
    customerTone: customerTone.trim().toLowerCase()
};

// Validate against whitelist
const validTones = ['calm', 'frustrated', 'angry', 'confused', 'urgent'];
if (!validTones.includes(sanitizedData.customerTone)) {
    return error response;
}
```

### LLM Response Validation
AI/LLM JSON responses MUST be validated:
```javascript
// Validate structure
if (!triageResults || typeof triageResults !== 'object') {
    throw new Error('Invalid triage results structure');
}

// Validate required fields
const requiredFields = ['priority', 'confidence', 'responseApproach', 'talkingPoints', 'knowledgeBase'];
for (const field of requiredFields) {
    if (!triageResults[field]) {
        throw new Error(`Missing field: ${field}`);
    }
}

// Validate arrays
if (!Array.isArray(triageResults.talkingPoints) || !Array.isArray(triageResults.knowledgeBase)) {
    throw new Error('Invalid JSON array structure');
}
```

---

## 🎨 User Experience Requirements

### CSR Dashboard (index.html)
- Modern, professional UI with gradient design
- Real-time system status indicator
- Intuitive form with clear labels and validation
- Loading states and error handling
- Results display with color-coded priorities
- Responsive design for all devices

### Priority Classification
- **HIGH**: Critical issues, angry customers, system outages
- **MEDIUM**: Standard issues, technical problems
- **LOW**: General questions, feature requests

### Tone-Aware Response Generation
Different approaches based on customer tone:
- **Angry**: Immediate acknowledgment, de-escalation, compensation
- **Frustrated**: Empathetic response, clear action plan, frequent updates
- **Confused**: Patient education, step-by-step guidance, visual aids
- **Urgent**: Immediate response, escalation, priority handling
- **Calm**: Standard empathetic response, technical focus

---

## 📊 AI Triage Logic

### Processing Pipeline
1. **Input Reception**: Receive and validate ticket data
2. **Priority Analysis**: Keyword detection + tone assessment
3. **Confidence Scoring**: 75-90% based on criteria matches
4. **Response Strategy**: Tone-appropriate talking points
5. **Knowledge Base Matching**: Context-aware article suggestions
6. **Database Logging**: Secure RLS-enforced audit trail

### Priority Determination Algorithm
```javascript
High Priority Indicators:
- Keywords: 'down', 'outage', 'critical', 'urgent', 'broken', 'not working', 'crashed'
- Customer Tone: 'angry' OR 'urgent'
- Confidence: 90%

Medium Priority Indicators:
- Keywords: 'slow', 'issue', 'problem', 'error', 'bug'
- Standard tone contexts
- Confidence: 75-85%

Low Priority Indicators:
- Keywords: 'question', 'help', 'how to', 'feature', 'enhancement'
- Customer Tone: 'calm'
- Confidence: 85%
```

---

## 🔍 Pre-Mortem Analysis Requirement

**MANDATORY**: Before generating any code or system implementation, perform a pre-mortem analysis predicting THREE specific ways the system could fail.

Document:
1. **Failure Mode 1**: Specific scenario, impact, and mitigation
2. **Failure Mode 2**: Specific scenario, impact, and mitigation
3. **Failure Mode 3**: Specific scenario, impact, and mitigation

Reference: See [PRE_MORTEM_RISK_REPORT.md](./PRE_MORTEM_RISK_REPORT.md)

---

## ✅ Final Audit Report Requirement

**MANDATORY**: Generate a comprehensive final audit report confirming all security and structural mandates have been met.

The audit MUST verify:
- All four project files exist and are production-ready
- RLS policies are properly enforced
- Vercel secrets are configured (not hardcoded)
- Asynchronous database operations are implemented
- Recursive health checks are functional
- Input validation and sanitization are complete
- Error handling is comprehensive
- Security headers are properly set
- Audit logging captures all required fields

Reference: See [FINAL_AUDIT_REPORT.md](./FINAL_AUDIT_REPORT.md)

---

## 📁 Complete System Structure

```
INT-Smart-Triage-AI-2.0/
├── index.html                  # CSR Dashboard (Frontend)
├── package.json                # Dependencies & Scripts
├── vercel.json                 # Deployment Configuration
│
├── api/
│   ├── health-check.js        # System Health Monitoring
│   └── triage-report.js       # Secure Triage Processing
│
├── supabase-setup.sql         # Database Schema & RLS Policies
├── DEPLOYMENT.md              # Production Deployment Guide
├── MEGA_PURPOSE_PROMPT.md     # This File - Unified Command
├── PRE_MORTEM_RISK_REPORT.md  # Failure Analysis & Mitigation
└── FINAL_AUDIT_REPORT.md      # Security & Compliance Verification
```

---

## 🚀 Deployment Checklist

### Phase 1: Environment Setup
- [ ] Vercel account configured
- [ ] Supabase project created
- [ ] Repository cloned locally
- [ ] Dependencies installed (`npm install`)

### Phase 2: Security Configuration
- [ ] `SUPABASE_URL` added to Vercel Environment Variables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added to Vercel Environment Variables
- [ ] Database schema executed (`supabase-setup.sql`)
- [ ] RLS policies verified and enforced

### Phase 3: Deployment
- [ ] Vercel CLI authenticated (`vercel login`)
- [ ] Production deployment (`vercel --prod`)
- [ ] Health check endpoint validated (200 OK)
- [ ] Triage endpoint tested with sample data

### Phase 4: Validation
- [ ] Pre-mortem analysis completed
- [ ] All security mandates verified
- [ ] Audit report generated and reviewed
- [ ] System resilience tested (timeout handling, caching, error recovery)

---

## 🎓 Design Philosophy

### For No-Code/Vibe-Code Professionals
This system is designed to be:
- **Understandable**: Clear naming, comprehensive comments, logical structure
- **Secure by Default**: Security is built-in, not bolted-on
- **Production-Ready**: No prototype code, all enterprise-grade
- **Well-Documented**: Every decision explained, every pattern justified
- **Resilient**: Graceful error handling, no silent failures
- **Auditable**: Complete paper trail for compliance and debugging

### Key Design Decisions

1. **Serverless Architecture**: Automatic scaling, pay-per-use, zero DevOps
2. **Mandatory RLS**: Security cannot be accidentally disabled
3. **Service Role Only**: Client can never directly access database
4. **Comprehensive Validation**: Trust nothing, verify everything
5. **Async-First Design**: No blocking operations, responsive under load
6. **Cache-Aware**: Reduce database load without sacrificing freshness

---

## 📞 Support and Maintenance

### Monitoring
- Health check endpoint: `/api/health-check`
- Vercel deployment logs
- Supabase database metrics
- RLS policy effectiveness

### Common Issues and Solutions
See [DEPLOYMENT.md](./DEPLOYMENT.md) - Troubleshooting section

### Security Incident Response
1. Check Vercel function logs
2. Verify Supabase audit trail
3. Review RLS policy violations
4. Confirm environment variables are secure

---

## 🏆 Success Criteria

The system is considered successfully implemented when:

✅ **All Four Files Present**: index.html, package.json, api/triage-report.js, api/health-check.js  
✅ **Pre-Mortem Completed**: Three failure modes documented with mitigations  
✅ **Audit Report Generated**: All security and structural mandates verified  
✅ **Deployment Successful**: System running on Vercel with Supabase backend  
✅ **RLS Enforced**: Zero client-side database access confirmed  
✅ **Health Checks Pass**: Recursive validation with 3s timeout and 10s cache  
✅ **Async Operations**: All database writes are non-blocking  
✅ **Error Handling**: Graceful degradation in all failure scenarios  
✅ **Audit Logging**: Complete paper trail for all operations  
✅ **Security Headers**: All recommended headers properly set  

---

## 📝 Version History

- **v1.0.0** (Current): Initial production release with complete Mega Purpose Prompt documentation
- All requirements from the pyramid architecture synthesized into this unified command

---

**Built with security-first design principles for INT Inc. Customer Success**

**Status**: ✅ Production-Ready | 🔒 Enterprise-Grade Security | 📊 Fully Auditable
